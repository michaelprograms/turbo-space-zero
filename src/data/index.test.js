import { test, expect, describe } from 'vitest';
import { createBlankMap } from './index.js';
import {
  MAX_MAP_SIZE,
  appendCol, prependCol, appendRow, prependRow,
  deleteRightCol, deleteLeftCol, deleteBottomRow, deleteTopRow,
} from './index.js';

describe('createBlankMap', () => {
  it('includes cellSize defaulting to 40', () => {
    expect(createBlankMap().cellSize).toBe(40);
  });

  it('includes cellSize 40 regardless of map dimensions', () => {
    expect(createBlankMap(10, 5).cellSize).toBe(40);
  });

  it('includes darkMode defaulting to true', () => {
    expect(createBlankMap().darkMode).toBe(true);
  });

  it('includes showGrid defaulting to true', () => {
    expect(createBlankMap().showGrid).toBe(true);
  });

  it('includes all required map properties', () => {
    const map = createBlankMap();
    expect(map).toHaveProperty('name');
    expect(map).toHaveProperty('focusX');
    expect(map).toHaveProperty('focusY');
    expect(map).toHaveProperty('focusLayer');
    expect(map).toHaveProperty('width');
    expect(map).toHaveProperty('height');
    expect(map).toHaveProperty('cellSize');
    expect(map).toHaveProperty('darkMode');
    expect(map).toHaveProperty('showGrid');
    expect(map).toHaveProperty('created');
    expect(map).toHaveProperty('edited');
    expect(map).toHaveProperty('layers');
  });

  it('has layers array with one Layer 1 entry', () => {
    const map = createBlankMap();
    expect(map.layers).toHaveLength(1);
    expect(map.layers[0].name).toBe('Layer 1');
    expect(Array.isArray(map.layers[0].data)).toBe(true);
  });

  it('has focusLayer defaulting to 0', () => {
    expect(createBlankMap().focusLayer).toBe(0);
  });

  it('does not have a top-level data property', () => {
    expect(createBlankMap()).not.toHaveProperty('data');
  });

  it('layer data dimensions match width and height', () => {
    const map = createBlankMap(10, 8);
    expect(map.layers[0].data).toHaveLength(10);
    expect(map.layers[0].data[0]).toHaveLength(8);
  });
});

const makeGrid = (w, h) => ({
  data: Array.from({ length: w }, () => Array.from({ length: h }, () => ({}))),
  width: w,
  height: h,
});

test('MAX_MAP_SIZE is 250', () => {
  expect(MAX_MAP_SIZE).toBe(250);
});

test('appendCol adds a column on the right', () => {
  const { data, width, height } = appendCol(makeGrid(3, 2).data, 3, 2);
  expect(width).toBe(4);
  expect(height).toBe(2);
  expect(data).toHaveLength(4);
  expect(data[3]).toHaveLength(2);
  expect(data[3][0]).toEqual({});
});

test('appendCol does not mutate original', () => {
  const { data: orig } = makeGrid(2, 2);
  appendCol(orig, 2, 2);
  expect(orig).toHaveLength(2);
});

test('prependCol adds a column on the left and shifts existing right', () => {
  const { data: orig } = makeGrid(2, 2);
  orig[0][0] = { enabled: true };
  const { data, width, height } = prependCol(orig, 2, 2);
  expect(width).toBe(3);
  expect(height).toBe(2);
  expect(data[0][0]).toEqual({});
  expect(data[1][0]).toEqual({ enabled: true });
});

test('appendRow adds a row at the bottom', () => {
  const { data, width, height } = appendRow(makeGrid(2, 3).data, 2, 3);
  expect(width).toBe(2);
  expect(height).toBe(4);
  expect(data[0]).toHaveLength(4);
  expect(data[0][3]).toEqual({});
});

test('prependRow adds a row at the top and shifts existing down', () => {
  const { data: orig } = makeGrid(2, 2);
  orig[0][0] = { enabled: true };
  const { data, height } = prependRow(orig, 2, 2);
  expect(height).toBe(3);
  expect(data[0][0]).toEqual({});
  expect(data[0][1]).toEqual({ enabled: true });
});

test('deleteRightCol removes the rightmost column', () => {
  const { data: orig } = makeGrid(3, 2);
  orig[2][0] = { enabled: true };
  const { data, width } = deleteRightCol(orig, 3, 2);
  expect(width).toBe(2);
  expect(data).toHaveLength(2);
});

test('deleteLeftCol removes the leftmost column and shifts remaining left', () => {
  const { data: orig } = makeGrid(3, 2);
  orig[1][0] = { enabled: true };
  const { data, width } = deleteLeftCol(orig, 3, 2);
  expect(width).toBe(2);
  expect(data[0][0]).toEqual({ enabled: true });
});

test('deleteBottomRow removes the bottom row', () => {
  const { data: orig } = makeGrid(2, 3);
  orig[0][2] = { enabled: true };
  const { data, height } = deleteBottomRow(orig, 2, 3);
  expect(height).toBe(2);
  expect(data[0]).toHaveLength(2);
});

test('deleteTopRow removes the top row and shifts remaining up', () => {
  const { data: orig } = makeGrid(2, 3);
  orig[0][1] = { enabled: true };
  const { data, height } = deleteTopRow(orig, 2, 3);
  expect(height).toBe(2);
  expect(data[0][0]).toEqual({ enabled: true });
});

test('prependCol then deleteLeftCol restores original dimensions', () => {
  const orig = makeGrid(3, 3);
  const ext = prependCol(orig.data, orig.width, orig.height);
  const restored = deleteLeftCol(ext.data, ext.width, ext.height);
  expect(restored.width).toBe(3);
  expect(restored.height).toBe(3);
});

test('prependRow then deleteTopRow restores original dimensions', () => {
  const orig = makeGrid(3, 3);
  const ext = prependRow(orig.data, orig.width, orig.height);
  const restored = deleteTopRow(ext.data, ext.width, ext.height);
  expect(restored.width).toBe(3);
  expect(restored.height).toBe(3);
});

import { pruneRoom, serializeLayer, hydrateLayer } from './index.js';
import { ROOM_DEFAULTS, EXIT_DEFAULT_COLOR } from '../constants/room';

describe('pruneRoom', () => {
  it('drops empty and all-default rooms to undefined', () => {
    expect(pruneRoom({})).toBeUndefined();
    expect(pruneRoom({ enabled: false, text: '', ...ROOM_DEFAULTS, exits: {}, exitColors: {} })).toBeUndefined();
  });

  it('keeps only non-default and meaningful properties', () => {
    expect(pruneRoom({
      enabled: true,
      text: 'hi',
      roomSize: ROOM_DEFAULTS.roomSize,          // dropped (default)
      fillColor: '#ff0000',                       // kept
      exits: { north: true, south: false },       // only north kept
      exitColors: { north: '#00ff00', south: EXIT_DEFAULT_COLOR }, // only north kept
    })).toEqual({
      enabled: true,
      text: 'hi',
      fillColor: '#ff0000',
      exits: { north: true },
      exitColors: { north: '#00ff00' },
    });
  });
});

describe('serializeLayer / hydrateLayer round-trip', () => {
  it('preserves meaningful rooms and rebuilds the dense grid', () => {
    const data = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ({})));
    data[1][2] = { enabled: true, fillColor: '#abcdef', exits: { east: true } };
    const sparse = serializeLayer({ id: 'a', name: 'L1', data });

    expect(sparse).not.toHaveProperty('data');
    expect(sparse.rooms).toEqual({ '1,2': { enabled: true, fillColor: '#abcdef', exits: { east: true } } });

    const hydrated = hydrateLayer(sparse, 3, 3);
    expect(hydrated.data).toHaveLength(3);
    expect(hydrated.data[1][2]).toEqual({ enabled: true, fillColor: '#abcdef', exits: { east: true } });
    expect(hydrated.data[0][0]).toEqual({});
  });

  it('passes through old dense (v1) layers unchanged', () => {
    const data = [[{ enabled: true }]];
    expect(hydrateLayer({ id: 'a', name: 'L1', data }, 1, 1).data).toBe(data);
  });
});
