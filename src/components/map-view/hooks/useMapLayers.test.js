import { renderHook, act } from '@testing-library/react';
import { test, expect } from 'vitest';
import { useMapLayers, enableRoom } from './useMapLayers';

const makeLayer = (w = 3, h = 3) => ({
  name: 'Layer 1',
  data: Array.from({ length: w }, () => Array.from({ length: h }, () => ({}))),
});

const makeResult = (overrides = {}) => ({
  layers: [makeLayer()],
  focusLayer: 0,
  width: 3,
  height: 3,
  ...overrides,
});

test('enableRoom toggles enabled and applies defaults on first enable', () => {
  const map = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ({})));
  const updated = enableRoom(map, 1, 1);
  expect(updated[1][1].enabled).toBe(true);
  expect(updated[1][1].borderRadius).toBe(50);
  expect(updated[1][1].borderWidth).toBe(4);
  expect(updated[1][1].roomSize).toBe(25);
  expect(updated[1][1].borderColor).toBe('#666666');
  expect(updated[1][1].fillColor).toBe('#999999');
});

test('enableRoom disables an already-enabled room', () => {
  const map = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ({})));
  const once = enableRoom(map, 1, 1);
  const twice = enableRoom(once, 1, 1);
  expect(twice[1][1].enabled).toBe(false);
});

test('enableRoom does not mutate the original map array', () => {
  const map = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ({})));
  const originalRoom = map[1][1];
  enableRoom(map, 1, 1);
  expect(map[1][1]).toBe(originalRoom);
});

test('loads state from result on mount', () => {
  const result = makeResult({ width: 5, height: 7, focusLayer: 0 });
  const { result: hook } = renderHook(() =>
    useMapLayers({ result, activeMapId: 1 })
  );
  expect(hook.current.mapWidth).toBe(5);
  expect(hook.current.mapHeight).toBe(7);
  expect(hook.current.mapLayers).toHaveLength(1);
});

test('commitMapLayers enables undo and clears redo', () => {
  const result = makeResult();
  const { result: hook } = renderHook(() =>
    useMapLayers({ result, activeMapId: 1 })
  );
  expect(hook.current.canUndo).toBe(false);
  act(() => {
    hook.current.commitMapLayers([makeLayer()]);
  });
  expect(hook.current.canUndo).toBe(true);
  expect(hook.current.canRedo).toBe(false);
});

test('handleUndo restores previous state', () => {
  const result = makeResult();
  const { result: hook } = renderHook(() =>
    useMapLayers({ result, activeMapId: 1 })
  );
  const original = hook.current.mapLayers;
  const newLayer = { ...makeLayer(), name: 'Layer X' };
  act(() => { hook.current.commitMapLayers([newLayer]); });
  expect(hook.current.mapLayers[0].name).toBe('Layer X');
  act(() => { hook.current.handleUndo(); });
  expect(hook.current.mapLayers[0].name).toBe(original[0].name);
  expect(hook.current.canRedo).toBe(true);
});

test('handleRedo re-applies undone change', () => {
  const result = makeResult();
  const { result: hook } = renderHook(() =>
    useMapLayers({ result, activeMapId: 1 })
  );
  const newLayer = { ...makeLayer(), name: 'Layer X' };
  act(() => { hook.current.commitMapLayers([newLayer]); });
  act(() => { hook.current.handleUndo(); });
  act(() => { hook.current.handleRedo(); });
  expect(hook.current.mapLayers[0].name).toBe('Layer X');
  expect(hook.current.canRedo).toBe(false);
});

test('handleLayerAdd appends a new blank layer and sets focusLayer', () => {
  const result = makeResult();
  const { result: hook } = renderHook(() =>
    useMapLayers({ result, activeMapId: 1 })
  );
  act(() => { hook.current.handleLayerAdd(); });
  expect(hook.current.mapLayers).toHaveLength(2);
  expect(hook.current.focusLayer).toBe(1);
});

test('handleLayerDelete removes the layer; refuses to delete last layer', () => {
  const result = makeResult({ layers: [makeLayer(), { ...makeLayer(), name: 'Layer 2' }] });
  const { result: hook } = renderHook(() =>
    useMapLayers({ result, activeMapId: 1 })
  );
  act(() => { hook.current.handleLayerDelete(1); });
  expect(hook.current.mapLayers).toHaveLength(1);
  act(() => { hook.current.handleLayerDelete(0); });
  expect(hook.current.mapLayers).toHaveLength(1);
});

test('handleLayerRename changes the layer name', () => {
  const result = makeResult();
  const { result: hook } = renderHook(() =>
    useMapLayers({ result, activeMapId: 1 })
  );
  act(() => { hook.current.handleLayerRename(0, 'Dungeon'); });
  expect(hook.current.mapLayers[0].name).toBe('Dungeon');
});

test('handleLayerReorder swaps layers and updates focusLayer', () => {
  const layerA = { ...makeLayer(), name: 'A' };
  const layerB = { ...makeLayer(), name: 'B' };
  const result = makeResult({ layers: [layerA, layerB] });
  const { result: hook } = renderHook(() =>
    useMapLayers({ result, activeMapId: 1 })
  );
  act(() => { hook.current.handleLayerReorder(0, 1); });
  expect(hook.current.mapLayers[0].name).toBe('B');
  expect(hook.current.mapLayers[1].name).toBe('A');
  expect(hook.current.focusLayer).toBe(1);
});

test('resetHistory clears undo and redo stacks', () => {
  const result = makeResult();
  const { result: hook } = renderHook(() =>
    useMapLayers({ result, activeMapId: 1 })
  );
  act(() => { hook.current.commitMapLayers([makeLayer()]); });
  expect(hook.current.canUndo).toBe(true);
  act(() => { hook.current.resetHistory(); });
  expect(hook.current.canUndo).toBe(false);
  expect(hook.current.canRedo).toBe(false);
});

test('updateActiveLayerData only updates focusLayer', () => {
  const layerA = { ...makeLayer(), name: 'A' };
  const layerB = { ...makeLayer(), name: 'B' };
  const result = makeResult({ layers: [layerA, layerB], focusLayer: 0 });
  const { result: hook } = renderHook(() =>
    useMapLayers({ result, activeMapId: 1 })
  );
  const newData = hook.current.mapLayers[0].data.map(col => [...col]);
  newData[0][0] = { enabled: true };
  act(() => { hook.current.updateActiveLayerData(newData); });
  expect(hook.current.mapLayers[0].data[0][0].enabled).toBe(true);
  expect(hook.current.mapLayers[1].data[0][0]).toEqual({});
});

test('undo/redo across two edits keeps the non-focused layer untouched', () => {
  const layerA = { ...makeLayer(), name: 'A' };
  const layerB = { ...makeLayer(), name: 'B' };
  const result = makeResult({ layers: [layerA, layerB], focusLayer: 0 });
  const { result: hook } = renderHook(() =>
    useMapLayers({ result, activeMapId: 1 })
  );

  // edit A: mark (0,0) on the focus layer
  const dataA = hook.current.mapLayers[0].data.map(col => [...col]);
  dataA[0][0] = { enabled: true, marker: 'A' };
  act(() => { hook.current.updateActiveLayerData(dataA); });

  // edit B: mark (1,1) on the focus layer
  const dataB = hook.current.mapLayers[0].data.map(col => [...col]);
  dataB[1][1] = { enabled: true, marker: 'B' };
  act(() => { hook.current.updateActiveLayerData(dataB); });

  // undo B -> post-A
  act(() => { hook.current.handleUndo(); });
  expect(hook.current.mapLayers[0].data[0][0].marker).toBe('A');
  expect(hook.current.mapLayers[0].data[1][1]).toEqual({});

  // undo A -> initial
  act(() => { hook.current.handleUndo(); });
  expect(hook.current.mapLayers[0].data[0][0]).toEqual({});

  // redo A -> post-A again
  act(() => { hook.current.handleRedo(); });
  expect(hook.current.mapLayers[0].data[0][0].marker).toBe('A');

  // the non-focused layer B was never touched throughout
  expect(hook.current.mapLayers[1].name).toBe('B');
  expect(hook.current.mapLayers[1].data[0][0]).toEqual({});
  expect(hook.current.mapLayers[1].data[1][1]).toEqual({});
});
