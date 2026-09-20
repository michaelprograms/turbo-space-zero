// src/components/map-view/utils.js
import { serializeLayer } from '../../data/prune';

export const EMPTY_SET = new Set();

export function cloneMapGrid(mapData) {
  return mapData.map(col => [...col]);
}

export function getEffectiveKeys(selectedCells, focusX, focusY) {
  const focusKey = `${focusX},${focusY}`;
  return selectedCells.size > 0
    ? [...new Set([...selectedCells, focusKey])]
    : [focusKey];
}

export function getRectCells(ax, ay, bx, by) {
  const minX = Math.min(ax, bx);
  const maxX = Math.max(ax, bx);
  const minY = Math.min(ay, by);
  const maxY = Math.max(ay, by);
  const cells = new Set();
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      cells.add(`${x},${y}`);
    }
  }
  return cells;
}

// Move the given cells from srcData into the same coords of dstData.
// Returns { srcData, dstData } (both cloned) or null if any target cell is
// already enabled — i.e. there's a conflict, so nothing moves.
export function moveSelectionAcrossLayers(srcData, dstData, effectiveKeys) {
  const pairs = effectiveKeys.map(k => k.split(',').map(Number));
  for (const [x, y] of pairs) {
    if (dstData[x]?.[y]?.enabled) return null;
  }
  const srcCopy = cloneMapGrid(srcData);
  const dstCopy = cloneMapGrid(dstData);
  for (const [x, y] of pairs) {
    dstCopy[x][y] = { ...srcData[x][y] };
    srcCopy[x][y] = {};
  }
  return { srcData: srcCopy, dstData: dstCopy };
}

// Rotating/flipping a selection has to move both the cells AND rename each
// room's exit direction keys so exits keep pointing the same way after the
// transform. up/down (vertical, between layers) are unaffected.
const EXIT_REMAP = {
  rotateCW:  { north: 'east', east: 'south', south: 'west', west: 'north',
               northeast: 'southeast', southeast: 'southwest', southwest: 'northwest', northwest: 'northeast' },
  rotateCCW: { north: 'west', west: 'south', south: 'east', east: 'north',
               northeast: 'northwest', northwest: 'southwest', southwest: 'southeast', southeast: 'northeast' },
  flipH:     { east: 'west', west: 'east', northeast: 'northwest', northwest: 'northeast',
               southeast: 'southwest', southwest: 'southeast' },
  flipV:     { north: 'south', south: 'north', northeast: 'southeast', southeast: 'northeast',
               northwest: 'southwest', southwest: 'northwest' },
};

// New box-relative position (and the box's post-transform W×H) for each op.
// Screen coords are y-down; rotations swap W/H, flips preserve them.
const POS = {
  rotateCW:  (rx, ry, W, H) => ({ x: (H - 1) - ry, y: rx, W: H, H: W }),
  rotateCCW: (rx, ry, W, H) => ({ x: ry, y: (W - 1) - rx, W: H, H: W }),
  flipH:     (rx, ry, W, H) => ({ x: (W - 1) - rx, y: ry, W, H }),
  flipV:     (rx, ry, W, H) => ({ x: rx, y: (H - 1) - ry, W, H }),
};

function remapRoomDirections(room, op) {
  const table = EXIT_REMAP[op];
  const remapObj = (obj) => {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[table[k] ?? k] = v;
    return out;
  };
  const next = { ...room };
  if (room.exits) next.exits = remapObj(room.exits);
  if (room.exitColors) next.exitColors = remapObj(room.exitColors);
  return next;
}

// Rotate (90° CW/CCW) or flip (H/V) the selected cells about their bounding-box
// top-left corner. Returns { moves: [{from, to, data}], newKeys } or null if any
// cell would land off-map (in which case the caller changes nothing).
export function transformSelection(mapData, effectiveKeys, op) {
  const posFn = POS[op];
  if (!posFn) return null;
  const width = mapData.length;
  const height = mapData[0]?.length ?? 0;
  const pairs = effectiveKeys.map(k => k.split(',').map(Number));
  const minX = Math.min(...pairs.map(([x]) => x));
  const minY = Math.min(...pairs.map(([, y]) => y));
  const W = Math.max(...pairs.map(([x]) => x)) - minX + 1;
  const H = Math.max(...pairs.map(([, y]) => y)) - minY + 1;

  const moves = [];
  for (const [x, y] of pairs) {
    const t = posFn(x - minX, y - minY, W, H);
    const nx = minX + t.x, ny = minY + t.y;
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) return null;
    moves.push({ from: `${x},${y}`, to: `${nx},${ny}`, data: remapRoomDirections({ ...mapData[x][y] }, op) });
  }
  return { moves, newKeys: moves.map(m => m.to) };
}

export const getConnectorPositions = (layers, zoneIndex) => {
  const positions = new Set();
  const width = Math.max(0, ...layers.map(l => l.data?.length ?? 0));
  const height = Math.max(0, ...layers.map(l => l.data?.[0]?.length ?? 0));
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const hasUpBelow = layers.slice(0, zoneIndex + 1).some(
        layer => layer.data[x]?.[y]?.exits?.up
      );
      const hasDownAbove = layers.slice(zoneIndex + 1).some(
        layer => layer.data[x]?.[y]?.exits?.down
      );
      if (hasUpBelow && hasDownAbove) positions.add(`${x},${y}`);
    }
  }
  return positions;
};

// Key '5' / 'Clear' (numpad center) intentionally omitted — no direction.
export const KEY_DIRECTION = {
  'End': 'southwest',      '1': 'southwest',
  'ArrowDown': 'south',    '2': 'south',
  'PageDown': 'southeast', '3': 'southeast',
  'ArrowLeft': 'west',     '4': 'west',
  'ArrowRight': 'east',    '6': 'east',
  'Home': 'northwest',     '7': 'northwest',
  'ArrowUp': 'north',      '8': 'north',
  'PageUp': 'northeast',   '9': 'northeast',
};

export const DIRECTIONS = {
  north:     { dx: 0,  dy: -1, opposite: 'south'     },
  south:     { dx: 0,  dy:  1, opposite: 'north'     },
  east:      { dx:  1, dy:  0, opposite: 'west'      },
  west:      { dx: -1, dy:  0, opposite: 'east'      },
  northeast: { dx:  1, dy: -1, opposite: 'southwest' },
  northwest: { dx: -1, dy: -1, opposite: 'southeast' },
  southeast: { dx:  1, dy:  1, opposite: 'northwest' },
  southwest: { dx: -1, dy:  1, opposite: 'northeast' },
};

// Reverse lookup: "dx,dy" -> direction key, for turning a relative vector back
// into an exit name.
const VEC_DIRECTION = Object.fromEntries(
  Object.entries(DIRECTIONS).map(([dir, { dx, dy }]) => [`${dx},${dy}`, dir])
);

// After nudging a selection by (dx, dy), re-point exits that link a moved room
// to a stationary enabled neighbor: if the two are still adjacent the exit is
// renamed to the new relative direction (on both rooms), otherwise the link is
// deleted (on both rooms). Only reciprocal links are touched; dangling exits,
// internal selected<->selected links, and up/down are left alone.
// Returns { moved: Map<origKey,{exits,exitColors}>, neighbors: Map<key,{exits,exitColors}> }
// holding the full new exits/exitColors for each changed room.
export function elasticRemapExits(mapData, effectivePairs, selectedSet, dx, dy) {
  const width = mapData.length;
  const height = mapData[0]?.length ?? 0;
  const moved = new Map();
  const neighbors = new Map();

  // Lazily fetch a mutable working copy of a room's exits/exitColors from the
  // right result map, seeded from the original room so untouched exits survive.
  const patchFor = (map, key, room) => {
    let entry = map.get(key);
    if (!entry) {
      entry = { exits: { ...(room.exits ?? {}) }, exitColors: { ...(room.exitColors ?? {}) } };
      map.set(key, entry);
    }
    return entry;
  };

  for (const { x, y } of effectivePairs) {
    const room = mapData[x][y];
    if (!room?.exits) continue;
    for (const dir of Object.keys(room.exits)) {
      if (!room.exits[dir]) continue;
      const vec = DIRECTIONS[dir];
      if (!vec) continue; // up/down have no dx/dy
      const nx = x + vec.dx, ny = y + vec.dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const neighbor = mapData[nx][ny];
      // Only real cross-boundary links: enabled, not part of the moved group,
      // and reciprocating this exit.
      if (!neighbor?.enabled || selectedSet.has(`${nx},${ny}`)) continue;
      if (!neighbor.exits?.[vec.opposite]) continue;

      const newVec = { dx: vec.dx - dx, dy: vec.dy - dy };
      const movedKey = `${x},${y}`;
      const neighborKey = `${nx},${ny}`;
      const movedEntry = patchFor(moved, movedKey, room);
      const neighborEntry = patchFor(neighbors, neighborKey, neighbor);

      // Drop the old exit on both sides regardless of outcome.
      const color = movedEntry.exitColors[dir];
      const neighborColor = neighborEntry.exitColors[vec.opposite];
      delete movedEntry.exits[dir];
      delete movedEntry.exitColors[dir];
      delete neighborEntry.exits[vec.opposite];
      delete neighborEntry.exitColors[vec.opposite];

      const newDir = VEC_DIRECTION[`${newVec.dx},${newVec.dy}`];
      if (newDir) { // still adjacent: re-point both sides
        movedEntry.exits[newDir] = true;
        if (color !== undefined) movedEntry.exitColors[newDir] = color;
        const newOpp = DIRECTIONS[newDir].opposite;
        neighborEntry.exits[newOpp] = true;
        if (neighborColor !== undefined) neighborEntry.exitColors[newOpp] = neighborColor;
      }
    }
  }
  return { moved, neighbors };
}

// Derived from DIRECTIONS so the dx/dy vectors have a single source of truth.
// Key order matches DIRECTIONS: north, south, east, west, northeast, northwest, southeast, southwest.
export const EXIT_DIRECTIONS = Object.entries(DIRECTIONS).map(
  ([key, { dx, dy }]) => ({ key, dx, dy })
);

export function countEnabledRooms(layerData) {
  let count = 0;
  for (const col of layerData) {
    for (const room of col) {
      if (room?.enabled) count++;
    }
  }
  return count;
}

// Counts exit flags = one drawn exit line each (both sides of a corridor count).
export function countExitLinks(layerData) {
  let count = 0;
  for (const col of layerData) {
    for (const room of col) {
      if (room?.exits) for (const on of Object.values(room.exits)) if (on) count++;
    }
  }
  return count;
}

// Counts cells with a background color (e.g. island-border markers).
export function countCellBackgrounds(layerData) {
  let count = 0;
  for (const col of layerData) {
    for (const cell of col) {
      if (cell?.bg) count++;
    }
  }
  return count;
}

export function estimateMapKbSize(mapLayers) {
  // Measure what actually gets stored (sparse/pruned), not the dense in-memory grid.
  const sparse = (mapLayers ?? []).map(serializeLayer);
  return (JSON.stringify(sparse).length / 1024).toFixed(1);
}

// Filename-safe local timestamp: YYYY-MM-DD_HHMMSS (sorts chronologically, human-readable)
export function fileTimestamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
