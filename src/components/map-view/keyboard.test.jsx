import './test-setup';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect } from 'vitest';
import MapView from './index';
import { mockMapResult, mockKonvaStage, createMockMapData } from './test-setup';

test('pressing a number key while an input is focused does not move map focus', async () => {
  const user = userEvent.setup();
  render(<MapView />);

  const canvas = await screen.findByTestId('map-canvas');
  // Wait for focus coords to be synced from DB result (two-render-cycle with async getMap)
  await waitFor(() => expect(canvas.dataset.focusX).toBe(String(mockMapResult.focusX)));
  const input = screen.getByTestId('map-name-input');

  const initialFocusX = canvas.dataset.focusX;
  const initialFocusY = canvas.dataset.focusY;

  await user.click(input);
  await user.keyboard('8'); // '8' maps to direction N (newY--)

  expect(canvas.dataset.focusX).toBe(initialFocusX);
  expect(canvas.dataset.focusY).toBe(initialFocusY);
});

test('pressing a number key while no input is focused moves map focus', async () => {
  const user = userEvent.setup();
  render(<MapView />);

  const canvas = await screen.findByTestId('map-canvas');
  // Wait for focus coords to be synced from DB result
  await waitFor(() => expect(canvas.dataset.focusY).toBe('2'));
  const initialFocusY = Number(canvas.dataset.focusY);

  // No input focused — document.activeElement is body
  await user.keyboard('8'); // '8' maps to direction N (newY--)

  expect(Number(canvas.dataset.focusY)).toBe(initialFocusY - 1);
});

test('pressing Space enables the focused room', async () => {
  const user = userEvent.setup();
  render(<MapView />);

  const canvas = await screen.findByTestId('map-canvas');
  // Wait for focus coords to be synced from DB result
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const x = Number(canvas.dataset.focusX); // 2
  const y = Number(canvas.dataset.focusY); // 2

  // room starts disabled
  let mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[x][y].enabled).toBeFalsy();

  await user.keyboard(' ');

  mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[x][y].enabled).toBe(true);
});

test('pressing t focuses the room label input', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');
  const textInput = screen.getByTestId('room-text-input');
  await user.keyboard('t');
  expect(textInput).toHaveFocus();
});

test('pressing u toggles exits.up on the focused room', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const x = Number(canvas.dataset.focusX);
  const y = Number(canvas.dataset.focusY);

  await user.keyboard('u');

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[x][y].exits?.up).toBe(true);

  // pressing again toggles it off
  await user.keyboard('u');
  const mapData2 = JSON.parse(canvas.dataset.mapData);
  expect(mapData2[x][y].exits?.up).toBeFalsy();
});

test('pressing d toggles exits.down on the focused room', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const x = Number(canvas.dataset.focusX);
  const y = Number(canvas.dataset.focusY);

  await user.keyboard('d');

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[x][y].exits?.down).toBe(true);
});

test('[ key decrements focusLayer', async () => {
  mockMapResult.layers = [
    { name: 'L1', data: createMockMapData() },
    { name: 'L2', data: createMockMapData() },
  ];
  mockMapResult.focusLayer = 1;
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await waitFor(() => expect(canvas).toHaveAttribute('data-focus-layer', '1'));
  await userEvent.keyboard('{[}');
  expect(canvas).toHaveAttribute('data-focus-layer', '0');
});

test('] key increments focusLayer', async () => {
  mockMapResult.layers = [
    { name: 'L1', data: createMockMapData() },
    { name: 'L2', data: createMockMapData() },
  ];
  mockMapResult.focusLayer = 0;
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await userEvent.keyboard('{]}');
  expect(canvas).toHaveAttribute('data-focus-layer', '1');
});

test('[ wraps from layer 0 to last layer', async () => {
  mockMapResult.layers = [
    { id: 'a', name: 'L1', data: createMockMapData() },
    { id: 'b', name: 'L2', data: createMockMapData() },
    { id: 'c', name: 'L3', data: createMockMapData() },
  ];
  mockMapResult.focusLayer = 0;
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await waitFor(() => expect(canvas).toHaveAttribute('data-focus-layer', '0'));
  await user.keyboard('{[}');
  expect(canvas).toHaveAttribute('data-focus-layer', '2');
});

test('] wraps from last layer to layer 0', async () => {
  mockMapResult.layers = [
    { id: 'a', name: 'L1', data: createMockMapData() },
    { id: 'b', name: 'L2', data: createMockMapData() },
  ];
  mockMapResult.focusLayer = 1;
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await waitFor(() => expect(canvas).toHaveAttribute('data-focus-layer', '1'));
  await user.keyboard('{]}');
  expect(canvas).toHaveAttribute('data-focus-layer', '0');
});

test('deleting a layer below the current focusLayer decrements focusLayer by 1', async () => {
  mockMapResult.layers = [
    { name: 'L0', data: createMockMapData() },
    { name: 'L1', data: createMockMapData() },
    { name: 'L2', data: createMockMapData() },
  ];
  mockMapResult.focusLayer = 2;
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  // Wait for focusLayer to be synced from DB result (two-render-cycle with async getMap)
  await waitFor(() => expect(canvas).toHaveAttribute('data-focus-layer', '2'));
  // Delete layer 0 (below focusLayer 2) — focusLayer should shift to 1
  await user.click(screen.getByTestId('delete-layer-0'));
  expect(canvas).toHaveAttribute('data-focus-layer', '1');
});

test('pressing s saves the map (clears canUndo and canRedo)', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');
  const controls = screen.getByTestId('map-name-input').closest('[data-can-undo]');

  // make an edit so canUndo becomes true
  await user.keyboard(' ');
  expect(controls.dataset.canUndo).toBe('true');

  await user.keyboard('s');

  await vi.waitFor(() => {
    expect(controls.dataset.canUndo).toBe('false');
    expect(controls.dataset.canRedo).toBe('false');
  });
});

test('pressing s when an input is focused does not save', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');
  const controls = screen.getByTestId('map-name-input').closest('[data-can-undo]');

  await user.keyboard(' ');
  expect(controls.dataset.canUndo).toBe('true');

  await user.click(screen.getByTestId('map-name-input'));
  await user.keyboard('s');

  // undo stack unchanged — save did not run
  expect(controls.dataset.canUndo).toBe('true');
});

test('pressing p triggers map export (Konva.Stage is instantiated)', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');

  await user.keyboard('p');

  await vi.waitFor(() => {
    expect(mockKonvaStage.add).toHaveBeenCalled();
  });
});

test('pressing p when an input is focused does not trigger export', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');

  await user.click(screen.getByTestId('map-name-input'));
  await user.keyboard('p');

  expect(mockKonvaStage.add).not.toHaveBeenCalled();
});
