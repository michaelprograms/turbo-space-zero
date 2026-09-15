// src/components/map-view/hooks/useMapNavigation.js
import { useState, useCallback } from 'react';
import { appendCol, prependCol, appendRow, prependRow, MAX_MAP_SIZE } from '../../../data';
import { DIRECTIONS, getRectCells, cloneMapGrid } from '../utils';

export function useMapNavigation({ mapWidth, mapHeight, mapData, mapLayers, focusLayer, updateActiveLayerData, commitMapLayers, enableRoom }) {
  const [mapFocusX, setMapFocusX] = useState(0);
  const [mapFocusY, setMapFocusY] = useState(0);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState({ x: 0, y: 0 });
  const [isQuillMode, setIsQuillMode] = useState(false);

  const toggleQuillMode = useCallback(() => {
    setIsQuillMode(prev => {
      if (!prev) {
        const mapCopy = cloneMapGrid(mapData);
        if (!mapCopy[mapFocusX]?.[mapFocusY]?.enabled) {
          updateActiveLayerData(enableRoom(mapCopy, mapFocusX, mapFocusY));
        }
      }
      return !prev;
    });
  }, [mapData, mapFocusX, mapFocusY, enableRoom, updateActiveLayerData]);

  const handleNavigate = useCallback((direction) => {
    const { dx, dy, opposite } = DIRECTIONS[direction];
    const newX = mapFocusX + dx;
    const newY = mapFocusY + dy;
    const xOob = newX < 0 || newX >= mapWidth;
    const yOob = newY < 0 || newY >= mapHeight;

    if (xOob || yOob) {
      if (!isQuillMode) return;
      if (xOob && mapWidth >= MAX_MAP_SIZE) return;
      if (yOob && mapHeight >= MAX_MAP_SIZE) return;

      const ops = [];
      let xShift = 0, yShift = 0;
      if (xOob && newX < 0) { ops.push(prependCol); xShift = 1; }
      else if (xOob)         { ops.push(appendCol); }
      if (yOob && newY < 0) { ops.push(prependRow); yShift = 1; }
      else if (yOob)         { ops.push(appendRow); }

      let newWidth = mapWidth, newHeight = mapHeight;
      let expandedLayers = mapLayers.map(layer => {
        let r = { data: [...layer.data], width: mapWidth, height: mapHeight };
        for (const op of ops) r = op(r.data, r.width, r.height);
        newWidth = r.width; newHeight = r.height;
        return { ...layer, data: r.data };
      });

      const curX = mapFocusX + xShift;
      const curY = mapFocusY + yShift;
      const destX = curX + dx;
      const destY = curY + dy;

      let activeData = expandedLayers[focusLayer].data.map(col => [...col]);
      if (!activeData[curX][curY].enabled) activeData = enableRoom(activeData, curX, curY);
      activeData[curX] = [...activeData[curX]];
      activeData[curX][curY] = { ...activeData[curX][curY], exits: { ...activeData[curX][curY].exits, [direction]: true } };
      if (!activeData[destX][destY].enabled) activeData = enableRoom(activeData, destX, destY);
      activeData[destX] = [...activeData[destX]];
      activeData[destX][destY] = { ...activeData[destX][destY], exits: { ...activeData[destX][destY].exits, [opposite]: true } };

      expandedLayers = expandedLayers.map((layer, i) =>
        i === focusLayer ? { ...layer, data: activeData } : layer
      );
      commitMapLayers(expandedLayers, newWidth, newHeight);
      setMapFocusX(destX);
      setMapFocusY(destY);
      return;
    }

    if (isQuillMode) {
      let mapCopy = cloneMapGrid(mapData);
      if (!mapCopy[mapFocusX][mapFocusY].enabled) mapCopy = enableRoom(mapCopy, mapFocusX, mapFocusY);
      mapCopy[mapFocusX] = [...mapCopy[mapFocusX]];
      mapCopy[mapFocusX][mapFocusY] = { ...mapCopy[mapFocusX][mapFocusY], exits: { ...mapCopy[mapFocusX][mapFocusY].exits, [direction]: true } };
      if (!mapCopy[newX][newY].enabled) mapCopy = enableRoom(mapCopy, newX, newY);
      mapCopy[newX] = [...mapCopy[newX]];
      mapCopy[newX][newY] = { ...mapCopy[newX][newY], exits: { ...mapCopy[newX][newY].exits, [opposite]: true } };
      updateActiveLayerData(mapCopy);
    }

    setMapFocusX(newX);
    setMapFocusY(newY);
  }, [mapFocusX, mapFocusY, mapData, mapLayers, focusLayer, isQuillMode, mapWidth, mapHeight, updateActiveLayerData, commitMapLayers, enableRoom]);

  const handleGridOnClick = useCallback((x, y, { shiftKey, ctrlKey, altKey } = {}) => {
    if (shiftKey) {
      setSelectedCells(prev => new Set([...prev, ...getRectCells(selectionAnchor.x, selectionAnchor.y, x, y)]));
    } else if (ctrlKey || altKey) {
      setSelectedCells(prev => {
        const next = new Set(prev);
        const key = `${x},${y}`;
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
      });
    } else {
      setSelectedCells(new Set());
      setMapFocusX(x);
      setMapFocusY(y);
      setSelectionAnchor({ x, y });
    }
  }, [selectionAnchor]);

  return {
    mapFocusX, mapFocusY, setMapFocusX, setMapFocusY,
    selectedCells, setSelectedCells,
    selectionAnchor, setSelectionAnchor,
    isQuillMode, toggleQuillMode,
    handleNavigate, handleGridOnClick,
  };
}
