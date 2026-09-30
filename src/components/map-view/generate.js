// Connected-room generators for a selected region. Each returns a
// Map<"x,y", {exits}> of carved rooms; exits are always set on both rooms of a
// link, and corridors are drawn with carve() so two diagonals never cross.

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

const dirFromDelta = (dx, dy) =>
  Object.keys(DIRECTIONS).find((k) => DIRECTIONS[k].dx === dx && DIRECTIONS[k].dy === dy);

const xy = (k) => k.split(',').map(Number);

function bounds(region) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const k of region) {
    const [x, y] = xy(k);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Draws a straight 8-way (Bresenham) corridor from cell a to cell b into result.
 * All-or-nothing: returns false and changes nothing if a step would leave the
 * region, cross an existing diagonal exit (an X), or — with fresh — enter a
 * cell that is already a room or, after the first two steps, touches one (so a
 * branch peels away instead of hugging what it left).
 */
function carve(result, region, a, b, { fresh = false } = {}) {
  let [x, y] = xy(a);
  const [x1, y1] = xy(b);
  const dx = Math.abs(x1 - x), dy = -Math.abs(y1 - y);
  const sx = x < x1 ? 1 : -1, sy = y < y1 ? 1 : -1;
  const steps = [];
  let err = dx + dy;
  while (x !== x1 || y !== y1) {
    const e2 = 2 * err;
    let nx = x, ny = y;
    if (e2 >= dy) { err += dy; nx += sx; }
    if (e2 <= dx) { err += dx; ny += sy; }
    const nk = `${nx},${ny}`;
    if (!region.has(nk) || (fresh && result.has(nk))) return false;
    if (fresh && steps.length >= 2 && Object.values(DIRECTIONS).some((d) => result.has(`${nx + d.dx},${ny + d.dy}`))) return false;
    // The other diagonal of this 2×2 square runs (nx,y) → (x,ny).
    if (nx !== x && ny !== y && result.get(`${nx},${y}`)?.exits[dirFromDelta(x - nx, ny - y)]) return false;
    steps.push([`${x},${y}`, nk, dirFromDelta(nx - x, ny - y)]);
    x = nx; y = ny;
  }
  const room = (k) => {
    if (!result.has(k)) result.set(k, { exits: {} });
    return result.get(k);
  };
  room(a);
  for (const [from, to, dir] of steps) {
    room(from).exits[dir] = true;
    room(to).exits[DIRECTIONS[dir].opposite] = true;
  }
  return true;
}

/**
 * A main path through waypoints spread along the region's long axis, plus
 * optional side branches. Curviness sets how far the waypoints swing off the
 * centre line (0 = straight, 1 = the full cross width).
 *
 * @param {Iterable<string>} regionKeys  allowed cell keys ("x,y")
 * @param {object} opts
 * @param {number} opts.curviness  0..1 waypoint swing
 * @param {number} opts.branches   number of side branches to try to add
 * @param {number} opts.seed       integer seed for reproducibility
 * @returns {Map<string, {exits: object}>}
 */
export function generatePath(regionKeys, { curviness = 0.5, branches = 0, seed = 1 } = {}) {
  const region = new Set(regionKeys);
  if (region.size === 0) return new Map();
  const { minX, maxX, minY, maxY } = bounds(region);

  // Long axis = the taller/wider dimension; ties run vertically.
  const vertical = (maxY - minY) >= (maxX - minX);
  const longLo = vertical ? minY : minX;
  const longHi = vertical ? maxY : maxX;
  const crossLo = vertical ? minX : minY;
  const crossHi = vertical ? maxX : maxY;
  const keyOf = (long, cross) => (vertical ? `${cross},${long}` : `${long},${cross}`);

  // Nearest in-region cell to `cross` on this long-axis line, or null.
  const snap = (long, cross) => {
    for (let d = 0; d <= crossHi - crossLo; d += 1) {
      for (const c of [cross - d, cross + d]) {
        if (c >= crossLo && c <= crossHi && region.has(keyOf(long, c))) return keyOf(long, c);
      }
    }
    return null;
  };

  const rand = mulberry32(seed);
  const mid = (crossLo + crossHi) / 2, half = (crossHi - crossLo) / 2;
  // Waypoint gap ≈ half the cross width, so small selections still get several bends.
  const segments = Math.max(1, Math.round((longHi - longLo) / Math.max(3, half)));
  // Waypoints alternate sides of the centre line (a serpentine), swinging
  // 50–100% of curviness × half the cross width.
  let side = rand() < 0.5 ? -1 : 1;
  const points = [];
  for (let s = 0; s <= segments; s += 1) {
    const long = Math.round(longLo + ((longHi - longLo) * s) / segments);
    const swing = side * (0.5 + rand() * 0.5) * curviness * half;
    const p = snap(long, Math.round(mid + swing));
    if (p) points.push(p);
    side = -side;
  }

  const result = new Map();
  if (points.length) result.set(points[0], { exits: {} });
  for (let n = 0; n + 1 < points.length; n += 1) {
    if (!carve(result, region, points[n], points[n + 1])) break; // ragged selection: stop at the gap
  }

  // Branches leave the main path roughly sideways and only through empty cells.
  const trunk = [...result.keys()];
  for (let b = 0; b < branches; b += 1) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const [x, y] = xy(trunk[Math.floor(rand() * trunk.length)]);
      const len = 2 + Math.floor(rand() * Math.min(7, Math.max(2, half))); // fits small selections
      const dLong = Math.round((rand() * 2 - 1) * len * 0.7);
      const dCross = rand() < 0.5 ? -len : len;
      const to = vertical ? `${x + dCross},${y + dLong}` : `${x + dLong},${y + dCross}`;
      if (carve(result, region, `${x},${y}`, to, { fresh: true })) break;
    }
  }

  return result;
}

/**
 * A maze on a lattice of nodes `spacing` cells apart (centred in the region),
 * grown as a spanning tree so it always reaches the whole selection. Corridors
 * between nodes fill the gaps, leaving empty space between them when spacing > 1.
 *
 * @param {Iterable<string>} regionKeys  allowed cell keys ("x,y")
 * @param {object} opts
 * @param {number}  opts.spacing    cells between maze nodes (1 = packed)
 * @param {number}  opts.branching  0..1: 0 = long winding corridors, 1 = bushy
 * @param {number}  opts.loops      0..1 chance each unused link is opened (fewer dead ends)
 * @param {boolean} opts.diagonals  allow diagonal corridors
 * @param {number}  opts.seed       integer seed for reproducibility
 * @returns {Map<string, {exits: object}>}
 */
export function generateLayout(regionKeys, {
  spacing = 2, branching = 0.5, loops = 0, diagonals = false, seed = 1,
} = {}) {
  const region = new Set(regionKeys);
  if (region.size === 0) return new Map();
  const { minX, maxX, minY, maxY } = bounds(region);

  const ox = minX + Math.floor(((maxX - minX) % spacing) / 2);
  const oy = minY + Math.floor(((maxY - minY) % spacing) / 2);
  const nodes = [];
  for (let y = oy; y <= maxY; y += spacing) {
    for (let x = ox; x <= maxX; x += spacing) if (region.has(`${x},${y}`)) nodes.push(`${x},${y}`);
  }
  if (nodes.length === 0) return new Map();
  const nodeSet = new Set(nodes);

  const moves = Object.values(DIRECTIONS).filter(({ dx, dy }) => diagonals || dx === 0 || dy === 0);
  const neighbours = (k) => {
    const [x, y] = xy(k);
    return moves.map(({ dx, dy }) => `${x + dx * spacing},${y + dy * spacing}`).filter((n) => nodeSet.has(n));
  };

  const rand = mulberry32(seed);
  const start = nodes[Math.floor(rand() * nodes.length)];
  const result = new Map([[start, { exits: {} }]]);
  const visited = new Set([start]);
  const active = [start];

  // Growing tree: extending the newest node gives a backtracker's long corridors,
  // a random node gives Prim-style bushy branching.
  while (active.length > 0) {
    const i = rand() < branching ? Math.floor(rand() * active.length) : active.length - 1;
    const open = neighbours(active[i]).filter((n) => !visited.has(n));
    let grew = false;
    while (open.length > 0 && !grew) {
      const n = open.splice(Math.floor(rand() * open.length), 1)[0];
      if (carve(result, region, active[i], n)) { visited.add(n); active.push(n); grew = true; }
    }
    if (!grew) active.splice(i, 1);
  }

  // Loops: open some of the links the tree didn't use.
  if (loops > 0) {
    for (const k of visited) {
      for (const n of neighbours(k)) {
        if (k < n && visited.has(n) && rand() < loops) {
          const [x, y] = xy(k), [nx, ny] = xy(n);
          const dir = dirFromDelta(Math.sign(nx - x), Math.sign(ny - y));
          if (!result.get(k).exits[dir]) carve(result, region, k, n);
        }
      }
    }
  }

  return result;
}

/**
 * A Voronoi "web": scatter one site per spacing×spacing tile (jittered grid, so
 * coverage is even), then carve corridors along the borders between the sites'
 * regions. Borders are straight lines, rasterised with 8-way steps, so diagonal
 * exits appear naturally. Borders that hit the selection edge run out to it.
 *
 * @param {Iterable<string>} regionKeys  allowed cell keys ("x,y")
 * @param {object} opts
 * @param {number} opts.spacing  approx. distance between sites (cell size of the web)
 * @param {number} opts.seed     integer seed for reproducibility
 * @returns {Map<string, {exits: object}>}
 */
export function generateWeb(regionKeys, { spacing = 6, seed = 1 } = {}) {
  const region = new Set(regionKeys);
  if (region.size === 0) return new Map();

  const { minX, maxX, minY, maxY } = bounds(region);

  const rand = mulberry32(seed);
  const sites = [];
  for (let gy = minY; gy <= maxY; gy += spacing) {
    for (let gx = minX; gx <= maxX; gx += spacing) {
      const x = gx + Math.floor(rand() * spacing);
      const y = gy + Math.floor(rand() * spacing);
      if (region.has(`${x},${y}`)) sites.push([x, y]);
    }
  }
  if (sites.length < 2) return new Map();

  // ponytail: brute-force nearest site, O(cells × sites); bucket sites by tile if big maps crawl
  const owner = new Map();
  for (const k of region) {
    const [x, y] = k.split(',').map(Number);
    let best = 0, bestD = Infinity;
    sites.forEach(([sx, sy], i) => {
      const d = (sx - x) ** 2 + (sy - y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    owner.set(k, best);
  }

  // Voronoi vertices: 2×2 blocks where ≥3 regions meet, or where a border between
  // two regions meets the selection edge. Each vertex is filed under every pair of
  // regions it touches; a pair's vertices all lie on that pair's shared border.
  const byPair = new Map();
  for (let x = minX - 1; x <= maxX; x += 1) {
    for (let y = minY - 1; y <= maxY; y += 1) {
      const owners = new Set();
      let anchor = null, edge = false;
      for (const k of [`${x},${y}`, `${x + 1},${y}`, `${x},${y + 1}`, `${x + 1},${y + 1}`]) {
        if (!owner.has(k)) { edge = true; continue; }
        owners.add(owner.get(k));
        anchor ??= k;
      }
      if (owners.size < 3 && !(edge && owners.size === 2)) continue;
      const o = [...owners].sort((a, b) => a - b);
      for (let i = 0; i < o.length; i += 1) {
        for (let j = i + 1; j < o.length; j += 1) {
          const pk = `${o[i]},${o[j]}`;
          if (!byPair.has(pk)) byPair.set(pk, new Set());
          byPair.get(pk).add(anchor);
        }
      }
    }
  }

  const result = new Map();

  for (const [pk, anchors] of byPair) {
    const [i, j] = pk.split(',').map(Number);
    // The border is perpendicular to the line between the two sites; order its
    // vertices along it and join consecutive ones.
    const px = sites[i][1] - sites[j][1], py = sites[j][0] - sites[i][0];
    const along = (k) => { const [x, y] = k.split(',').map(Number); return x * px + y * py; };
    const ordered = [...anchors].sort((a, b) => along(a) - along(b));
    for (let n = 0; n + 1 < ordered.length; n += 1) carve(result, region, ordered[n], ordered[n + 1]);
  }

  // A border clipped by the selection can run edge-to-edge without meeting any
  // other border (usually in a corner), leaving an island. Bridge each island to
  // the main web with the shortest straight corridor.
  const components = [];
  const seen = new Set();
  for (const start of result.keys()) {
    if (seen.has(start)) continue;
    const comp = [start];
    seen.add(start);
    for (let n = 0; n < comp.length; n += 1) {
      const [x, y] = comp[n].split(',').map(Number);
      for (const dir of Object.keys(result.get(comp[n]).exits)) {
        const nk = `${x + DIRECTIONS[dir].dx},${y + DIRECTIONS[dir].dy}`;
        if (!seen.has(nk)) { seen.add(nk); comp.push(nk); }
      }
    }
    components.push(comp);
  }
  components.sort((a, b) => b.length - a.length);
  const main = components[0] ?? [];
  for (const comp of components.slice(1)) {
    // ponytail: O(|comp| × |main|) nearest pair; islands are small in practice
    let best = null, bestD = Infinity;
    for (const a of comp) {
      const [ax, ay] = xy(a);
      for (const b of main) {
        const [bx, by] = xy(b);
        const d = Math.max(Math.abs(ax - bx), Math.abs(ay - by));
        if (d < bestD) { bestD = d; best = [a, b]; }
      }
    }
    carve(result, region, best[0], best[1]); // may refuse (non-convex selection / X); island stays
    main.push(...comp);
  }

  return result;
}
