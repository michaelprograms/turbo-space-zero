// Connected-room generator for a selected region.
//
// generateLayout carves a maze/corridor layout inside a set of allowed cells
// using a randomized growing-tree (recursive backtracker). The result is always
// a single connected component: every carved step opens an exit on both adjacent
// rooms, so the exits alone form a spanning tree over the enabled cells.

import { DIRECTIONS } from './utils';

// Seeded PRNG (mulberry32) — deterministic, zero dependency. Same seed → same map.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Only orthogonal neighbours get corridors (compass diagonals + up/down are left
// to the author). opposite is the exit key the neighbour needs for the same link.
const ORTHO = [
  { dir: 'north', dx: 0, dy: -1, opposite: 'south' },
  { dir: 'south', dx: 0, dy: 1, opposite: 'north' },
  { dir: 'east', dx: 1, dy: 0, opposite: 'west' },
  { dir: 'west', dx: -1, dy: 0, opposite: 'east' },
];

const dirFromDelta = (dx, dy) =>
  Object.keys(DIRECTIONS).find((k) => DIRECTIONS[k].dx === dx && DIRECTIONS[k].dy === dy);

/**
 * A single meandering path (one cell wide, no branches) spanning the region's
 * long axis. Every step advances one cell along the long axis; the cross axis
 * does a bounded random walk, so sideways drift is a single diagonal exit.
 *
 * @param {Iterable<string>} regionKeys  allowed cell keys ("x,y")
 * @param {object} opts
 * @param {number} opts.curviness  0..1 chance of a sideways wobble each step
 * @param {number} opts.seed       integer seed for reproducibility
 * @returns {Map<string, {exits: object}>}
 */
export function generatePath(regionKeys, { curviness = 0.5, seed = 1 } = {}) {
  const region = new Set(regionKeys);
  if (region.size === 0) return new Map();

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const k of region) {
    const [x, y] = k.split(',').map(Number);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }

  // Long axis = the taller/wider dimension; ties advance vertically (south).
  const vertical = (maxY - minY) >= (maxX - minX);
  const longLo = vertical ? minY : minX;
  const longHi = vertical ? maxY : maxX;
  const crossLo = vertical ? minX : minY;
  const crossHi = vertical ? maxX : maxY;
  const inRegion = (long, cross) => region.has(vertical ? `${cross},${long}` : `${long},${cross}`);
  const keyOf = (long, cross) => (vertical ? `${cross},${long}` : `${long},${cross}`);

  const rand = mulberry32(seed);

  const starts = [];
  for (let c = crossLo; c <= crossHi; c += 1) if (inRegion(longLo, c)) starts.push(c);
  if (starts.length === 0) return new Map();

  let cross = starts[Math.floor(rand() * starts.length)];
  let prevKey = keyOf(longLo, cross);
  const result = new Map([[prevKey, { exits: {} }]]);

  for (let long = longLo + 1; long <= longHi; long += 1) {
    let d = rand() < curviness ? (rand() < 0.5 ? -1 : 1) : 0;
    if (d !== 0 && !inRegion(long, cross + d)) d = 0; // don't wander out of the band
    const nc = cross + d;
    if (!inRegion(long, nc)) break; // ragged selection: stop where the band ends
    const dir = dirFromDelta(vertical ? d : 1, vertical ? 1 : d);
    const curKey = keyOf(long, nc);
    result.get(prevKey).exits[dir] = true;
    result.set(curKey, { exits: { [DIRECTIONS[dir].opposite]: true } });
    prevKey = curKey;
    cross = nc;
  }

  return result;
}

/**
 * @param {Iterable<string>} regionKeys  allowed cell keys ("x,y")
 * @param {object} opts
 * @param {number} opts.density    0..1 fraction of the region to fill (default 1)
 * @param {number} opts.curviness  0..1 (0 = long straight corridors, 1 = winding)
 * @param {number} opts.seed       integer seed for reproducibility
 * @returns {Map<string, {exits: object}>}  carved cells → their exit flags
 */
export function generateLayout(regionKeys, { density = 1, curviness = 0.5, seed = 1 } = {}) {
  const region = new Set(regionKeys);
  const sorted = [...region].sort(); // stable order so seed → identical start
  const size = sorted.length;
  if (size === 0) return new Map();

  const rand = mulberry32(seed);
  const target = Math.max(1, Math.min(size, Math.round(density * size)));

  const result = new Map();
  const start = sorted[Math.floor(rand() * size)];
  result.set(start, { exits: {} });

  // stack entries carry the direction we arrived by, so we can bias toward
  // continuing straight (low curviness) vs. turning (high curviness).
  const stack = [{ key: start, lastDir: null }];

  while (stack.length > 0 && result.size < target) {
    const top = stack[stack.length - 1];
    const [x, y] = top.key.split(',').map(Number);

    const candidates = ORTHO.filter((n) => {
      const nk = `${x + n.dx},${y + n.dy}`;
      return region.has(nk) && !result.has(nk);
    });

    if (candidates.length === 0) {
      stack.pop();
      continue;
    }

    // Prefer going straight when curviness is low and the straight-ahead cell is
    // still open; otherwise pick a random candidate.
    const straight = candidates.find((n) => n.dir === top.lastDir);
    const chosen = straight && rand() > curviness
      ? straight
      : candidates[Math.floor(rand() * candidates.length)];

    const nk = `${x + chosen.dx},${y + chosen.dy}`;
    result.get(top.key).exits[chosen.dir] = true;
    result.set(nk, { exits: { [chosen.opposite]: true } });
    stack.push({ key: nk, lastDir: chosen.dir });
  }

  return result;
}
