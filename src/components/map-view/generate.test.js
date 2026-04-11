import { describe, test, expect } from 'vitest';
import { mulberry32, generateLayout, generatePath } from './generate';
import { getRectCells } from './utils';

const OPP = { north: 'south', south: 'north', east: 'west', west: 'east' };
const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// Full 8-direction versions for path tests (paths use diagonal exits).
const STEP2 = {
  ...STEP,
  northeast: [1, -1], northwest: [-1, -1], southeast: [1, 1], southwest: [-1, 1],
};
const OPP2 = {
  ...OPP,
  northeast: 'southwest', southwest: 'northeast', northwest: 'southeast', southeast: 'northwest',
};

// BFS over carved exits; returns the reachable cell count from any start cell.
function reachableCount(layout) {
  const start = layout.keys().next().value;
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const key = queue.shift();
    const [x, y] = key.split(',').map(Number);
    for (const dir of Object.keys(layout.get(key).exits)) {
      const [dx, dy] = STEP[dir];
      const nk = `${x + dx},${y + dy}`;
      if (layout.has(nk) && !seen.has(nk)) { seen.add(nk); queue.push(nk); }
    }
  }
  return seen.size;
}

describe('mulberry32', () => {
  test('is deterministic for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('generateLayout', () => {
  const region = getRectCells(0, 0, 9, 9); // 10x10

  test('same seed produces identical output', () => {
    const a = generateLayout(region, { seed: 7 });
    const b = generateLayout(region, { seed: 7 });
    expect([...a.keys()].sort()).toEqual([...b.keys()].sort());
  });

  test('stays within the region', () => {
    const layout = generateLayout(region, { seed: 3 });
    for (const key of layout.keys()) expect(region.has(key)).toBe(true);
  });

  test('every carved cell is connected via exits', () => {
    const layout = generateLayout(region, { seed: 5, density: 0.6 });
    expect(reachableCount(layout)).toBe(layout.size);
  });

  test('exits are symmetric between neighbours', () => {
    const layout = generateLayout(region, { seed: 9 });
    for (const [key, room] of layout) {
      const [x, y] = key.split(',').map(Number);
      for (const dir of Object.keys(room.exits)) {
        const [dx, dy] = STEP[dir];
        const nk = `${x + dx},${y + dy}`;
        expect(layout.get(nk)?.exits?.[OPP[dir]]).toBe(true);
      }
    }
  });

  test('density controls how much of the region fills', () => {
    const full = generateLayout(region, { seed: 1, density: 1 });
    const half = generateLayout(region, { seed: 1, density: 0.5 });
    expect(full.size).toBe(100);
    expect(half.size).toBe(50);
  });

  test('empty region yields an empty layout', () => {
    expect(generateLayout([], { seed: 1 }).size).toBe(0);
  });
});

describe('generatePath', () => {
  const thin = getRectCells(0, 0, 2, 13); // 3 wide, 14 tall → vertical path

  const exitCount = (layout) =>
    [...layout.values()].map(r => Object.keys(r.exits).length);

  test('same seed produces identical output', () => {
    const a = generatePath(thin, { seed: 4, curviness: 0.5 });
    const b = generatePath(thin, { seed: 4, curviness: 0.5 });
    expect([...a]).toEqual([...b]);
  });

  test('is a single unbranched path spanning the long axis', () => {
    const layout = generatePath(thin, { seed: 2, curviness: 0.6 });
    // one cell per row → spans full height
    expect(layout.size).toBe(14);
    // exactly two endpoints (1 exit); everything else has 2; nothing branches
    const counts = exitCount(layout);
    expect(counts.filter(c => c === 1)).toHaveLength(2);
    expect(Math.max(...counts)).toBe(2);
  });

  test('advances one row per column (monotonic long axis)', () => {
    const layout = generatePath(thin, { seed: 8, curviness: 0.7 });
    const ys = [...layout.keys()].map(k => Number(k.split(',')[1])).sort((a, b) => a - b);
    expect(ys).toEqual([...Array(14).keys()]); // 0..13, each exactly once
  });

  test('curviness 0 yields a straight line', () => {
    const layout = generatePath(thin, { seed: 1, curviness: 0 });
    const xs = new Set([...layout.keys()].map(k => k.split(',')[0]));
    expect(xs.size).toBe(1); // never wanders sideways
  });

  test('exits are symmetric between neighbours', () => {
    const layout = generatePath(thin, { seed: 3 });
    for (const [key, room] of layout) {
      const [x, y] = key.split(',').map(Number);
      for (const dir of Object.keys(room.exits)) {
        const [dx, dy] = STEP2[dir];
        const nk = `${x + dx},${y + dy}`;
        expect(layout.get(nk)?.exits?.[OPP2[dir]]).toBe(true);
      }
    }
  });

  test('picks the wider dimension as the axis (horizontal selection)', () => {
    const wide = getRectCells(0, 0, 13, 2); // 14 wide, 3 tall → horizontal path
    const layout = generatePath(wide, { seed: 5, curviness: 0.5 });
    expect(layout.size).toBe(14);
    const xs = [...layout.keys()].map(k => Number(k.split(',')[0])).sort((a, b) => a - b);
    expect(xs).toEqual([...Array(14).keys()]);
  });

  test('stays within the region', () => {
    const layout = generatePath(thin, { seed: 9, curviness: 1 });
    for (const key of layout.keys()) expect(thin.has(key)).toBe(true);
  });
});
