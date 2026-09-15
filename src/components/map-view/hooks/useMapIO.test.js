import { renderHook, act } from '@testing-library/react';
import { vi, test, expect, beforeEach } from 'vitest';

vi.mock('../../../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    setMap: vi.fn().mockResolvedValue(undefined),
  };
});

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
