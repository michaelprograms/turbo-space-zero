// src/components/map-view/index.jsx
import { useRef, useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useAppContext } from '../../context';
import MapCanvasTiling from '../map-canvas-tiling';
import MapControls from '../map-controls';
import { getMap, updateMap, MAX_MAP_SIZE } from '../../data';
import { getTheme } from '../../theme';
import { EXIT_DEFAULT_COLOR, ROOM_DEFAULTS } from '../../constants/room';
import { generateLayout, generatePath } from './generate';
import { APP_NAME } from '../../constants/app';

import { useMapLayers, enableRoom } from './hooks/useMapLayers';
import { useMapNavigation } from './hooks/useMapNavigation';
import { useMapIO } from './hooks/useMapIO';
import { useMapKeyboard } from './hooks/useMapKeyboard';
import { DIRECTIONS, KEY_DIRECTION, getRectCells, cloneMapGrid, getEffectiveKeys, moveSelectionAcrossLayers, transformSelection, elasticRemapExits, countEnabledRooms, countExitLinks, estimateMapKbSize } from './utils';

import { MapWrapper, QuillBadge, CanvasArea, HamburgerButton, DrawerBackdrop, SplitContainer, SplitPane } from './style.js';
import QuillDock from './QuillDock';

// Lazy-loaded: pulls three/drei out of the initial bundle; only fetched when 3D view is toggled on.
const Map3DCanvas = lazy(() => import('../map-3d-canvas'));

function MapView() {
  const { activeMapId } = useAppContext();

  const [result, setResult] = useState(undefined);
  useEffect(() => {
    if (!activeMapId) return;
    let cancelled = false;
    getMap(activeMapId).then(map => { if (!cancelled) setResult(map); });
    return () => { cancelled = true; };
  }, [activeMapId]);

  // Simple UI state that doesn't need hook extraction
  const [mapName, setMapName] = useState('');
  const [showGrid, setShowGrid] = useState(true);
  const [showChunks, setShowChunks] = useState(false);
  const [elasticNudge, setElasticNudge] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [cellSize, setCellSize] = useState(40);
  const [is3DView, setIs3DView] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tilingMode, setTilingMode] = useState('single');
  const stageRef = useRef(null);
  const scrollRef = useRef(null);
  const textInputRef = useRef(null);
  const didInitScrollRef = useRef(false);

  const layers = useMapLayers({ result, activeMapId });
  const {
    mapLayers, focusLayer, defaultLayer, mapWidth, mapHeight,
    setFocusLayer, handleLayerChange, handleDefaultLayerChange,
    commitMapLayers, updateActiveLayerData,
    handleUndo, handleRedo, canUndo, canRedo,
    handleLayerAdd, handleLayerDelete, handleLayerRename, handleLayerReorder,
    applyExtendMap, resetHistory,
  } = layers;

  const mapData = mapLayers[focusLayer]?.data ?? [];

  const nav = useMapNavigation({
    mapWidth, mapHeight, mapData, mapLayers, focusLayer,
    updateActiveLayerData, commitMapLayers, enableRoom,
  });
  const {
    mapFocusX, mapFocusY, setMapFocusX, setMapFocusY,
    selectedCells, setSelectedCells, selectionAnchor, setSelectionAnchor,
    isQuillMode, toggleQuillMode, handleNavigate, handleGridOnClick,
  } = nav;

  const theme = useMemo(() => getTheme(darkMode), [darkMode]);

  const roomCountActive = useMemo(
    () => countEnabledRooms(mapData),
    [mapData]
  );

  const roomCountTotal = useMemo(
    () => mapLayers.reduce((sum, layer) => sum + countEnabledRooms(layer.data ?? []), 0),
    [mapLayers]
  );

  const linkCountActive = useMemo(
    () => countExitLinks(mapData),
    [mapData]
  );

  const linkCountTotal = useMemo(
    () => mapLayers.reduce((sum, layer) => sum + countExitLinks(layer.data ?? []), 0),
    [mapLayers]
  );

  const mapKbSize = useMemo(
    () => estimateMapKbSize(mapLayers),
    [mapLayers]
  );

  const io = useMapIO({
    activeMapId, result, mapName, theme,
    mapState: { mapFocusX, mapFocusY, focusLayer, defaultLayer, mapWidth, mapHeight, mapLayers, cellSize, darkMode, showGrid, showChunks, elasticNudge },
    onSaveComplete: resetHistory,
  });
  const { saveMapData, exportAllLayers } = io;

  // Sync settings from DB result when map loads or changes
  useEffect(() => {
    if (!result) return;
    setMapName(result.name ?? '');
    setCellSize(result.cellSize ?? 40);
    setMapFocusX(result.focusX ?? 0);
    setMapFocusY(result.focusY ?? 0);
    setSelectionAnchor({ x: result.focusX ?? 0, y: result.focusY ?? 0 });
  }, [activeMapId, result, setMapFocusX, setSelectionAnchor]);

  useEffect(() => {
    if (result?.darkMode !== undefined) setDarkMode(result.darkMode);
    if (result?.showGrid !== undefined) setShowGrid(result.showGrid);
    if (result?.showChunks !== undefined) setShowChunks(result.showChunks);
    if (result?.elasticNudge !== undefined) setElasticNudge(result.elasticNudge);
  }, [result?.darkMode, result?.showGrid, result?.showChunks, result?.elasticNudge, activeMapId]);

  useEffect(() => {
    document.title = `${APP_NAME} — ${mapName}`;
  }, [mapName]);

  // Note: scrollRef is attached only to the single-layout canvas, so scroll-into-view
  // applies to the 'single' tiling mode. Tiled modes (column/row/grid) render multiple
  // canvases and intentionally do not auto-scroll.
  // Reset the "initial scroll done" flag whenever a different map loads.
  useEffect(() => { didInitScrollRef.current = false; }, [activeMapId]);

  // Auto-scroll canvas to keep focused cell visible. The first positioning after
  // a map load is instant ('auto'); subsequent navigation animates ('smooth').
  // This avoids an initial-load jump that animates while layout is still settling.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const margin = cellSize;
    const cellLeft = mapFocusX * cellSize;
    const cellTop = mapFocusY * cellSize;
    const { scrollLeft, scrollTop, clientWidth, clientHeight } = el;
    let newLeft = scrollLeft, newTop = scrollTop;
    if (cellLeft - margin < scrollLeft) newLeft = Math.max(0, cellLeft - margin);
    else if (cellLeft + cellSize + margin > scrollLeft + clientWidth) newLeft = cellLeft + cellSize + margin - clientWidth;
    if (cellTop - margin < scrollTop) newTop = Math.max(0, cellTop - margin);
    else if (cellTop + cellSize + margin > scrollTop + clientHeight) newTop = cellTop + cellSize + margin - clientHeight;
    const behavior = didInitScrollRef.current ? 'smooth' : 'auto';
    didInitScrollRef.current = true;
    if ((newLeft !== scrollLeft || newTop !== scrollTop) && typeof el.scrollTo === 'function') {
      el.scrollTo({ left: newLeft, top: newTop, behavior });
    }
  }, [mapFocusX, mapFocusY, cellSize]);

  // Coordination handlers: bridge layer + navigation state
  const handleExitToggle = useCallback((dir) => {
    const mapCopy = cloneMapGrid(mapData);
    mapCopy[mapFocusX] = [...mapCopy[mapFocusX]];
    const room = { ...mapCopy[mapFocusX][mapFocusY] };
    const exits = { ...(room.exits ?? {}) };
    if (exits[dir]) delete exits[dir]; else exits[dir] = true;
    room.exits = exits;
    mapCopy[mapFocusX][mapFocusY] = room;
    updateActiveLayerData(mapCopy);
  }, [mapData, mapFocusX, mapFocusY, updateActiveLayerData]);

  const handleExitColorChange = useCallback((dir, color) => {
    const effectiveKeys = getEffectiveKeys(selectedCells, mapFocusX, mapFocusY);
    const mapCopy = cloneMapGrid(mapData);
    for (const cellKey of effectiveKeys) {
      const [x, y] = cellKey.split(',').map(Number);
      mapCopy[x] = [...mapCopy[x]];
      const room = { ...mapCopy[x][y] };
      const exitColors = { ...(room.exitColors ?? {}) };
      if (color === EXIT_DEFAULT_COLOR) {
        delete exitColors[dir];
      } else {
        exitColors[dir] = color;
      }
      room.exitColors = exitColors;
      mapCopy[x][y] = room;
    }
    updateActiveLayerData(mapCopy);
  }, [mapData, mapFocusX, mapFocusY, selectedCells, updateActiveLayerData]);

  const handleControlRoomValue = useCallback((key, value) => {
    const effectiveKeys = getEffectiveKeys(selectedCells, mapFocusX, mapFocusY);
    const mapCopy = cloneMapGrid(mapData);
    if (key === 'text') {
      mapCopy[mapFocusX] = [...mapCopy[mapFocusX]];
      mapCopy[mapFocusX][mapFocusY] = { ...mapCopy[mapFocusX][mapFocusY], text: value };
    } else {
      for (const cellKey of effectiveKeys) {
        const [x, y] = cellKey.split(',').map(Number);
        mapCopy[x] = [...mapCopy[x]];
        mapCopy[x][y] = { ...mapCopy[x][y], [key]: value };
      }
    }
    updateActiveLayerData(mapCopy);
  }, [mapData, mapFocusX, mapFocusY, selectedCells, updateActiveLayerData]);

  const handleControlRoomToggle = useCallback((key) => {
    if (key !== 'enabled') return;
    let mapCopy = cloneMapGrid(mapData);
    const effectiveKeys = getEffectiveKeys(selectedCells, mapFocusX, mapFocusY);
    for (const cellKey of effectiveKeys) {
      const [x, y] = cellKey.split(',').map(Number);
      mapCopy = enableRoom(mapCopy, x, y);
    }
    updateActiveLayerData(mapCopy);
  }, [mapData, mapFocusX, mapFocusY, selectedCells, updateActiveLayerData]);

  // Overwrite the current selection with a freshly generated connected layout.
  const handleGenerate = useCallback((opts) => {
    const effectiveKeys = getEffectiveKeys(selectedCells, mapFocusX, mapFocusY);
    const layout = opts.pattern === 'path'
      ? generatePath(effectiveKeys, opts)
      : generateLayout(effectiveKeys, opts);
    const mapCopy = cloneMapGrid(mapData);
    for (const cellKey of effectiveKeys) {
      const [x, y] = cellKey.split(',').map(Number);
      mapCopy[x] = [...mapCopy[x]];
      const carved = layout.get(cellKey);
      mapCopy[x][y] = carved
        ? { ...ROOM_DEFAULTS, enabled: true, exits: carved.exits, exitColors: {} }
        : {}; // overwrite: cells the generator skipped are cleared
    }
    updateActiveLayerData(mapCopy);
  }, [mapData, mapFocusX, mapFocusY, selectedCells, updateActiveLayerData]);

  const handleNudge = useCallback((direction) => {
    const { dx, dy } = DIRECTIONS[direction];
    const effectiveKeys = getEffectiveKeys(selectedCells, mapFocusX, mapFocusY);
    const effectivePairs = effectiveKeys.map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });
    const selectedSet = new Set(effectiveKeys);
    for (const { x, y } of effectivePairs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) return;
      if (mapData[nx][ny]?.enabled && !selectedSet.has(`${nx},${ny}`)) return;
    }
    const mapCopy = cloneMapGrid(mapData);
    // Elastic nudge: re-point (or drop) exits linking the moved rooms to their
    // stationary neighbors so connections track the new geometry.
    const { moved, neighbors } = elasticNudge
      ? elasticRemapExits(mapData, effectivePairs, selectedSet, dx, dy)
      : { moved: new Map(), neighbors: new Map() };
    const snapshots = effectivePairs.map(({ x, y }) => {
      const data = { ...mapData[x][y] };
      const patch = moved.get(`${x},${y}`);
      if (patch) { data.exits = patch.exits; data.exitColors = patch.exitColors; }
      return { x, y, data };
    });
    for (const { x, y } of effectivePairs) mapCopy[x][y] = {};
    for (const { x, y, data } of snapshots) mapCopy[x + dx][y + dy] = data;
    for (const [key, patch] of neighbors) {
      const [nx, ny] = key.split(',').map(Number);
      mapCopy[nx][ny] = { ...mapCopy[nx][ny], exits: patch.exits, exitColors: patch.exitColors };
    }
    if (selectedCells.size > 0) {
      setSelectedCells(new Set([...selectedCells].map(key => {
        const [x, y] = key.split(',').map(Number);
        return `${x + dx},${y + dy}`;
      })));
    }
    setMapFocusX(mapFocusX + dx);
    setMapFocusY(mapFocusY + dy);
    updateActiveLayerData(mapCopy);
  }, [mapData, mapFocusX, mapFocusY, mapWidth, mapHeight, selectedCells, elasticNudge,
      setSelectedCells, setMapFocusX, setMapFocusY, updateActiveLayerData]);

  // Rotate (90° CW/CCW) or flip (H/V) the selection about its bounding box.
  // Aborts (no change) if the transform would push any cell off-map.
  const handleTransform = useCallback((op) => {
    const effectiveKeys = getEffectiveKeys(selectedCells, mapFocusX, mapFocusY);
    const result = transformSelection(mapData, effectiveKeys, op);
    if (!result) return;
    const mapCopy = cloneMapGrid(mapData);
    for (const { from } of result.moves) {
      const [x, y] = from.split(',').map(Number);
      mapCopy[x][y] = {};
    }
    for (const { to, data } of result.moves) {
      const [x, y] = to.split(',').map(Number);
      mapCopy[x][y] = data;
    }
    const focusMove = result.moves.find(m => m.from === `${mapFocusX},${mapFocusY}`);
    if (focusMove) {
      const [fx, fy] = focusMove.to.split(',').map(Number);
      setMapFocusX(fx); setMapFocusY(fy);
      setSelectionAnchor({ x: fx, y: fy });
    }
    if (selectedCells.size > 0) setSelectedCells(new Set(result.newKeys));
    updateActiveLayerData(mapCopy);
  }, [mapData, mapFocusX, mapFocusY, selectedCells, setMapFocusX, setMapFocusY,
      setSelectedCells, setSelectionAnchor, updateActiveLayerData]);

  // Move the selection to an adjacent layer (delta -1 down / +1 up) if the
  // target layer has no enabled rooms at those coords. Commits both layers in
  // one undoable step and follows the selection to the target layer.
  const handleLayerMove = useCallback((delta) => {
    const target = focusLayer + delta;
    if (target < 0 || target >= mapLayers.length) return;
    const effectiveKeys = getEffectiveKeys(selectedCells, mapFocusX, mapFocusY);
    const moved = moveSelectionAcrossLayers(mapData, mapLayers[target].data, effectiveKeys);
    if (!moved) return;
    commitMapLayers(mapLayers.map((layer, i) =>
      i === focusLayer ? { ...layer, data: moved.srcData }
      : i === target ? { ...layer, data: moved.dstData }
      : layer
    ));
    setFocusLayer(target);
  }, [focusLayer, mapLayers, mapData, mapFocusX, mapFocusY, selectedCells, commitMapLayers, setFocusLayer]);

  const handleExtendMap = useCallback((direction, mode) => {
    const { newWidth, newHeight, didPrependCol, didDeleteLeftCol, didDeleteRightCol,
            didPrependRow, didDeleteTopRow, didDeleteBottomRow } = applyExtendMap(direction, mode);
    let newFocusX = mapFocusX, newFocusY = mapFocusY;
    if (didPrependCol)     newFocusX += 1;
    if (didDeleteLeftCol)  newFocusX = Math.max(0, newFocusX - 1);
    if (didDeleteRightCol) newFocusX = Math.min(newFocusX, newWidth - 1);
    if (didPrependRow)     newFocusY += 1;
    if (didDeleteTopRow)   newFocusY = Math.max(0, newFocusY - 1);
    if (didDeleteBottomRow) newFocusY = Math.min(newFocusY, newHeight - 1);
    setMapFocusX(newFocusX);
    setMapFocusY(newFocusY);
  }, [applyExtendMap, mapFocusX, mapFocusY, setMapFocusX, setMapFocusY]);

  const handleCopy = useCallback(async () => {
    const effectiveKeys = getEffectiveKeys(selectedCells, mapFocusX, mapFocusY);
    const pairs = effectiveKeys.map(key => { const [x, y] = key.split(',').map(Number); return { x, y }; });
    const minX = Math.min(...pairs.map(p => p.x));
    const minY = Math.min(...pairs.map(p => p.y));
    const cells = pairs.map(({ x, y }) => ({
      relX: x - minX, relY: y - minY,
      data: mapData[x]?.[y] ? { ...mapData[x][y] } : {},
    }));
    await navigator.clipboard.writeText(JSON.stringify({ type: 'tsz-cells', cells }));
  }, [selectedCells, mapFocusX, mapFocusY, mapData]);

  const handleClear = useCallback(() => {
    const effectiveKeys = getEffectiveKeys(selectedCells, mapFocusX, mapFocusY);
    const mapCopy = cloneMapGrid(mapData);
    effectiveKeys.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      mapCopy[x][y] = {};
    });
    updateActiveLayerData(mapCopy);
  }, [selectedCells, mapFocusX, mapFocusY, mapData, updateActiveLayerData]);

  const handleCut = useCallback(async () => {
    await handleCopy();
    handleClear();
  }, [handleCopy, handleClear]);

  const handlePaste = useCallback(async () => {
    let parsed;
    try {
      const text = await navigator.clipboard.readText();
      parsed = JSON.parse(text);
    } catch { return; }
    if (!parsed || parsed.type !== 'tsz-cells' || !Array.isArray(parsed.cells)) return;
    const mapCopy = cloneMapGrid(mapData);
    parsed.cells.forEach(({ relX, relY, data }) => {
      const x = mapFocusX + relX, y = mapFocusY + relY;
      if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return;
      mapCopy[x][y] = { ...data };
    });
    updateActiveLayerData(mapCopy);
  }, [mapData, mapFocusX, mapFocusY, mapWidth, mapHeight, updateActiveLayerData]);

  // Toggle handlers — immediately persist to DB
  const handleToggleDarkMode = useCallback(async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    await updateMap(activeMapId, { darkMode: newValue });
  }, [darkMode, activeMapId]);

  const handleToggleGridVisibility = useCallback(async () => {
    const newValue = !showGrid;
    setShowGrid(newValue);
    await updateMap(activeMapId, { showGrid: newValue });
  }, [showGrid, activeMapId]);

  const handleToggleChunks = useCallback(async () => {
    const newValue = !showChunks;
    setShowChunks(newValue);
    await updateMap(activeMapId, { showChunks: newValue });
  }, [showChunks, activeMapId]);

  const handleMapNameCommit = useCallback(async (name) => {
    setMapName(name);
    await updateMap(activeMapId, { name, edited: Date.now() });
  }, [activeMapId]);

  const handleKeyDown = useCallback((event) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    if (event.key === 'Escape') { setSelectedCells(new Set()); return; }
    if (event.key === 'q') { toggleQuillMode(); return; }
    if (event.key === 't') { event.preventDefault(); textInputRef.current?.focus(); return; }
    if (event.key === 'Enter') { event.preventDefault(); textInputRef.current?.focus(); return; }
    if (event.key === 'c') { event.preventDefault(); void handleCopy(); return; }
    if (event.key === 's') { event.preventDefault(); void saveMapData(); return; }
    if (event.key === 'p') { event.preventDefault(); void exportAllLayers(); return; }

    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
      event.preventDefault(); handleUndo(); return;
    }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') {
      event.preventDefault(); handleRedo(); return;
    }

    if (event.key === 'z') { event.preventDefault(); handleClear(); return; }
    if (event.key === 'x') { event.preventDefault(); void handleCut(); return; }
    if (event.key === 'v') { event.preventDefault(); void handlePaste(); return; }
    if (event.key === 'r') { event.preventDefault(); handleTransform('rotateCW'); return; }
    if (event.key === 'R') { event.preventDefault(); handleTransform('rotateCCW'); return; }
    if (event.key === 'f') { event.preventDefault(); handleTransform('flipH'); return; }
    if (event.key === 'F') { event.preventDefault(); handleTransform('flipV'); return; }
    if (event.key === ' ') {
      event.preventDefault();
      updateActiveLayerData(enableRoom(mapData, mapFocusX, mapFocusY));
      return;
    }
    if (event.key === '{') { event.preventDefault(); handleLayerMove(-1); return; }
    if (event.key === '}') { event.preventDefault(); handleLayerMove(1); return; }
    if (event.key === '[') { event.preventDefault(); setFocusLayer(prev => prev === 0 ? mapLayers.length - 1 : prev - 1); return; }
    if (event.key === ']') { event.preventDefault(); setFocusLayer(prev => prev === mapLayers.length - 1 ? 0 : prev + 1); return; }
    if (event.key === 'u' || event.key === '+') { event.preventDefault(); handleExitToggle('up'); return; }
    if (event.key === 'd' || event.key === '-') { event.preventDefault(); handleExitToggle('down'); return; }

    const direction = KEY_DIRECTION[event.key];
    if (direction) {
      event.preventDefault();
      const { dx, dy } = DIRECTIONS[direction];
      const newX = mapFocusX + dx;
      const newY = mapFocusY + dy;
      if (event.shiftKey) {
        if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
          setMapFocusX(newX);
          setMapFocusY(newY);
          setSelectedCells(prev => new Set([...prev, ...getRectCells(selectionAnchor.x, selectionAnchor.y, newX, newY)]));
        }
      } else if (event.ctrlKey || event.altKey) {
        if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
          setSelectedCells(prev => new Set([...prev, `${newX},${newY}`]));
          setMapFocusX(newX); setMapFocusY(newY);
        }
      } else {
        setSelectedCells(new Set());
        if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
          setSelectionAnchor({ x: newX, y: newY });
        }
        handleNavigate(direction);
      }
    }
  }, [handleNavigate, handleExitToggle, handleCopy, handleClear, handleCut, handlePaste,
      handleTransform, handleUndo, handleRedo, mapData, mapFocusX, mapFocusY, mapLayers, toggleQuillMode,
      updateActiveLayerData, selectedCells, mapWidth, mapHeight, selectionAnchor,
      saveMapData, exportAllLayers, setFocusLayer, setMapFocusX, setMapFocusY,
      setSelectedCells, setSelectionAnchor, handleLayerMove]);

  useMapKeyboard(handleKeyDown);

  return (
    <>
      {/* Wait for layers too, not just result: useMapLayers copies result→mapLayers in an
          effect, so there's a render where the canvas exists but mapLayers is still []. */}
      {result && mapLayers.length > 0 ? (
        <MapWrapper $theme={theme}>
          <MapControls
            mapData={mapData}
            focusX={mapFocusX}
            focusY={mapFocusY}
            handleControlRoomValue={handleControlRoomValue}
            handleControlRoomToggle={handleControlRoomToggle}
            showGrid={showGrid}
            onToggleGrid={handleToggleGridVisibility}
            showChunks={showChunks}
            onToggleChunks={handleToggleChunks}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            is3DView={is3DView}
            onToggle3DView={() => setIs3DView(v => !v)}
            splitView={splitView}
            onToggleSplitView={() => setSplitView(v => !v)}
            cellSize={cellSize}
            onCellSizeChange={setCellSize}
            mapName={mapName}
            onMapNameCommit={handleMapNameCommit}
            mapCreated={result.created}
            mapEdited={result.edited}
            roomCountActive={roomCountActive}
            roomCountTotal={roomCountTotal}
            linkCountActive={linkCountActive}
            linkCountTotal={linkCountTotal}
            mapKbSize={mapKbSize}
            onSave={saveMapData}
            onExport={exportAllLayers}
            theme={theme}
            isQuillMode={isQuillMode}
            onNavigate={handleNavigate}
            sidebarOpen={isSidebarOpen}
            textInputRef={textInputRef}
            selectedCells={selectedCells}
            onNudge={handleNudge}
            elasticNudge={elasticNudge}
            onToggleElasticNudge={() => setElasticNudge(v => !v)}
            onTransform={handleTransform}
            onLayerMove={handleLayerMove}
            onGenerate={handleGenerate}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            maxMapSize={MAX_MAP_SIZE}
            onExtendMap={handleExtendMap}
            onExitToggle={handleExitToggle}
            onExitColorChange={handleExitColorChange}
            onCopy={handleCopy}
            onClear={handleClear}
            onCut={handleCut}
            onPaste={handlePaste}
            layers={mapLayers}
            focusLayer={focusLayer}
            defaultLayer={defaultLayer}
            onLayerChange={handleLayerChange}
            onLayerAdd={handleLayerAdd}
            onLayerDelete={handleLayerDelete}
            onLayerRename={handleLayerRename}
            onLayerReorder={handleLayerReorder}
            onDefaultLayerChange={handleDefaultLayerChange}
            tilingMode={tilingMode}
            onTilingModeChange={setTilingMode}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
          <CanvasArea>
            <HamburgerButton $theme={theme} type="button" aria-label="Open menu" onClick={() => setIsSidebarOpen(true)}>
              ☰
            </HamburgerButton>
            {isQuillMode && <QuillBadge>✦ QUILL</QuillBadge>}
            {isSidebarOpen && (
              <DrawerBackdrop data-testid="drawer-backdrop" onClick={() => setIsSidebarOpen(false)} />
            )}
            {(() => {
              const canvas2D = (
                <MapCanvasTiling
                  tilingMode={tilingMode}
                  layers={mapLayers}
                  focusLayer={focusLayer}
                  focusX={mapFocusX}
                  focusY={mapFocusY}
                  onCellClick={handleGridOnClick}
                  onLayerChange={handleLayerChange}
                  stageRef={stageRef}
                  scrollRef={scrollRef}
                  cellSize={cellSize}
                  showGrid={showGrid}
                  showChunks={showChunks}
                  theme={theme}
                  selectedCells={selectedCells}
                />
              );
              const canvas3D = (
                <Suspense fallback={<h3>Loading 3D…</h3>}>
                  <Map3DCanvas
                    mapLayers={mapLayers}
                    cellSize={cellSize} mapWidth={mapWidth} mapHeight={mapHeight} theme={theme}
                  />
                </Suspense>
              );
              // Split shows both (edit in 2D, watch 3D update live); otherwise one.
              if (splitView) {
                return (
                  <SplitContainer>
                    <SplitPane $theme={theme}>{canvas2D}</SplitPane>
                    <SplitPane $theme={theme}>{canvas3D}</SplitPane>
                  </SplitContainer>
                );
              }
              return is3DView ? canvas3D : canvas2D;
            })()}
            <QuillDock
              isQuillMode={isQuillMode} onNavigate={handleNavigate}
              onToggleQuillMode={toggleQuillMode} theme={theme}
            />
          </CanvasArea>
        </MapWrapper>
      ) : (
        <h3>Loading...</h3>
      )}
    </>
  );
}

export default MapView;
