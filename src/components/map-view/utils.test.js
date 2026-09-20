import { test, expect } from 'vitest';
import { getRectCells, getConnectorPositions, EXIT_DIRECTIONS, countEnabledRooms, countExitLinks, countCellBackgrounds, estimateMapKbSize, fileTimestamp, moveSelectionAcrossLayers, transformSelection, elasticRemapExits } from './utils';

test('fileTimestamp: zero-pads to YYYY-MM-DD_HHMMSS', () => {
  // 2026-06-14 09:05:03 local
  expect(fileTimestamp(new Date(2026, 5, 14, 9, 5, 3))).toBe('2026-06-14_090503');
});

test('getRectCells: single cell when anchor equals target', () => {
  expect(getRectCells(2, 2, 2, 2)).toEqual(new Set(['2,2']));
});

test('getRectCells: 2x2 rectangle top-left to bottom-right', () => {
  expect(getRectCells(1, 1, 2, 2)).toEqual(new Set(['1,1', '1,2', '2,1', '2,2']));
});

test('getRectCells: handles reversed coordinates', () => {
  expect(getRectCells(2, 2, 1, 1)).toEqual(new Set(['1,1', '1,2', '2,1', '2,2']));
});

test('getRectCells: single row', () => {
  expect(getRectCells(0, 1, 2, 1)).toEqual(new Set(['0,1', '1,1', '2,1']));
});

test('getRectCells: single column', () => {
  expect(getRectCells(1, 0, 1, 2)).toEqual(new Set(['1,0', '1,1', '1,2']));
});

const makeLayer = (data) => ({ name: 'L', data });
const makeGrid = (w, h) => Array.from({ length: w }, () => Array.from({ length: h }, () => ({})));

test('getConnectorPositions: returns position when L0 has up and L1 has down at same cell', () => {
  const l0 = makeGrid(3, 3);
  l0[1][1] = { exits: { up: true } };
  const l1 = makeGrid(3, 3);
  l1[1][1] = { exits: { down: true } };
  const result = getConnectorPositions([makeLayer(l0), makeLayer(l1)], 0);
  expect(result.has('1,1')).toBe(true);
  expect(result.size).toBe(1);
});

test('getConnectorPositions: skip-connects through an empty middle layer', () => {
  const l0 = makeGrid(3, 3);
  l0[2][2] = { exits: { up: true } };
  const l1 = makeGrid(3, 3);
  const l2 = makeGrid(3, 3);
  l2[2][2] = { exits: { down: true } };
  const layers = [makeLayer(l0), makeLayer(l1), makeLayer(l2)];
  expect(getConnectorPositions(layers, 0).has('2,2')).toBe(true);
  expect(getConnectorPositions(layers, 1).has('2,2')).toBe(true);
});

test('getConnectorPositions: no connection when only up exists with no down above', () => {
  const l0 = makeGrid(2, 2);
  l0[0][0] = { exits: { up: true } };
  const l1 = makeGrid(2, 2);
  expect(getConnectorPositions([makeLayer(l0), makeLayer(l1)], 0).size).toBe(0);
});

test('EXIT_DIRECTIONS preserves the canonical order and vectors', () => {
  expect(EXIT_DIRECTIONS).toEqual([
    { key: 'north', dx: 0, dy: -1 },
    { key: 'south', dx: 0, dy: 1 },
    { key: 'east', dx: 1, dy: 0 },
    { key: 'west', dx: -1, dy: 0 },
    { key: 'northeast', dx: 1, dy: -1 },
    { key: 'northwest', dx: -1, dy: -1 },
    { key: 'southeast', dx: 1, dy: 1 },
    { key: 'southwest', dx: -1, dy: 1 },
  ]);
});

// countEnabledRooms

test('countEnabledRooms: returns 0 for all-empty grid', () => {
  const data = [[{}, {}], [{}, {}]];
  expect(countEnabledRooms(data)).toBe(0);
});

test('countEnabledRooms: counts only rooms with enabled=true', () => {
  const data = [
    [{ enabled: true }, {}],
    [{ enabled: true }, { enabled: true }],
  ];
  expect(countEnabledRooms(data)).toBe(3);
});

test('countEnabledRooms: ignores rooms with other properties but no enabled flag', () => {
  const data = [[{ text: 'Tavern' }], [{ exits: { north: true } }]];
  expect(countEnabledRooms(data)).toBe(0);
});

// countExitLinks

test('countExitLinks: counts each truthy exit flag, ignores false ones', () => {
  const data = [
    [{ exits: { north: true, south: false } }, {}],
    [{ exits: { east: true, west: true } }, { enabled: true }],
  ];
  expect(countExitLinks(data)).toBe(3);
});

test('countExitLinks: returns 0 when no exits set', () => {
  expect(countExitLinks([[{}, { enabled: true }]])).toBe(0);
});

// countCellBackgrounds

test('countCellBackgrounds: counts cells with a bg color, ignores the rest', () => {
  const data = [
    [{ bg: '#00AF00' }, {}],
    [{ bg: '#00AF00', enabled: true }, { enabled: true }],
  ];
  expect(countCellBackgrounds(data)).toBe(2);
});

test('countCellBackgrounds: returns 0 when no backgrounds set', () => {
  expect(countCellBackgrounds([[{}, { enabled: true }]])).toBe(0);
});

// moveSelectionAcrossLayers

test('moveSelectionAcrossLayers: moves cells to target and clears source', () => {
  const src = makeGrid(3, 3);
  src[1][1] = { enabled: true, fillColor: '#abc' };
  const res = moveSelectionAcrossLayers(src, makeGrid(3, 3), ['1,1']);
  expect(res.dstData[1][1]).toEqual({ enabled: true, fillColor: '#abc' });
  expect(res.srcData[1][1]).toEqual({});
});

test('moveSelectionAcrossLayers: returns null when a target cell is enabled', () => {
  const src = makeGrid(3, 3);
  src[1][1] = { enabled: true };
  const dst = makeGrid(3, 3);
  dst[1][1] = { enabled: true };
  expect(moveSelectionAcrossLayers(src, dst, ['1,1'])).toBeNull();
});

test('moveSelectionAcrossLayers: does not mutate inputs', () => {
  const src = makeGrid(2, 2);
  src[0][0] = { enabled: true };
  const dst = makeGrid(2, 2);
  moveSelectionAcrossLayers(src, dst, ['0,0']);
  expect(src[0][0]).toEqual({ enabled: true });
  expect(dst[0][0]).toEqual({});
});

// estimateMapKbSize

test('estimateMapKbSize: returns a string with one decimal place', () => {
  const layers = [{ id: 'a', name: 'L1', data: [[{}]] }];
  expect(estimateMapKbSize(layers)).toMatch(/^\d+\.\d$/);
});

test('estimateMapKbSize: larger data produces a larger value', () => {
  const small = [{ data: [[{}]] }];
  const large = [{ data: Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ enabled: true, text: 'Room' }))
  )}];
  expect(parseFloat(estimateMapKbSize(large))).toBeGreaterThan(parseFloat(estimateMapKbSize(small)));
});

// Build a grid big enough for the transform's rotated footprint.
const gridFor = (w, h) => Array.from({ length: w }, () => Array.from({ length: h }, () => ({})));

test('transformSelection: rotateCW moves an L and remaps exits', () => {
  // L-shape at (0,0),(0,1),(1,1). (0,0) has a north exit, (1,1) has an east exit.
  const grid = gridFor(4, 4);
  grid[0][0] = { enabled: true, exits: { north: true } };
  grid[0][1] = { enabled: true };
  grid[1][1] = { enabled: true, exits: { east: true }, exitColors: { east: '#abc' } };
  const keys = ['0,0', '0,1', '1,1'];
  const { moves, newKeys } = transformSelection(grid, keys, 'rotateCW');

  // CW about top-left of a 2×2 box: (0,0)->(1,0), (0,1)->(0,0), (1,1)->(0,1).
  const byFrom = Object.fromEntries(moves.map(m => [m.from, m]));
  expect(byFrom['0,0'].to).toBe('1,0');
  expect(byFrom['0,1'].to).toBe('0,0');
  expect(byFrom['1,1'].to).toBe('0,1');
  // north -> east, east -> south (colors follow their key).
  expect(byFrom['0,0'].data.exits).toEqual({ east: true });
  expect(byFrom['1,1'].data.exits).toEqual({ south: true });
  expect(byFrom['1,1'].data.exitColors).toEqual({ south: '#abc' });
  expect(new Set(newKeys)).toEqual(new Set(['1,0', '0,0', '0,1']));
});

test('transformSelection: flipH mirrors positions and east<->west, up untouched', () => {
  const grid = gridFor(4, 4);
  grid[0][0] = { enabled: true, exits: { east: true, up: true } };
  grid[1][0] = { enabled: true };
  const { moves } = transformSelection(grid, ['0,0', '1,0'], 'flipH');
  const byFrom = Object.fromEntries(moves.map(m => [m.from, m]));
  expect(byFrom['0,0'].to).toBe('1,0');
  expect(byFrom['1,0'].to).toBe('0,0');
  expect(byFrom['0,0'].data.exits).toEqual({ west: true, up: true });
});

test('transformSelection: returns null when rotation would go off-map', () => {
  // Wide 1×3 selection along the top row; rotating CW needs 3 rows of height,
  // but it sits at y=0 so it fits — instead put it flush at the right edge.
  const grid = gridFor(3, 3);
  // 3-wide selection at bottom row rotates to 3-tall, exceeding height from minY.
  const keys = ['0,2', '1,2', '2,2'];
  expect(transformSelection(grid, keys, 'rotateCW')).toBeNull();
});

// elasticRemapExits: after a nudge, boundary links between a moved room and a
// stationary enabled neighbor are re-pointed to the new relative direction, or
// deleted if the gap grows past one cell. Only reciprocal links are touched.
// Return shape: { moved: Map<origKey, {exits,exitColors}>, neighbors: Map<key, {exits,exitColors}> }.
const remapPairs = (keys) => keys.map(k => { const [x, y] = k.split(',').map(Number); return { x, y }; });

test('elasticRemapExits: south nudge turns a west-east link into a diagonal (both sides, colors follow)', () => {
  // User's example: stationary west room W(0,1) <-> selected east room E(1,1), E nudged south.
  const grid = gridFor(5, 5);
  grid[0][1] = { enabled: true, exits: { east: true }, exitColors: { east: '#def' } };
  grid[1][1] = { enabled: true, exits: { west: true }, exitColors: { west: '#abc' } };
  const { moved, neighbors } = elasticRemapExits(grid, remapPairs(['1,1']), new Set(['1,1']), 0, 1);
  // E'(1,2) -> W(0,1) is northwest; W -> E' is southeast.
  expect(moved.get('1,1').exits).toEqual({ northwest: true });
  expect(moved.get('1,1').exitColors).toEqual({ northwest: '#abc' });
  expect(neighbors.get('0,1').exits).toEqual({ southeast: true });
  expect(neighbors.get('0,1').exitColors).toEqual({ southeast: '#def' });
});

test('elasticRemapExits: a link behind the travel direction stretches past one cell and is deleted', () => {
  // Stationary N(1,0) <-> selected S(1,1); nudging south opens a 2-cell gap.
  const grid = gridFor(5, 5);
  grid[1][0] = { enabled: true, exits: { south: true } };
  grid[1][1] = { enabled: true, exits: { north: true } };
  const { moved, neighbors } = elasticRemapExits(grid, remapPairs(['1,1']), new Set(['1,1']), 0, 1);
  expect(moved.get('1,1').exits).toEqual({});
  expect(neighbors.get('1,0').exits).toEqual({});
});

test('elasticRemapExits: diagonal nudge re-points a still-adjacent link', () => {
  // Stationary N(2,1) <-> selected S(1,1); nudge southeast keeps them adjacent.
  const grid = gridFor(5, 5);
  grid[2][1] = { enabled: true, exits: { west: true } };
  grid[1][1] = { enabled: true, exits: { east: true } };
  const { moved, neighbors } = elasticRemapExits(grid, remapPairs(['1,1']), new Set(['1,1']), 1, 1);
  // S'(2,2) -> N(2,1) is north; N -> S' is south.
  expect(moved.get('1,1').exits).toEqual({ north: true });
  expect(neighbors.get('2,1').exits).toEqual({ south: true });
});

test('elasticRemapExits: leaves non-reciprocal and dangling exits untouched', () => {
  const grid = gridFor(5, 5);
  // (2,1) enabled but has no matching west exit; (1,0) is empty. Neither is a link.
  grid[2][1] = { enabled: true, exits: { north: true } };
  grid[1][1] = { enabled: true, exits: { east: true, west: true } };
  const { moved, neighbors } = elasticRemapExits(grid, remapPairs(['1,1']), new Set(['1,1']), 0, 1);
  expect(moved.has('1,1')).toBe(false);
  expect(neighbors.size).toBe(0);
});

test('elasticRemapExits: leaves internal selected-to-selected links untouched', () => {
  const grid = gridFor(5, 5);
  grid[1][1] = { enabled: true, exits: { east: true } };
  grid[2][1] = { enabled: true, exits: { west: true } };
  const { moved, neighbors } = elasticRemapExits(grid, remapPairs(['1,1', '2,1']), new Set(['1,1', '2,1']), 0, 1);
  expect(moved.size).toBe(0);
  expect(neighbors.size).toBe(0);
});
