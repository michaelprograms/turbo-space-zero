// src/constants/room.js
// Single source of truth for room rendering defaults. Previously these values were
// duplicated across src/data, geometry.js, the 2D/3D canvases, and the PNG export.

export const ROOM_DEFAULTS = {
  roomSize: 25,
  borderWidth: 4,
  borderRadius: 50,
  borderColor: '#666666',
  fillColor: '#999999',
};

// Sentinel meaning "no custom exit color" (kept as-is per the Conservative
// data-model decision in the design doc).
export const EXIT_DEFAULT_COLOR = '#666666';

// Fill colors for the up/down vertical-exit arrow glyphs.
export const EXIT_ARROW_COLORS = {
  up: '#f0c040',
  down: '#40a0f0',
};
