import './test-setup';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect } from 'vitest';
import MapView from './index';
import { mockMapResult } from './test-setup';

test('clicking a cell without modifier moves focus and clears selection', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ControlLeft]');
  await user.click(screen.getByTestId('cell-0-0'));

  expect(canvas.dataset.focusX).toBe('0');
  expect(canvas.dataset.focusY).toBe('0');
  const selectedCells = JSON.parse(canvas.dataset.selectedCells);
  expect(selectedCells).toHaveLength(0);
});

test('ctrl+clicking a cell adds it to the selection without moving focus', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ControlLeft]');

  const selectedCells = JSON.parse(canvas.dataset.selectedCells);
  expect(selectedCells).toContain('1,1');
  expect(canvas.dataset.focusX).toBe('2');
  expect(canvas.dataset.focusY).toBe('2');
});

test('ctrl+clicking a cell already in the selection removes it', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ControlLeft]');
  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ControlLeft]');

  const selectedCells = JSON.parse(canvas.dataset.selectedCells);
  expect(selectedCells).not.toContain('1,1');
});

test('pressing Escape clears the selection', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ControlLeft]');
  expect(JSON.parse(canvas.dataset.selectedCells).length).toBeGreaterThan(0);

  await user.keyboard('{Escape}');

  expect(JSON.parse(canvas.dataset.selectedCells)).toHaveLength(0);
});

test('ctrl+arrow adds new focus cell to selection and moves focus', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  await user.keyboard('{Control>}8{/Control}'); // ctrl+8 = north

  const selectedCells = JSON.parse(canvas.dataset.selectedCells);
  expect(selectedCells).toContain('2,1'); // moved north from (2,2)
  expect(canvas.dataset.focusX).toBe('2');
  expect(canvas.dataset.focusY).toBe('1');
});

test('plain arrow clears selection and moves focus', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  await user.keyboard('{Control>}8{/Control}');
  expect(JSON.parse(canvas.dataset.selectedCells).length).toBeGreaterThan(0);

  await user.keyboard('8');

  expect(JSON.parse(canvas.dataset.selectedCells)).toHaveLength(0);
  expect(canvas.dataset.focusY).toBe('0'); // moved north again from y=1
});

test('shift+arrow fills rectangle from anchor to new focus and moves focus', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  // anchor=(2,2); shift+8 moves focus north to (2,1); rect (2,1)-(2,2)
  await user.keyboard('{Shift>}8{/Shift}');

  const selectedCells = JSON.parse(canvas.dataset.selectedCells);
  expect(selectedCells).toContain('2,1');
  expect(selectedCells).toContain('2,2');
  expect(canvas.dataset.focusX).toBe('2');
  expect(canvas.dataset.focusY).toBe('1');
});

test('shift+arrow on multiple steps grows rectangle from fixed anchor', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  // anchor=(2,2); shift+8 twice: first step fills (2,1)-(2,2), second fills (2,0)-(2,2)
  await user.keyboard('{Shift>}8{/Shift}');
  await user.keyboard('{Shift>}8{/Shift}');

  const selectedCells = JSON.parse(canvas.dataset.selectedCells);
  expect(selectedCells).toContain('2,0');
  expect(selectedCells).toContain('2,1');
  expect(selectedCells).toContain('2,2');
  expect(canvas.dataset.focusY).toBe('0');
});

test('shift+arrow unions rectangle with existing ctrl-selected cells', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  // ctrl+click to scatter-select (0,0)
  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-0-0'));
  await user.keyboard('[/ControlLeft]');

  // shift+arrow north from anchor (2,2): rect (2,1)-(2,2)
  await user.keyboard('{Shift>}8{/Shift}');

  const selectedCells = JSON.parse(canvas.dataset.selectedCells);
  expect(selectedCells).toContain('0,0'); // ctrl-picked preserved
  expect(selectedCells).toContain('2,1');
  expect(selectedCells).toContain('2,2');
});

test('shift+arrow at map boundary does not move focus or change selection', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  // Move focus to top of map (y=0) with two plain presses north
  await user.keyboard('8');
  await user.keyboard('8');
  expect(canvas.dataset.focusY).toBe('0');

  const selectionBefore = JSON.parse(canvas.dataset.selectedCells);

  // Shift+arrow north from y=0 — out of bounds, should no-op
  await user.keyboard('{Shift>}8{/Shift}');

  expect(canvas.dataset.focusY).toBe('0');
  expect(JSON.parse(canvas.dataset.selectedCells)).toEqual(selectionBefore);
});

test('plain arrow resets anchor so next shift+arrow fills from new position', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  // Wait for focus coords to be synced from DB result
  await waitFor(() => expect(canvas.dataset.focusY).toBe('2'));

  // Start: focus=(2,2), anchor=(2,2)
  // Plain arrow north: focus=(2,1), anchor=(2,1), selection cleared
  await user.keyboard('8');
  expect(canvas.dataset.focusY).toBe('1');

  // Shift+arrow north from new anchor (2,1): focus=(2,0), rect (2,0)-(2,1)
  await user.keyboard('{Shift>}8{/Shift}');

  const selectedCells = JSON.parse(canvas.dataset.selectedCells);
  expect(selectedCells).toContain('2,0');
  expect(selectedCells).toContain('2,1');
  expect(selectedCells).not.toContain('2,2'); // old anchor (2,2) not in rect
  expect(canvas.dataset.focusY).toBe('0');
});

test('handleControlRoomValue applies to all selected cells when multi-selected', async () => {
  const user = userEvent.setup();
  mockMapResult.layers[0].data[1][1] = { enabled: true };
  mockMapResult.layers[0].data[2][2] = { enabled: true };

  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ControlLeft]');

  await user.click(screen.getByTestId('set-fill-color'));

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[1][1].fillColor).toBe('#ff0000');
  expect(mapData[2][2].fillColor).toBe('#ff0000');
});

test('handleControlRoomValue applies only to focus cell when nothing is multi-selected', async () => {
  const user = userEvent.setup();
  mockMapResult.layers[0].data[1][1] = { enabled: true };
  mockMapResult.layers[0].data[2][2] = { enabled: true };

  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  // No shift+click — selection is empty, effective target is just focus (2,2)
  await user.click(screen.getByTestId('set-fill-color'));

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[2][2].fillColor).toBe('#ff0000');
  expect(mapData[1][1].fillColor).toBeUndefined();
});

test('nudge north moves the focus room to the cell above', async () => {
  const user = userEvent.setup();
  mockMapResult.layers[0].data[2][2] = { enabled: true, fillColor: '#ff0000' };

  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  await user.click(screen.getByTestId('nudge-north'));

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[2][2].enabled).toBeFalsy();
  expect(mapData[2][1].enabled).toBe(true);
  expect(mapData[2][1].fillColor).toBe('#ff0000');
  expect(canvas.dataset.focusX).toBe('2');
  expect(canvas.dataset.focusY).toBe('1');
});

test('nudge is blocked when destination cell has an enabled non-selected room', async () => {
  const user = userEvent.setup();
  mockMapResult.layers[0].data[2][2] = { enabled: true };
  mockMapResult.layers[0].data[2][1] = { enabled: true }; // destination occupied

  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  await user.click(screen.getByTestId('nudge-north'));

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[2][2].enabled).toBe(true); // unchanged
  expect(canvas.dataset.focusY).toBe('2');  // focus unchanged
});

test('nudge is blocked when destination would be out of bounds', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  // Navigate focus to y=0 (two presses north from y=2)
  await user.keyboard('8');
  await user.keyboard('8');
  expect(canvas.dataset.focusY).toBe('0');

  // Enable that room
  await user.keyboard(' ');

  // Attempt nudge north — would go to y=-1
  await user.click(screen.getByTestId('nudge-north'));

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[2][0].enabled).toBe(true); // still at y=0
  expect(canvas.dataset.focusY).toBe('0');  // focus unchanged
});

test('nudge moves all rooms in the selection together', async () => {
  const user = userEvent.setup();
  mockMapResult.layers[0].data[1][1] = { enabled: true, fillColor: '#aaaaaa' };
  mockMapResult.layers[0].data[2][2] = { enabled: true, fillColor: '#bbbbbb' };

  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ControlLeft]');

  await user.click(screen.getByTestId('nudge-north'));

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[1][1].enabled).toBeFalsy();
  expect(mapData[2][2].enabled).toBeFalsy();
  expect(mapData[1][0].enabled).toBe(true);
  expect(mapData[1][0].fillColor).toBe('#aaaaaa');
  expect(mapData[2][1].enabled).toBe(true);
  expect(mapData[2][1].fillColor).toBe('#bbbbbb');
  expect(canvas.dataset.focusX).toBe('2');
  expect(canvas.dataset.focusY).toBe('1');
});

test('shift+click fills rectangle from anchor to target and unions with existing selection', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  // anchor is (2,2) on load; shift+click (1,1) fills rect (1,1)-(2,2)
  await user.keyboard('[ShiftLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ShiftLeft]');

  const selectedCells = JSON.parse(canvas.dataset.selectedCells);
  expect(selectedCells).toContain('1,1');
  expect(selectedCells).toContain('1,2');
  expect(selectedCells).toContain('2,1');
  expect(selectedCells).toContain('2,2');
});

test('shift+click does not move focus', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  await user.keyboard('[ShiftLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ShiftLeft]');

  expect(canvas.dataset.focusX).toBe('2');
  expect(canvas.dataset.focusY).toBe('2');
});

test('shift+click unions rectangle with existing ctrl-picked cells', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  // ctrl+click cell-0-0 to scatter-select it
  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-0-0'));
  await user.keyboard('[/ControlLeft]');

  // shift+click (1,1) fills rect (1,1)-(2,2) and adds to (0,0)
  await user.keyboard('[ShiftLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ShiftLeft]');

  const selectedCells = JSON.parse(canvas.dataset.selectedCells);
  expect(selectedCells).toContain('0,0'); // ctrl-picked cell preserved
  expect(selectedCells).toContain('1,1');
  expect(selectedCells).toContain('1,2');
  expect(selectedCells).toContain('2,1');
  expect(selectedCells).toContain('2,2');
  expect(selectedCells).toHaveLength(5);
});

test('plain click after shift+click resets anchor and clears selection', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  // shift+click fills a rect
  await user.keyboard('[ShiftLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ShiftLeft]');
  expect(JSON.parse(canvas.dataset.selectedCells).length).toBeGreaterThan(0);

  // plain click cell-0-0 clears and resets anchor to (0,0)
  await user.click(screen.getByTestId('cell-0-0'));
  expect(JSON.parse(canvas.dataset.selectedCells)).toHaveLength(0);
  expect(canvas.dataset.focusX).toBe('0');
  expect(canvas.dataset.focusY).toBe('0');

  // now shift+click (1,1): rect from new anchor (0,0) to (1,1) = 2x2
  await user.keyboard('[ShiftLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ShiftLeft]');

  const selectedCells = JSON.parse(canvas.dataset.selectedCells);
  expect(selectedCells).toContain('0,0');
  expect(selectedCells).toContain('0,1');
  expect(selectedCells).toContain('1,0');
  expect(selectedCells).toContain('1,1');
  expect(selectedCells).not.toContain('2,2'); // old anchor no longer in rect
});
