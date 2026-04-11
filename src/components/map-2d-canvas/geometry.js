import { EXIT_DEFAULT_COLOR } from '../../constants/room';

/**
 * The Konva Rect width/height needed so the outer visual size equals roomSize.
 * Konva strokes are centered (half inside, half outside), so:
 *   outer visual = konvaRectSize + borderWidth
 *   => konvaRectSize = roomSize - borderWidth
 */
export const getRoomRectSize = (roomSize, borderWidth) => roomSize - borderWidth;

/**
 * Pixel offset (Konva group-local x/y) to center the room rect within the cell.
 * Internally derives konvaRectSize from roomSize and borderWidth.
 * Note: returns a negative value when the room visual size exceeds cellSize —
 * this causes the rect to render outside the group bounds.
 */
export const getRoomOffset = (cellSize, roomSize, borderWidth) => {
  const konvaRectSize = getRoomRectSize(roomSize, borderWidth);
  return (cellSize - konvaRectSize) / 2;
};

/**
 * Distance from cell center to exit line endpoint.
 * The visible stub = cellSize * 0.175, so at default (cellSize=40) stub = 7px.
 * We add roomSize/2 so the stub begins at the room's outer visual edge.
 */
export const getExitLineReach = (roomSize, cellSize) =>
  roomSize / 2 + cellSize * 0.175;

export const resolveExitColor = (room, dir) =>
  room?.exitColors?.[dir] ?? EXIT_DEFAULT_COLOR;

/**
 * Convert a Konva pointer position to a grid cell, or null if out of bounds.
 * Used by the single full-stage click target that replaced per-cell onClick.
 */
export const pointerToCell = (px, py, cellSize, width, height) => {
  const x = Math.floor(px / cellSize);
  const y = Math.floor(py / cellSize);
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  return { x, y };
};

/**
 * Largest border width allowed for a room.
 * Primary cap is the spec [(cellSize − roomSize) / 2]; floored at 1, and also
 * capped at roomSize − 2 so the Konva rect (roomSize − borderWidth) can't
 * collapse to zero/negative — which the bare spec allows (e.g. cellSize 40,
 * roomSize 12 → 14, larger than the room itself).
 */
export const getMaxBorderWidth = (cellSize, roomSize) =>
  Math.max(1, Math.min(Math.floor((cellSize - roomSize) / 2), roomSize - 2));

// Up triangle: apex at top-center, base across the vertical midpoint of the room circle
export const getUpArrowPoints = (roomSize, cellSize, localCenterX) => {
  const half = roomSize / 2;
  const apexY = (cellSize - roomSize) / 2 + 2;
  const baseY = cellSize / 2;
  const baseHalfW = half * 0.55;
  return [
    localCenterX, apexY,
    localCenterX - baseHalfW, baseY,
    localCenterX + baseHalfW, baseY,
  ];
};

// Down triangle: apex at bottom-center, base across the vertical midpoint
export const getDownArrowPoints = (roomSize, cellSize, localCenterX) => {
  const half = roomSize / 2;
  const apexY = (cellSize + roomSize) / 2 - 2;
  const baseY = cellSize / 2;
  const baseHalfW = half * 0.55;
  return [
    localCenterX, apexY,
    localCenterX - baseHalfW, baseY,
    localCenterX + baseHalfW, baseY,
  ];
};
