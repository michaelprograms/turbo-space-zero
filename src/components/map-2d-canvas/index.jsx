// src/components/map-2d-canvas/index.jsx
import { useRef, useState, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Line, Group, Text } from 'react-konva';

// On-screen canvases render at 1x instead of retina 2x: halves canvas pixels
// (big repaint win on large maps), slightly softer. Export overrides this by
// passing pixelRatio:2 to toDataURL, so exported PNGs stay sharp.
Konva.pixelRatio = 1;
import { getRoomRectSize, getRoomOffset, getExitLineReach, resolveExitColor, getUpArrowPoints, getDownArrowPoints, pointerToCell } from './geometry.js';
import { CanvasScrollArea, CanvasSpacer, StagePin } from './style.js';
import { EXIT_DIRECTIONS } from '../map-view/utils';
import { ROOM_DEFAULTS, EXIT_ARROW_COLORS } from '../../constants/room';

// Extra ring of cells rendered beyond the viewport so exit stubs poking into
// neighbors (and ghosts) don't pop in/out at the scroll edge.
const OVERSCAN = 2;

// ponytail: chunk size hardcoded; make it a per-map setting if non-10 grids ever happen
const CHUNK = 10;

// tint=null → use per-exit color; tint=string → override all exit lines with that color (ghost mode)
const renderExitLines = (room, roomSize, cellSize, center, tint) => {
  const reach = getExitLineReach(roomSize, cellSize);
  return EXIT_DIRECTIONS.flatMap((dir) => {
    if (!room?.exits?.[dir.key]) return [];
    return (
      <Line
        key={dir.key}
        points={[center, center, center + dir.dx * reach, center + dir.dy * reach]}
        stroke={tint ?? resolveExitColor(room, dir.key)}
        strokeWidth={4}
        lineCap="round"
        listening={false}
      />
    );
  });
};

function Map2DCanvas(props) {
  const {
    layers = [],
    focusLayer = 0,
    focusX = 0,
    focusY = 0,
    onCellClick,
    stageRef,
    scrollRef,
    cellSize = 40,
    showGrid = true,
    showChunks = false,
    theme = {},
    selectedCells = new Set(),
    layerIndex,
    disableGhosts = false,
  } = { ...props };

  const effectiveLayerIndex = layerIndex ?? focusLayer;
  const mapData = layers[effectiveLayerIndex]?.data ?? [];
  const ghostBelow = (!disableGhosts && effectiveLayerIndex > 0)
    ? (layers[effectiveLayerIndex - 1]?.data ?? null)
    : null;
  const ghostAbove = (!disableGhosts && effectiveLayerIndex < layers.length - 1)
    ? (layers[effectiveLayerIndex + 1]?.data ?? null)
    : null;

  const width = mapData.length;
  const height = mapData?.[0]?.length || 0;
  const stageWidth = width * cellSize;
  const stageHeight = height * cellSize;
  const ghostOffset = Math.round(cellSize * 0.4);

  // ── Viewport virtualization ────────────────────────────────────────────────
  // The scroll container owns the full-map-sized spacer (native scrollbars); the
  // Konva stage is only viewport-sized and follows scroll via a Layer offset, so
  // the canvas never exceeds ~viewport pixels regardless of map size.
  const containerRef = useRef(null);
  const setScrollEl = useCallback((el) => {
    containerRef.current = el;
    if (typeof scrollRef === 'function') scrollRef(el);
    else if (scrollRef) scrollRef.current = el;
  }, [scrollRef]);

  const [scroll, setScroll] = useState({ left: 0, top: 0 });
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setViewport({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleScroll = (e) => {
    setScroll({ left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop });
  };

  // Right-click drag to pan: adjust the native scroll offset while dragging.
  const panRef = useRef(null);
  const handleMouseDown = (e) => {
    if (e.button !== 2) return; // right button only
    const el = containerRef.current;
    if (!el) return;
    panRef.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    const move = (ev) => {
      el.scrollLeft = panRef.current.left - (ev.clientX - panRef.current.x);
      el.scrollTop = panRef.current.top - (ev.clientY - panRef.current.y);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const vpW = Math.max(viewport.w, cellSize * 5);
  const vpH = Math.max(viewport.h, cellSize * 5);

  // Breathing room around the map so it isn't flush against the scroll edges.
  const GUTTER = cellSize;
  // Map-space coordinate at the viewport's top-left (map origin sits at GUTTER).
  const viewLeft = scroll.left - GUTTER;
  const viewTop = scroll.top - GUTTER;

  // Visible cell range (clamped to the grid), padded by OVERSCAN.
  const x0 = Math.max(0, Math.floor(viewLeft / cellSize) - OVERSCAN);
  const x1 = Math.min(width - 1, Math.floor((viewLeft + vpW) / cellSize) + OVERSCAN);
  const y0 = Math.max(0, Math.floor(viewTop / cellSize) - OVERSCAN);
  const y1 = Math.min(height - 1, Math.floor((viewTop + vpH) / cellSize) + OVERSCAN);

  // ── Renderers (all draw in absolute map coords; Layer offset maps to viewport) ─
  const gridStroke = theme?.gridStroke || '#E1E8ED';
  const chunkStroke = theme?.chunkStroke || '#9aa5b1';
  const chunkLabel = theme?.chunkLabel || '#7a8591';
  // Draws normal grid lines when showGrid, and recolored chunk-boundary lines
  // when showChunks — either toggle alone is enough to render.
  const renderGridLines = () => {
    if ((!showGrid && !showChunks) || width === 0 || height === 0) return null;
    const top = y0 * cellSize;
    const bottom = (y1 + 1) * cellSize;
    const left = x0 * cellSize;
    const right = (x1 + 1) * cellSize;
    const lines = [];
    for (let x = x0; x <= x1 + 1; x += 1) {
      const isChunk = showChunks && x % CHUNK === 0;
      if (!showGrid && !isChunk) continue;
      lines.push(
        <Line key={`gx-${x}`} points={[x * cellSize, top, x * cellSize, bottom]}
          stroke={isChunk ? chunkStroke : gridStroke} strokeWidth={isChunk && showGrid ? 3 : 1} listening={false} />
      );
    }
    for (let y = y0; y <= y1 + 1; y += 1) {
      const isChunk = showChunks && y % CHUNK === 0;
      if (!showGrid && !isChunk) continue;
      lines.push(
        <Line key={`gy-${y}`} points={[left, y * cellSize, right, y * cellSize]}
          stroke={isChunk ? chunkStroke : gridStroke} strokeWidth={isChunk && showGrid ? 3 : 1} listening={false} />
      );
    }
    return lines;
  };

  // Coordinate label at each visible chunk's top-left cell — auto-derived, so it
  // can't drift across layers the way manual room labels do.
  const renderChunkLabels = () => {
    if (!showChunks || width === 0 || height === 0) return null;
    const labels = [];
    const bx0 = Math.floor(x0 / CHUNK) * CHUNK;
    const by0 = Math.floor(y0 / CHUNK) * CHUNK;
    for (let x = bx0; x <= x1; x += CHUNK) {
      for (let y = by0; y <= y1; y += CHUNK) {
        labels.push(
          <Text key={`cl-${x}-${y}`} x={x * cellSize + 2} y={y * cellSize + 2}
            text={`${x},${y}`} fontSize={Math.max(8, Math.floor(cellSize * 0.22))}
            fill={chunkLabel} listening={false} />
        );
      }
    }
    return labels;
  };

  // Highlights only for the few focus/selected cells within view.
  const renderHighlights = () => {
    const cells = new Set(selectedCells);
    cells.add(`${focusX},${focusY}`);
    return [...cells].map((key) => {
      const [x, y] = key.split(',').map(Number);
      if (x < 0 || y < 0 || x >= width || y >= height) return null;
      const isFocus = x === focusX && y === focusY;
      return (
        <Rect key={`hl-${key}`} x={x * cellSize} y={y * cellSize}
          width={cellSize} height={cellSize} listening={false}
          fill={isFocus ? (theme?.focusHighlight || '#D4E8F5') : (theme?.selectionHighlight || '#B8D8F0')} />
      );
    });
  };

  const renderRoom = (room, x, y) => {
    if (!room?.enabled && !room?.exits && !room?.text) return null;

    const xPos = x * cellSize;
    const yPos = y * cellSize;
    const center = cellSize / 2;
    const fillColor = room?.fillColor ?? ROOM_DEFAULTS.fillColor;
    const borderColor = room?.borderColor ?? ROOM_DEFAULTS.borderColor;
    const borderWidth = room?.borderWidth ?? ROOM_DEFAULTS.borderWidth;
    const borderRadius = room?.borderRadius ?? ROOM_DEFAULTS.borderRadius;
    const roomSize = room?.roomSize ?? ROOM_DEFAULTS.roomSize;
    const konvaRectSize = getRoomRectSize(roomSize, borderWidth);
    const roomOffset = getRoomOffset(cellSize, roomSize, borderWidth);

    return (
      <Group key={`${x}-${y}`} x={xPos} y={yPos} listening={false}>
        {renderExitLines(room, roomSize, cellSize, center, null)}

        {room?.enabled ? (
          <Rect
            x={roomOffset} y={roomOffset}
            width={konvaRectSize} height={konvaRectSize}
            fill={fillColor} stroke={borderColor}
            strokeWidth={borderWidth} cornerRadius={borderRadius}
          />
        ) : null}

        {room?.exits?.up ? (
          <Line
            key={`${x}-${y}-up`}
            points={getUpArrowPoints(roomSize, cellSize, center)}
            closed={true} fill={EXIT_ARROW_COLORS.up} stroke={EXIT_ARROW_COLORS.up} strokeWidth={0} listening={false}
          />
        ) : null}

        {room?.exits?.down ? (
          <Line
            key={`${x}-${y}-down`}
            points={getDownArrowPoints(roomSize, cellSize, center)}
            closed={true} fill={EXIT_ARROW_COLORS.down} stroke={EXIT_ARROW_COLORS.down} strokeWidth={0} listening={false}
          />
        ) : null}

        {room?.text ? (
          <Text
            x={0} y={0} width={cellSize} height={cellSize}
            text={room.text} align="center" verticalAlign="middle"
            fontSize={Math.max(8, Math.floor(cellSize * 0.25))}
            fill={theme?.labelText || '#222222'}
            ellipsis={true} wrap="none" listening={false}
          />
        ) : null}
      </Group>
    );
  };

  // Full-cell background tint (land/water etc.) for cells that carry `bg`.
  const renderTerrain = () => {
    const nodes = [];
    for (let x = x0; x <= x1; x += 1) {
      const col = mapData[x];
      if (!col) continue;
      for (let y = y0; y <= y1; y += 1) {
        const bg = col[y]?.bg;
        if (!bg) continue;
        nodes.push(
          <Rect key={`bg-${x}-${y}`} x={x * cellSize} y={y * cellSize}
            width={cellSize} height={cellSize} fill={bg} listening={false} />
        );
      }
    }
    return nodes;
  };

  // Rooms within the visible range only.
  const renderRooms = () => {
    const nodes = [];
    for (let x = x0; x <= x1; x += 1) {
      const col = mapData[x];
      if (!col) continue;
      for (let y = y0; y <= y1; y += 1) {
        const node = renderRoom(col[y], x, y);
        if (node) nodes.push(node);
      }
    }
    return nodes;
  };

  const renderGhostLayer = (data, tint) => {
    if (!data || data.length === 0) return null;
    const nodes = [];
    for (let x = x0; x <= x1; x += 1) {
      const col = data[x];
      if (!col) continue;
      for (let y = y0; y <= y1; y += 1) {
        const room = col[y];
        // Skip empty cells ({} in a dense grid) — else 10k+ empty Groups per ghost.
        if (!room?.enabled && !room?.exits) continue;
        const xPos = x * cellSize;
        const yPos = y * cellSize;
        const center = cellSize / 2;
        const roomSize = room?.roomSize ?? ROOM_DEFAULTS.roomSize;
        const borderWidth = room?.borderWidth ?? ROOM_DEFAULTS.borderWidth;
        const konvaRectSize = getRoomRectSize(roomSize, borderWidth);
        const roomOffset = getRoomOffset(cellSize, roomSize, borderWidth);
        nodes.push(
          <Group key={`g-${x}-${y}`} x={xPos} y={yPos} listening={false}>
            {renderExitLines(room, roomSize, cellSize, center, tint)}
            {room.enabled && (
              <Rect
                x={roomOffset} y={roomOffset}
                width={konvaRectSize} height={konvaRectSize}
                fill={tint} stroke={tint}
                strokeWidth={borderWidth} cornerRadius={room?.borderRadius ?? ROOM_DEFAULTS.borderRadius}
                listening={false}
              />
            )}
          </Group>
        );
      }
    }
    return nodes;
  };

  // Single click target covering the viewport; pointer→cell adds the scroll offset.
  const handleStageClick = (e) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    const cell = pointerToCell(pos.x + viewLeft, pos.y + viewTop, cellSize, width, height);
    if (!cell) return;
    onCellClick?.(cell.x, cell.y, { shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey, altKey: e.evt.altKey });
  };

  return (
    <CanvasScrollArea
      ref={setScrollEl}
      onScroll={handleScroll}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      $background={theme?.canvasOutOfBounds}
    >
      <CanvasSpacer
        $w={Math.max(stageWidth, cellSize * 5) + GUTTER * 2}
        $h={Math.max(stageHeight, cellSize * 5) + GUTTER * 2}
      >
        <StagePin>
          <Stage ref={stageRef} width={vpW} height={vpH}>
            {/* offset maps absolute map coords into the viewport, inset by GUTTER */}
            <Layer x={GUTTER - scroll.left} y={GUTTER - scroll.top}>
              <Rect
                x={0} y={0}
                width={Math.max(stageWidth, cellSize * 5)}
                height={Math.max(stageHeight, cellSize * 5)}
                fill={theme?.canvasBackground || '#ffffff'}
                listening={false}
              />

              {/* Terrain/planned-area tint sits at the very back, under grid + rooms */}
              {renderTerrain()}

              {ghostBelow && (
                <Group x={-ghostOffset} y={ghostOffset} opacity={0.25} listening={false}>
                  {renderGhostLayer(ghostBelow, '#3060c0')}
                </Group>
              )}

              {ghostAbove && (
                <Group x={ghostOffset} y={-ghostOffset} opacity={0.25} listening={false}>
                  {renderGhostLayer(ghostAbove, '#30a060')}
                </Group>
              )}

              {/* highlights + grid beneath rooms */}
              {renderHighlights()}
              {renderGridLines()}

              {/* Border framing the map area */}
              {width > 0 && height > 0 && (
                <Rect
                  x={0} y={0}
                  width={stageWidth} height={stageHeight}
                  stroke={theme?.canvasBorder || '#9aa5b1'}
                  strokeWidth={2}
                  listening={false}
                />
              )}

              {renderRooms()}

              {/* Chunk coordinate labels sit above rooms so corner rooms can't hide them */}
              {renderChunkLabels()}

              {/* Click target on top; covers the visible viewport (incl. gutter) */}
              <Rect
                x={viewLeft} y={viewTop}
                width={vpW} height={vpH}
                fill="transparent"
                onClick={handleStageClick}
              />
            </Layer>
          </Stage>
        </StagePin>
      </CanvasSpacer>
    </CanvasScrollArea>
  );
}

export default Map2DCanvas;
