import { createStore, get, set, del, entries, update } from 'idb-keyval';
import { serializeMap, hydrateMap } from './prune';

export { pruneRoom, serializeLayer, hydrateLayer } from './prune';

const mapsStore = createStore('tsz-maps', 'maps');
const settingsStore = createStore('tsz-settings', 'settings');

// ── Storage API ──────────────────────────────────────────────────────────────

export const getMaps = async () => {
  const all = await entries(mapsStore);
  return all.map(([id, map]) => hydrateMap({ ...map, id }));
};

export const getMap = async (id) => {
  const map = await get(id, mapsStore);
  return map ? hydrateMap({ ...map, id }) : undefined;
};

export const addMap = async (map) => {
  const { id: _id, ...data } = serializeMap(map);
  const newId = crypto.randomUUID();
  await set(newId, data, mapsStore);
  return newId;
};

export const setMap = async (id, map) => {
  const { id: _id, ...data } = serializeMap(map);
  await set(id, data, mapsStore);
};

export const updateMap = async (id, partial) => {
  await update(id, (existing) => ({ ...existing, ...partial }), mapsStore);
};

export const deleteMap = async (id) => {
  await del(id, mapsStore);
};

export const getSetting = async (key) => get(key, settingsStore);

export const setSetting = async (key, value) => set(key, value, settingsStore);

// ── Map factory helpers ──────────────────────────────────────────────────────

// Bump when the persisted map shape changes in a way that needs migrating.
// Stamped on every created/saved map so future loaders can branch on it.
// v2: layers stored sparsely (rooms keyed by "x,y", defaults pruned). Old v1
// dense maps still load via hydrateLayer's pass-through and convert on next save.
export const SCHEMA_VERSION = 2;

export const createBlankMap = (width = 25, height = 25) => {
  const data = [];
  for (let x = 0; x < width; x += 1) {
    data[x] = [];
    for (let y = 0; y < height; y += 1) {
      data[x][y] = {};
    }
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    name: 'Untitled Map',
    focusX: 0,
    focusY: 0,
    focusLayer: 0,
    defaultLayer: 0,
    width,
    height,
    cellSize: 40,
    darkMode: true,
    showGrid: true,
    created: Date.now(),
    edited: Date.now(),
    layers: [{ id: crypto.randomUUID(), name: 'Layer 1', data }],
  };
};

export const getOrCreateDefaultMap = async () => {
  const maps = await getMaps();
  if (maps.length > 0) {
    return maps.slice().sort((a, b) => (a.created ?? 0) - (b.created ?? 0))[0];
  }
  const newMap = createBlankMap();
  const id = await addMap(newMap);
  return { ...newMap, id };
};

// ── Grid size constants & helpers ────────────────────────────────────────────

// Bounded by 2D-canvas cost, not storage (sparse): map-2d-canvas draws one Konva
// node per grid cell every render, so this caps area (250×250 ≈ 62k nodes) to keep
// the tab responsive — auto-extend during nav could otherwise balloon it unbounded.
export const MAX_MAP_SIZE = 250;

export const appendCol = (data, width, height) => {
  const newCol = Array.from({ length: height }, () => ({}));
  return { data: [...data.map(col => [...col]), newCol], width: width + 1, height };
};

export const prependCol = (data, width, height) => {
  const newCol = Array.from({ length: height }, () => ({}));
  return { data: [newCol, ...data.map(col => [...col])], width: width + 1, height };
};

export const appendRow = (data, width, height) => {
  return { data: data.map(col => [...col, {}]), width, height: height + 1 };
};

export const prependRow = (data, width, height) => {
  return { data: data.map(col => [{}, ...col]), width, height: height + 1 };
};

export const deleteRightCol = (data, width, height) => {
  return { data: data.slice(0, width - 1).map(col => [...col]), width: width - 1, height };
};

export const deleteLeftCol = (data, width, height) => {
  return { data: data.slice(1).map(col => [...col]), width: width - 1, height };
};

export const deleteBottomRow = (data, width, height) => {
  return { data: data.map(col => col.slice(0, height - 1)), width, height: height - 1 };
};

export const deleteTopRow = (data, width, height) => {
  return { data: data.map(col => col.slice(1)), width, height: height - 1 };
};
