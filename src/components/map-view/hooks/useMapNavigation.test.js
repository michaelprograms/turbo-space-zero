// src/components/map-view/hooks/useMapNavigation.test.js
import { renderHook, act } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import { useMapNavigation } from './useMapNavigation';

const makeData = (w = 5, h = 5) =>
  Array.from({ length: w }, () => Array.from({ length: h }, () => ({})));

const makeLayer = (w = 5, h = 5) => ({ name: 'Layer 1', data: makeData(w, h) });

const defaultParams = () => ({
  mapWidth: 5,
  mapHeight: 5,
  mapData: makeData(),
  mapLayers: [makeLayer()],
  focusLayer: 0,
  updateActiveLayerData: vi.fn(),
  commitMapLayers: vi.fn(),
  enableRoom: vi.fn((map, x, y) => {
    map[x] = [...map[x]];
    map[x][y] = { ...map[x][y], enabled: true };
    return map;
  }),
});

test('starts with focus at 0,0 and no selection', () => {
  const { result } = renderHook(() => useMapNavigation(defaultParams()));
  expect(result.current.mapFocusX).toBe(0);
  expect(result.current.mapFocusY).toBe(0);
  expect(result.current.selectedCells.size).toBe(0);
  expect(result.current.isQuillMode).toBe(false);
});

test('handleNavigate moves focus within bounds', () => {
  const { result } = renderHook(() => useMapNavigation(defaultParams()));
  act(() => { result.current.setMapFocusX(2); result.current.setMapFocusY(2); });
  act(() => { result.current.handleNavigate('east'); });
  expect(result.current.mapFocusX).toBe(3);
  expect(result.current.mapFocusY).toBe(2);
});

test('handleNavigate does nothing when out of bounds in non-quill mode', () => {
  const { result } = renderHook(() => useMapNavigation(defaultParams()));
  act(() => { result.current.handleNavigate('west'); });
  expect(result.current.mapFocusX).toBe(0);
});

test('toggleQuillMode flips isQuillMode', () => {
  const { result } = renderHook(() => useMapNavigation(defaultParams()));
  act(() => { result.current.toggleQuillMode(); });
  expect(result.current.isQuillMode).toBe(true);
  act(() => { result.current.toggleQuillMode(); });
  expect(result.current.isQuillMode).toBe(false);
});

test('handleGridOnClick sets focus with no modifier', () => {
  const { result } = renderHook(() => useMapNavigation(defaultParams()));
  act(() => { result.current.handleGridOnClick(3, 4); });
  expect(result.current.mapFocusX).toBe(3);
  expect(result.current.mapFocusY).toBe(4);
  expect(result.current.selectedCells.size).toBe(0);
});

test('handleGridOnClick adds to selection with shiftKey', () => {
  const { result } = renderHook(() => useMapNavigation(defaultParams()));
  act(() => { result.current.handleGridOnClick(0, 0); });
  act(() => { result.current.handleGridOnClick(2, 0, { shiftKey: true }); });
  expect(result.current.selectedCells.has('0,0')).toBe(true);
  expect(result.current.selectedCells.has('1,0')).toBe(true);
  expect(result.current.selectedCells.has('2,0')).toBe(true);
  expect(result.current.mapFocusX).toBe(0);
  expect(result.current.mapFocusY).toBe(0);
});

test('handleGridOnClick toggles a cell with ctrlKey', () => {
  const { result } = renderHook(() => useMapNavigation(defaultParams()));
  act(() => { result.current.handleGridOnClick(1, 1, { ctrlKey: true }); });
  expect(result.current.selectedCells.has('1,1')).toBe(true);
  act(() => { result.current.handleGridOnClick(1, 1, { ctrlKey: true }); });
  expect(result.current.selectedCells.has('1,1')).toBe(false);
});

test('handleNavigate in quill mode adds exits between rooms', () => {
  const updateActiveLayerData = vi.fn();
  const params = { ...defaultParams(), updateActiveLayerData };
  const { result } = renderHook(() => useMapNavigation(params));
  act(() => { result.current.setMapFocusX(2); result.current.setMapFocusY(2); });
  act(() => { result.current.toggleQuillMode(); });
  act(() => { result.current.handleNavigate('east'); });
  expect(updateActiveLayerData).toHaveBeenCalled();
  expect(result.current.mapFocusX).toBe(3);
  const callArg = updateActiveLayerData.mock.calls.at(-1)[0];
  expect(callArg[2][2].exits?.east).toBe(true);
  expect(callArg[3][2].exits?.west).toBe(true);
  expect(params.mapData[2][2].exits).toBeUndefined();
});
