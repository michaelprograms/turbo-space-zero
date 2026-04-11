import { useState, useRef, useCallback, useEffect } from 'react';
import {
  appendCol, prependCol, appendRow, prependRow,
  deleteRightCol, deleteLeftCol, deleteBottomRow, deleteTopRow,
} from '../../../data';
import { ROOM_DEFAULTS } from '../../../constants/room';

const EXTEND_OPS = {
  north:     { add: [prependRow],             remove: [deleteTopRow]                    },
  south:     { add: [appendRow],              remove: [deleteBottomRow]                 },
  east:      { add: [appendCol],              remove: [deleteRightCol]                  },
  west:      { add: [prependCol],             remove: [deleteLeftCol]                   },
  northeast: { add: [prependRow, appendCol],  remove: [deleteTopRow, deleteRightCol]    },
  northwest: { add: [prependRow, prependCol], remove: [deleteTopRow, deleteLeftCol]     },
  southeast: { add: [appendRow, appendCol],   remove: [deleteBottomRow, deleteRightCol] },
  southwest: { add: [appendRow, prependCol],  remove: [deleteBottomRow, deleteLeftCol]  },
};

export const enableRoom = (mapCopy, x, y) => {
  const room = { ...mapCopy[x][y] };
  room.enabled = !room.enabled;
  if (room.borderRadius === undefined) room.borderRadius = ROOM_DEFAULTS.borderRadius;
  if (room.borderWidth === undefined) room.borderWidth = ROOM_DEFAULTS.borderWidth;
  if (room.roomSize === undefined) room.roomSize = ROOM_DEFAULTS.roomSize;
  if (room.borderColor === undefined) room.borderColor = ROOM_DEFAULTS.borderColor;
  if (room.fillColor === undefined) room.fillColor = ROOM_DEFAULTS.fillColor;
  if (!room.exits) room.exits = {};
  if (!room.exitColors) room.exitColors = {};
  const col = mapCopy[x].map((cell, i) => i === y ? room : cell);
  return mapCopy.map((c, i) => i === x ? col : c);
};

export function useMapLayers({ result, activeMapId }) {
  const [mapLayers, setMapLayers] = useState([]);
  const [focusLayer, setFocusLayer] = useState(0);
  const [defaultLayer, setDefaultLayer] = useState(0);
  const [mapWidth, setMapWidth] = useState(0);
  const [mapHeight, setMapHeight] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  useEffect(() => {
    if (!result) return;
    setMapLayers(result.layers ?? []);
    setFocusLayer(result.defaultLayer ?? result.focusLayer ?? 0);
    setDefaultLayer(result.defaultLayer ?? 0);
    setMapWidth(result.width);
    setMapHeight(result.height);
  }, [activeMapId, result]);

  useEffect(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, [activeMapId]);

  const resetHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const commitMapLayers = useCallback((newLayers, newWidth = mapWidth, newHeight = mapHeight) => {
    undoStackRef.current = [...undoStackRef.current.slice(-29), {
      layers: mapLayers,
      width: mapWidth,
      height: mapHeight,
    }];
    redoStackRef.current = [];
    setMapLayers(newLayers);
    if (newWidth !== mapWidth) setMapWidth(newWidth);
    if (newHeight !== mapHeight) setMapHeight(newHeight);
    setCanUndo(true);
    setCanRedo(false);
  }, [mapLayers, mapWidth, mapHeight]);

  const updateActiveLayerData = useCallback((newData) => {
    commitMapLayers(
      mapLayers.map((layer, i) => i === focusLayer ? { ...layer, data: newData } : layer)
    );
  }, [focusLayer, mapLayers, commitMapLayers]);

  const handleUndo = useCallback(() => {
    const stack = undoStackRef.current;
    if (!stack.length) return;
    const snapshot = stack[stack.length - 1];
    undoStackRef.current = stack.slice(0, -1);
    redoStackRef.current = [{
      layers: mapLayers,
      width: mapWidth,
      height: mapHeight,
    }, ...redoStackRef.current];
    setMapLayers(snapshot.layers);
    setMapWidth(snapshot.width);
    setMapHeight(snapshot.height);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
  }, [mapLayers, mapWidth, mapHeight]);

  const handleRedo = useCallback(() => {
    const stack = redoStackRef.current;
    if (!stack.length) return;
    const snapshot = stack[0];
    redoStackRef.current = stack.slice(1);
    undoStackRef.current = [...undoStackRef.current, {
      layers: mapLayers,
      width: mapWidth,
      height: mapHeight,
    }];
    setMapLayers(snapshot.layers);
    setMapWidth(snapshot.width);
    setMapHeight(snapshot.height);
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
  }, [mapLayers, mapWidth, mapHeight]);

  const handleLayerChange = useCallback((index) => {
    setFocusLayer(Math.max(0, Math.min(mapLayers.length - 1, index)));
  }, [mapLayers.length]);

  const handleDefaultLayerChange = useCallback((index) => {
    setDefaultLayer(Math.max(0, Math.min(mapLayers.length - 1, index)));
  }, [mapLayers.length]);

  const handleLayerAdd = useCallback(() => {
    const newIndex = mapLayers.length;
    const blankData = Array.from({ length: mapWidth }, () =>
      Array.from({ length: mapHeight }, () => ({}))
    );
    commitMapLayers([...mapLayers, { id: crypto.randomUUID(), name: `Layer ${newIndex + 1}`, data: blankData }]);
    setFocusLayer(newIndex);
  }, [mapLayers, mapWidth, mapHeight, commitMapLayers]);

  const handleLayerDelete = useCallback((index) => {
    if (mapLayers.length <= 1) return;
    commitMapLayers(mapLayers.filter((_, i) => i !== index));
    setFocusLayer(prev => {
      if (index < prev) return prev - 1;
      return Math.min(prev, mapLayers.length - 2);
    });
    setDefaultLayer(prev => {
      if (index < prev) return prev - 1;
      return Math.min(prev, mapLayers.length - 2);
    });
  }, [mapLayers, commitMapLayers]);

  const handleLayerRename = useCallback((index, name) => {
    commitMapLayers(mapLayers.map((layer, i) =>
      i === index ? { ...layer, name } : layer
    ));
  }, [mapLayers, commitMapLayers]);

  const handleLayerReorder = useCallback((fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= mapLayers.length) return;
    const next = [...mapLayers];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    commitMapLayers(next);
    setFocusLayer(toIndex);
  }, [mapLayers, commitMapLayers]);

  // Returns metadata so MapView can adjust focus coordinates after extend/shrink
  const applyExtendMap = useCallback((direction, mode) => {
    const fns = EXTEND_OPS[direction][mode];
    let newWidth = mapWidth;
    let newHeight = mapHeight;
    const newLayers = mapLayers.map(layer => {
      let r = { data: layer.data, width: mapWidth, height: mapHeight };
      for (const fn of fns) r = fn(r.data, r.width, r.height);
      newWidth = r.width;
      newHeight = r.height;
      return { ...layer, data: r.data };
    });
    commitMapLayers(newLayers, newWidth, newHeight);
    return {
      newWidth, newHeight,
      didPrependCol: fns.includes(prependCol),
      didDeleteLeftCol: fns.includes(deleteLeftCol),
      didDeleteRightCol: fns.includes(deleteRightCol),
      didPrependRow: fns.includes(prependRow),
      didDeleteTopRow: fns.includes(deleteTopRow),
      didDeleteBottomRow: fns.includes(deleteBottomRow),
    };
  }, [mapLayers, mapWidth, mapHeight, commitMapLayers]);

  return {
    mapLayers, focusLayer, defaultLayer, mapWidth, mapHeight,
    setFocusLayer, handleLayerChange, handleDefaultLayerChange,
    commitMapLayers, updateActiveLayerData,
    handleUndo, handleRedo, canUndo, canRedo,
    handleLayerAdd, handleLayerDelete, handleLayerRename, handleLayerReorder,
    applyExtendMap, resetHistory,
  };
}
