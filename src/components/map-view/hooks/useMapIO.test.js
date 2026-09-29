import { renderHook, act } from '@testing-library/react';
import { vi, test, expect, beforeEach } from 'vitest';

vi.mock('../../../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    setMap: vi.fn().mockResolvedValue(undefined),
  };
});

const konvaNodes = [];
vi.mock('konva', () => {
  const node = (type) => vi.fn(function(config) { return { type, ...config }; });
  return {
    default: {
      Stage: vi.fn(function() { return { add: vi.fn(), toDataURL: () => 'data:', destroy: vi.fn() }; }),
      Layer: vi.fn(function() { return { add: (n) => konvaNodes.push(n) }; }),
      Rect: node('Rect'), Line: node('Line'), Text: node('Text'),
    },
  };
});

import Konva from 'konva';
import { useMapIO } from './useMapIO';
import { setMap } from '../../../data';

const makeMapState = (overrides = {}) => ({
  mapFocusX: 2, mapFocusY: 3, focusLayer: 0,
  mapWidth: 5, mapHeight: 5,
  mapLayers: [{ name: 'Layer 1', data: [] }],
  cellSize: 40, darkMode: true, showGrid: true,
  ...overrides,
});

const makeResult = () => ({ id: 'test-id', name: 'Test', created: 0 });

beforeEach(() => {
  vi.clearAllMocks();
  konvaNodes.length = 0;
});

test('saveMapData calls setMap with id and updated data', async () => {
  const onSaveComplete = vi.fn();
  const { result } = renderHook(() =>
    useMapIO({
      activeMapId: 'test-id',
      result: makeResult(),
      mapName: 'My Map',
      theme: {},
      mapState: makeMapState(),
      onSaveComplete,
    })
  );

  await act(async () => { await result.current.saveMapData(); });

  expect(setMap).toHaveBeenCalledWith('test-id', expect.objectContaining({ name: 'My Map' }));
  expect(onSaveComplete).toHaveBeenCalled();
});

test('exportCollapsed draws every layer bottom-to-top onto one stage', async () => {
  const open = vi.spyOn(window, 'open').mockReturnValue({ document });
  const grid = (room) => [[room]];
  const { result } = renderHook(() =>
    useMapIO({
      activeMapId: 'test-id',
      result: makeResult(),
      mapName: 'My Map',
      theme: { canvasBackground: '#bg' },
      mapState: makeMapState({
        mapWidth: 1, mapHeight: 1,
        mapLayers: [
          { name: 'Bottom', data: grid({ enabled: true, fillColor: '#bottom', exits: { east: true } }) },
          { name: 'Top', data: grid({ enabled: true, fillColor: '#top' }) },
        ],
      }),
    })
  );

  await act(async () => { await result.current.exportCollapsed(); });

  expect(Konva.Stage).toHaveBeenCalledTimes(1);
  // Background first, then the bottom room, then the top room painted over it.
  expect(konvaNodes.filter(n => n.type === 'Rect').map(n => n.fill)).toEqual(['#bg', '#bottom', '#top']);
  // The bottom layer's exit still gets drawn.
  expect(konvaNodes.some(n => n.type === 'Line')).toBe(true);
  expect(open).toHaveBeenCalledTimes(1);
  open.mockRestore();
});
