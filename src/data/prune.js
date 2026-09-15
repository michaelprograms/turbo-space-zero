// Storage pruning: dense in memory, sparse on disk.
// Rendering everywhere falls back via `?? ROOM_DEFAULTS`, so any property equal
// to its default is redundant on disk. Empty cells are dropped entirely and the
// dense width×height grid is rebuilt on load. Kept separate from the storage API
// so pure callers (e.g. the KB-size readout) don't pull in idb-keyval or get
// caught by tests that mock the whole data module.

import { ROOM_DEFAULTS, EXIT_DEFAULT_COLOR } from '../constants/room';

const PRUNED_DEFAULT_KEYS = ['roomSize', 'borderWidth', 'borderRadius', 'borderColor', 'fillColor'];

export const pruneRoom = (room) => {
  if (!room) return undefined;
  const out = {};
  if (room.enabled) out.enabled = true;
  if (room.text) out.text = room.text;
  if (room.bg) out.bg = room.bg; // cell background tint (no default; absence = untinted)
  for (const k of PRUNED_DEFAULT_KEYS) {
    if (room[k] !== undefined && room[k] !== ROOM_DEFAULTS[k]) out[k] = room[k];
  }
  if (room.exits) {
    const exits = {};
    for (const [k, v] of Object.entries(room.exits)) if (v) exits[k] = true;
    if (Object.keys(exits).length) out.exits = exits;
  }
  if (room.exitColors) {
    const colors = {};
    for (const [k, v] of Object.entries(room.exitColors)) if (v && v !== EXIT_DEFAULT_COLOR) colors[k] = v;
    if (Object.keys(colors).length) out.exitColors = colors;
  }
  return Object.keys(out).length ? out : undefined;
};

export const serializeLayer = (layer) => {
  const rooms = {};
  const data = layer.data ?? [];
  for (let x = 0; x < data.length; x += 1) {
    const col = data[x] ?? [];
    for (let y = 0; y < col.length; y += 1) {
      const pruned = pruneRoom(col[y]);
      if (pruned) rooms[`${x},${y}`] = pruned;
    }
  }
  const { data: _data, ...rest } = layer;
  return { ...rest, rooms };
};

export const hydrateLayer = (layer, width, height) => {
  if (!layer.rooms) return layer; // old dense format — pass through, next save converts it
  const data = [];
  for (let x = 0; x < width; x += 1) {
    data[x] = [];
    for (let y = 0; y < height; y += 1) data[x][y] = {};
  }
  for (const [key, room] of Object.entries(layer.rooms)) {
    const [x, y] = key.split(',').map(Number);
    if (data[x]?.[y] !== undefined) data[x][y] = { ...room };
  }
  const { rooms: _rooms, ...rest } = layer;
  return { ...rest, data };
};

export const serializeMap = (map) => ({ ...map, layers: (map.layers ?? []).map(serializeLayer) });
export const hydrateMap = (map) => ({ ...map, layers: (map.layers ?? []).map((l) => hydrateLayer(l, map.width, map.height)) });
