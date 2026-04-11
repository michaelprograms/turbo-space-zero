import './test-setup';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect } from 'vitest';
import MapView from './index';
import { mockMapResult, clipboardMock } from './test-setup';

test('pressing c copies the focused cell to clipboard as tsz-cells JSON', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboardMock });
  mockMapResult.layers[0].data[2][2] = { enabled: true, fillColor: '#ff0000' };
  render(<MapView />);
  await screen.findByTestId('map-canvas');

  await user.keyboard('c');

  await vi.waitFor(() => expect(clipboardMock.writeText).toHaveBeenCalledTimes(1));
  const written = JSON.parse(clipboardMock.writeText.mock.calls[0][0]);
  expect(written.type).toBe('tsz-cells');
  expect(written.cells).toHaveLength(1);
  expect(written.cells[0]).toEqual({
    relX: 0,
    relY: 0,
    data: { enabled: true, fillColor: '#ff0000' },
  });
});

test('pressing c with a multi-cell selection copies all cells with relative positions', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboardMock });
  mockMapResult.layers[0].data[1][1] = { enabled: true, fillColor: '#aaaaaa' };
  mockMapResult.layers[0].data[2][2] = { enabled: true, fillColor: '#bbbbbb' };
  render(<MapView />);
  await screen.findByTestId('map-canvas');

  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ControlLeft]');

  await user.keyboard('c');

  await vi.waitFor(() => expect(clipboardMock.writeText).toHaveBeenCalledTimes(1));
  const written = JSON.parse(clipboardMock.writeText.mock.calls[0][0]);
  expect(written.type).toBe('tsz-cells');
  expect(written.cells).toHaveLength(2);
  const topLeft = written.cells.find(c => c.relX === 0 && c.relY === 0);
  const bottomRight = written.cells.find(c => c.relX === 1 && c.relY === 1);
  expect(topLeft.data.fillColor).toBe('#aaaaaa');
  expect(bottomRight.data.fillColor).toBe('#bbbbbb');
});

test('pressing z clears the focused cell to an empty object', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboardMock });
  mockMapResult.layers[0].data[2][2] = { enabled: true, fillColor: '#ff0000' };
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await user.keyboard('z');
  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[2][2]).toEqual({});
  expect(clipboardMock.writeText).not.toHaveBeenCalled();
});

test('pressing z clears all selected cells (including focus) to empty objects', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboardMock });
  mockMapResult.layers[0].data[1][1] = { enabled: true, fillColor: '#aaaaaa' };
  mockMapResult.layers[0].data[2][2] = { enabled: true, fillColor: '#bbbbbb' };
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');

  // ctrl+click cell-1-1 to add (1,1) to selectedCells; focus stays at (2,2)
  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ControlLeft]');

  await user.keyboard('z');

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[2][2]).toEqual({});
  expect(mapData[1][1]).toEqual({});
  expect(clipboardMock.writeText).not.toHaveBeenCalled();
});

test('pressing x cuts the focused cell: writes to clipboard and clears the cell', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboardMock });
  mockMapResult.layers[0].data[2][2] = { enabled: true, fillColor: '#ff0000' };
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await user.keyboard('x');
  await vi.waitFor(() => expect(clipboardMock.writeText).toHaveBeenCalledTimes(1));
  const written = JSON.parse(clipboardMock.writeText.mock.calls[0][0]);
  expect(written.type).toBe('tsz-cells');
  expect(written.cells).toHaveLength(1);
  expect(written.cells[0]).toEqual({ relX: 0, relY: 0, data: { enabled: true, fillColor: '#ff0000' } });
  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[2][2]).toEqual({});
});

test('pressing v pastes tsz-cells JSON onto the map at the focus position', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboardMock });
  const clipboardData = JSON.stringify({
    type: 'tsz-cells',
    cells: [
      { relX: 0, relY: 0, data: { enabled: true, fillColor: '#abcdef' } },
      { relX: 1, relY: 0, data: { enabled: true, fillColor: '#123456' } },
    ],
  });
  clipboardMock.readText.mockResolvedValue(clipboardData);
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await user.keyboard('v');
  await vi.waitFor(() => {
    const mapData = JSON.parse(canvas.dataset.mapData);
    expect(mapData[2][2]).toEqual({ enabled: true, fillColor: '#abcdef' });
  });
  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[3][2]).toEqual({ enabled: true, fillColor: '#123456' });
});

test('pressing v skips cells that would land outside map bounds', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboardMock });
  // Map is 5x5; focus is at (2,2). relX=23 would land at x=25 which is out of bounds.
  const clipboardData = JSON.stringify({
    type: 'tsz-cells',
    cells: [
      { relX: 0, relY: 0, data: { enabled: true, fillColor: '#aaaaaa' } },
      { relX: 23, relY: 0, data: { enabled: true, fillColor: '#bbbbbb' } },
    ],
  });
  clipboardMock.readText.mockResolvedValue(clipboardData);
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await user.keyboard('v');
  await vi.waitFor(() => {
    const mapData = JSON.parse(canvas.dataset.mapData);
    expect(mapData[2][2]).toEqual({ enabled: true, fillColor: '#aaaaaa' });
  });
  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[25]).toBeUndefined();
});

test('pressing v with invalid JSON in clipboard is a no-op', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboardMock });
  clipboardMock.readText.mockResolvedValue('not valid json {{');
  mockMapResult.layers[0].data[2][2] = { enabled: true, fillColor: '#ff0000' };
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await user.keyboard('v');
  await vi.waitFor(() => {
    const mapData = JSON.parse(canvas.dataset.mapData);
    expect(mapData[2][2]).toEqual({ enabled: true, fillColor: '#ff0000' });
  });
});

test('pressing v with wrong type field in clipboard is a no-op', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboardMock });
  clipboardMock.readText.mockResolvedValue(JSON.stringify({ type: 'unknown', cells: [] }));
  mockMapResult.layers[0].data[2][2] = { enabled: true, fillColor: '#ff0000' };
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await user.keyboard('v');
  await vi.waitFor(() => {
    const mapData = JSON.parse(canvas.dataset.mapData);
    expect(mapData[2][2]).toEqual({ enabled: true, fillColor: '#ff0000' });
  });
});

test('pressing v with empty clipboard is a no-op', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboardMock });
  clipboardMock.readText.mockResolvedValue('');
  mockMapResult.layers[0].data[2][2] = { enabled: true, fillColor: '#ff0000' };
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  await user.keyboard('v');
  await vi.waitFor(() => {
    const mapData = JSON.parse(canvas.dataset.mapData);
    expect(mapData[2][2]).toEqual({ enabled: true, fillColor: '#ff0000' });
  });
});
