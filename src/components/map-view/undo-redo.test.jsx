import './test-setup';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect } from 'vitest';
import MapView from './index';
import { mockMapResult } from './test-setup';

test('pressing Space to enable a room sets canUndo to true and canRedo to false', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');
  const controls = screen.getByTestId('map-name-input').closest('[data-can-undo]');
  expect(controls.dataset.canUndo).toBe('false');
  expect(controls.dataset.canRedo).toBe('false');
  await user.keyboard(' ');
  expect(controls.dataset.canUndo).toBe('true');
  expect(controls.dataset.canRedo).toBe('false');
});

test('extending map north sets canUndo to true', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');
  const controls = screen.getByTestId('map-name-input').closest('[data-can-undo]');
  expect(controls.dataset.canUndo).toBe('false');
  await user.click(screen.getByTestId('extend-add-north'));
  expect(controls.dataset.canUndo).toBe('true');
});

test('Ctrl+Z after enabling a room restores the room to disabled', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const x = Number(canvas.dataset.focusX);
  const y = Number(canvas.dataset.focusY);

  await user.keyboard(' ');
  expect(JSON.parse(canvas.dataset.mapData)[x][y].enabled).toBe(true);

  await user.keyboard('{Control>}z{/Control}');

  expect(JSON.parse(canvas.dataset.mapData)[x][y].enabled).toBeFalsy();
});

test('Ctrl+Shift+Z after undo restores the room to enabled', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const x = Number(canvas.dataset.focusX);
  const y = Number(canvas.dataset.focusY);

  await user.keyboard(' ');
  await user.keyboard('{Control>}z{/Control}');
  expect(JSON.parse(canvas.dataset.mapData)[x][y].enabled).toBeFalsy();

  await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');

  expect(JSON.parse(canvas.dataset.mapData)[x][y].enabled).toBe(true);
});

test('Ctrl+Z sets canUndo false and canRedo true when stack has one entry', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');
  const controls = screen.getByTestId('map-name-input').closest('[data-can-undo]');

  await user.keyboard(' ');
  expect(controls.dataset.canUndo).toBe('true');

  await user.keyboard('{Control>}z{/Control}');

  expect(controls.dataset.canUndo).toBe('false');
  expect(controls.dataset.canRedo).toBe('true');
});

test('Ctrl+Z is a no-op when undoStack is empty', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  // Wait for map data to be synced from DB result
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const mapDataBefore = canvas.dataset.mapData;

  await user.keyboard('{Control>}z{/Control}');

  expect(canvas.dataset.mapData).toBe(mapDataBefore);
});

test('Ctrl+Shift+Z is a no-op when redoStack is empty', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  // Wait for map data to be synced from DB result
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const controls = screen.getByTestId('map-name-input').closest('[data-can-undo]');
  const mapDataBefore = canvas.dataset.mapData;

  await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');

  expect(canvas.dataset.mapData).toBe(mapDataBefore);
  expect(controls.dataset.canRedo).toBe('false');
});

test('multiple undos work sequentially: 3 edits then 3 undos restores original state', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const x = Number(canvas.dataset.focusX); // 2
  const y = Number(canvas.dataset.focusY); // 2

  const originalMapData = canvas.dataset.mapData;

  // Edit 1: enable room at focus
  await user.keyboard(' ');
  expect(JSON.parse(canvas.dataset.mapData)[x][y].enabled).toBe(true);

  // Edit 2: move north and enable that room
  await user.keyboard('8');
  await user.keyboard(' ');
  expect(JSON.parse(canvas.dataset.mapData)[x][y - 1].enabled).toBe(true);

  // Edit 3: toggle up exit on the current room
  await user.keyboard('u');
  expect(JSON.parse(canvas.dataset.mapData)[x][y - 1].exits?.up).toBe(true);

  // Undo 3 times
  await user.keyboard('{Control>}z{/Control}');
  expect(JSON.parse(canvas.dataset.mapData)[x][y - 1].exits?.up).toBeFalsy();

  await user.keyboard('{Control>}z{/Control}');
  expect(JSON.parse(canvas.dataset.mapData)[x][y - 1].enabled).toBeFalsy();

  await user.keyboard('{Control>}z{/Control}');
  expect(JSON.parse(canvas.dataset.mapData)[x][y].enabled).toBeFalsy();

  expect(canvas.dataset.mapData).toBe(originalMapData);
});

test('redo after a new edit clears the redo stack', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const controls = screen.getByTestId('map-name-input').closest('[data-can-undo]');
  const x = Number(canvas.dataset.focusX);
  const y = Number(canvas.dataset.focusY);

  // Make an edit
  await user.keyboard(' ');
  expect(JSON.parse(canvas.dataset.mapData)[x][y].enabled).toBe(true);

  // Undo it
  await user.keyboard('{Control>}z{/Control}');
  expect(controls.dataset.canRedo).toBe('true');

  // Make a new edit (this should clear the redo stack)
  await user.keyboard('u');

  expect(controls.dataset.canRedo).toBe('false');
});

test('saving the map clears canUndo and canRedo', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');
  const controls = screen.getByTestId('map-name-input').closest('[data-can-undo]');

  await user.keyboard(' ');
  expect(controls.dataset.canUndo).toBe('true');

  await user.click(screen.getByTestId('save-btn'));

  await vi.waitFor(() => {
    expect(controls.dataset.canUndo).toBe('false');
    expect(controls.dataset.canRedo).toBe('false');
  });
});

test('handleExitColorChange sets a custom exit color on the focused room', async () => {
  const user = userEvent.setup();
  render(<MapView />);

  const canvas = await screen.findByTestId('map-canvas');
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const x = Number(canvas.dataset.focusX); // 2
  const y = Number(canvas.dataset.focusY); // 2

  await user.click(screen.getByTestId('set-north-exit-color'));

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[x][y].exitColors?.north).toBe('#ff0000');
});

test('handleExitColorChange removes the exitColors key when color is the default #666666', async () => {
  const user = userEvent.setup();
  render(<MapView />);

  const canvas = await screen.findByTestId('map-canvas');
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const x = Number(canvas.dataset.focusX);
  const y = Number(canvas.dataset.focusY);

  // Set a custom color first
  await user.click(screen.getByTestId('set-north-exit-color'));
  let mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[x][y].exitColors?.north).toBe('#ff0000');

  // Reset to default — key should be removed
  await user.click(screen.getByTestId('reset-north-exit-color'));
  mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[x][y].exitColors?.north).toBeUndefined();
});

test('handleExitColorChange applies exit color to all selected cells', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  // ctrl-click cell-1-1 to add it to the selection alongside the focused cell (2,2)
  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ControlLeft]');

  await user.click(screen.getByTestId('set-north-exit-color'));

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[1][1].exitColors?.north).toBe('#ff0000'); // selected cell
  expect(mapData[2][2].exitColors?.north).toBe('#ff0000'); // focus cell
});
