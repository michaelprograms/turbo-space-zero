import { describe, test, expect } from 'vitest';
import { mulberry32, generateLayout, generatePath, generateWeb } from './generate';
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

// BFS over 8-way exits; returns the reachable cell count from the first cell.
function reachable8(layout) {
  const start = layout.keys().next().value;
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const key = queue.shift();
    const [x, y] = key.split(',').map(Number);
    for (const dir of Object.keys(layout.get(key).exits)) {
      const [dx, dy] = STEP2[dir];
      const nk = `${x + dx},${y + dy}`;
      if (layout.has(nk) && !seen.has(nk)) { seen.add(nk); queue.push(nk); }
    }
  }
  return seen.size;
}

function expectSymmetric(layout) {
  for (const [key, room] of layout) {
    const [x, y] = key.split(',').map(Number);
    for (const dir of Object.keys(room.exits)) {
      const [dx, dy] = STEP2[dir];
      expect(layout.get(`${x + dx},${y + dy}`)?.exits?.[OPP2[dir]]).toBe(true);
    }
  }
}

// Two diagonals in one 2×2 square would draw an X.
function expectNoCrossedDiagonals(layout) {
  for (const [key, room] of layout) {
    const [x, y] = key.split(',').map(Number);
    if (room.exits.southeast) expect(layout.get(`${x + 1},${y}`)?.exits?.southwest).toBeFalsy();
  }
}

describe('mulberry32', () => {
  test('is deterministic for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('generateLayout', () => {
  const region = getRectCells(0, 0, 19, 11); // 20x12

  test('same seed produces identical output', () => {
    const a = generateLayout(region, { seed: 7 });
    const b = generateLayout(region, { seed: 7 });
    expect([...a]).toEqual([...b]);
  });

  test('stays within the region', () => {
    const layout = generateLayout(region, { seed: 3, diagonals: true, loops: 0.5 });
    for (const key of layout.keys()) expect(region.has(key)).toBe(true);
  });

  test('connected, symmetric and X-free for every option mix', () => {
    for (const spacing of [1, 2, 3, 5]) {
      for (const diagonals of [false, true]) {
        for (let seed = 1; seed <= 10; seed += 1) {
          const layout = generateLayout(region, { spacing, diagonals, loops: 0.3, branching: seed / 10, seed });
          expect(reachable8(layout)).toBe(layout.size);
          expectSymmetric(layout);
          expectNoCrossedDiagonals(layout);
        }
      }
    }
  });

  test('reaches every lattice node, so it spreads across the whole selection', () => {
    const layout = generateLayout(region, { spacing: 3, seed: 4 });
    // lattice centred: x offset floor((19 % 3) / 2) = 0, y offset floor((11 % 3) / 2) = 1
    for (let x = 0; x <= 18; x += 3) {
      for (let y = 1; y <= 10; y += 3) expect(layout.has(`${x},${y}`)).toBe(true);
    }
  });

  test('spacing leaves empty space between corridors', () => {
    const packed = generateLayout(region, { spacing: 1, seed: 2 });
    const open = generateLayout(region, { spacing: 3, seed: 2 });
    expect(packed.size).toBe(region.size);
    expect(open.size).toBeLessThan(region.size / 2);
  });

  test('orthogonal-only unless diagonals is on', () => {
    const diag = (layout) => [...layout.values()].some(r => Object.keys(r.exits).some(d => d.length > 5));
    expect(diag(generateLayout(region, { spacing: 2, seed: 5 }))).toBe(false);
    expect(diag(generateLayout(region, { spacing: 2, seed: 5, diagonals: true }))).toBe(true);
  });

  test('branching and loops change the shape', () => {
    const leaves = (layout) => [...layout.values()].filter(r => Object.keys(r.exits).length === 1).length;
    const links = (layout) => [...layout.values()].reduce((n, r) => n + Object.keys(r.exits).length, 0) / 2;
    const tree = generateLayout(region, { spacing: 1, seed: 3 });
    const loopy = generateLayout(region, { spacing: 1, seed: 3, loops: 0.5 });
    expect(links(tree)).toBe(tree.size - 1); // spanning tree
    expect(links(loopy)).toBeGreaterThan(loopy.size - 1);
    const corridors = generateLayout(region, { spacing: 1, branching: 0, seed: 3 });
    const bushy = generateLayout(region, { spacing: 1, branching: 1, seed: 3 });
    expect(leaves(bushy)).toBeGreaterThan(leaves(corridors));
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

  test('curviness 1 swings across most of the selection', () => {
    const band = getRectCells(0, 0, 39, 19); // 40 wide, 20 tall → horizontal
    const layout = generatePath(band, { seed: 6, curviness: 1 });
    const ys = [...layout.keys()].map(k => Number(k.split(',')[1]));
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(12);
    expect(reachable8(layout)).toBe(layout.size);
  });

  test('branches add connected side paths without crossing diagonals', () => {
    const band = getRectCells(0, 0, 39, 19);
    const plain = generatePath(band, { seed: 6, curviness: 0.6 });
    const branched = generatePath(band, { seed: 6, curviness: 0.6, branches: 5 });
    expect(branched.size).toBeGreaterThan(plain.size);
    expect(Math.max(...exitCount(branched))).toBeGreaterThanOrEqual(3);
    expect(reachable8(branched)).toBe(branched.size);
    expectSymmetric(branched);
    expectNoCrossedDiagonals(branched);
  });

  test('stays within the region', () => {
    const layout = generatePath(thin, { seed: 9, curviness: 1 });
    for (const key of layout.keys()) expect(thin.has(key)).toBe(true);
  });
});

describe('generateWeb', () => {
  const region = getRectCells(0, 0, 29, 15); // 30x16

  test('same seed produces identical output', () => {
    const a = generateWeb(region, { seed: 4, spacing: 6 });
    const b = generateWeb(region, { seed: 4, spacing: 6 });
    expect([...a]).toEqual([...b]);
  });

  test('stays within the region and leaves open space', () => {
    const layout = generateWeb(region, { seed: 2, spacing: 6 });
    for (const key of layout.keys()) expect(region.has(key)).toBe(true);
    expect(layout.size).toBeGreaterThan(0);
    expect(layout.size).toBeLessThan(region.size / 2);
  });

  test('uses diagonal exits', () => {
    const layout = generateWeb(region, { seed: 2, spacing: 6 });
    const dirs = [...layout.values()].flatMap(r => Object.keys(r.exits));
    expect(dirs.some(d => d.length > 5)).toBe(true); // northeast etc.
  });

  test('is a single connected web with symmetric exits (many seeds)', () => {
    // seed 35 at spacing 6 used to leave a corner island before bridging
    for (let seed = 1; seed <= 50; seed += 1) {
      const layout = generateWeb(region, { seed, spacing: 6 });
      expect(reachable8(layout)).toBe(layout.size);
      for (const [key, room] of layout) {
        const [x, y] = key.split(',').map(Number);
        for (const dir of Object.keys(room.exits)) {
          const [dx, dy] = STEP2[dir];
          expect(layout.get(`${x + dx},${y + dy}`)?.exits?.[OPP2[dir]]).toBe(true);
        }
      }
    }
  });

  test('spreads across the whole selection, not one clump', () => {
    const layout = generateWeb(region, { seed: 6, spacing: 6 });
    // every 10x8 quadrant-ish block gets at least one room
    for (const [qx, qy] of [[0, 0], [10, 0], [20, 0], [0, 8], [10, 8], [20, 8]]) {
      const hit = [...layout.keys()].some(k => {
        const [x, y] = k.split(',').map(Number);
        return x >= qx && x < qx + 10 && y >= qy && y < qy + 8;
      });
      expect(hit).toBe(true);
    }
  });

  test('larger spacing yields fewer rooms', () => {
    const tight = generateWeb(region, { seed: 3, spacing: 4 });
    const open = generateWeb(region, { seed: 3, spacing: 12 });
    expect(open.size).toBeLessThan(tight.size);
  });

  test('empty region yields an empty layout', () => {
    expect(generateWeb([], { seed: 1 }).size).toBe(0);
  });
});
