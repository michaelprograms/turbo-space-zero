import { useCallback, useRef, useEffect } from 'react';
import Konva from 'konva';
import { setMap, SCHEMA_VERSION } from '../../../data';
import {
  getRoomRectSize,
  getRoomOffset,
  getExitLineReach,
  resolveExitColor,
  getUpArrowPoints,
  getDownArrowPoints,
} from '../../map-2d-canvas/geometry.js';
import { ROOM_DEFAULTS, EXIT_ARROW_COLORS } from '../../../constants/room';
import { EXIT_DIRECTIONS, getConnectorPositions, fileTimestamp } from '../utils';

export function useMapIO({ activeMapId, result, mapName, theme, mapState, onSaveComplete }) {
  const { mapFocusX, mapFocusY, focusLayer, defaultLayer, mapWidth, mapHeight, mapLayers, cellSize, darkMode, showGrid, showChunks } = mapState;
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;
    return () => { abortRef.current = true; };
  }, [activeMapId]);

  const saveMapData = useCallback(async () => {
    try {
      const newData = {
        ...result,
        schemaVersion: SCHEMA_VERSION,
        name: mapName,
        focusX: mapFocusX,
        focusY: mapFocusY,
        focusLayer,
        defaultLayer,
        width: mapWidth,
        height: mapHeight,
        layers: mapLayers,
        cellSize,
        darkMode,
        showGrid,
        showChunks,
        edited: Date.now(),
      };
      await setMap(activeMapId, newData);
      onSaveComplete?.();
    } catch (error) {
      console.error(`Failed to save map: ${error}`);
    }
  }, [result, mapName, mapFocusX, mapFocusY, focusLayer, defaultLayer, mapWidth, mapHeight,
      mapLayers, cellSize, darkMode, showGrid, showChunks, activeMapId, onSaveComplete]);

  const exportAllLayers = useCallback(async () => {
    if (!mapLayers.length) return;

    try {
      const pixelRatio = 2;
      const stageW = mapWidth * cellSize;
      const stageH = mapHeight * cellSize;
      const headerH = 28;
      const connectorH = 28;
      const layerCount = mapLayers.length;
      const totalH = layerCount * (headerH + stageH) + (layerCount - 1) * connectorH;

      const layerImages = await Promise.all(mapLayers.map(async ({ data }) => {
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        const stage = new Konva.Stage({ container, width: stageW, height: stageH });
        try {
          const konvaLayer = new Konva.Layer();
          stage.add(konvaLayer);
          konvaLayer.add(new Konva.Rect({
            x: 0, y: 0, width: stageW, height: stageH,
            fill: theme?.canvasBackground || '#ffffff',
          }));

          for (let x = 0; x < mapWidth; x++) {
            for (let y = 0; y < mapHeight; y++) {
              const room = data[x]?.[y];
              if (!room) continue;

              const xPos = x * cellSize;
              const yPos = y * cellSize;
              const cx = xPos + cellSize / 2;
              const cy = yPos + cellSize / 2;
              const roomSize = room.roomSize ?? ROOM_DEFAULTS.roomSize;
              const borderWidth = room.borderWidth ?? ROOM_DEFAULTS.borderWidth;

              for (const { key, dx, dy } of EXIT_DIRECTIONS) {
                if (!room.exits?.[key]) continue;
                const reach = getExitLineReach(roomSize, cellSize);
                konvaLayer.add(new Konva.Line({
                  points: [cx, cy, cx + dx * reach, cy + dy * reach],
                  stroke: resolveExitColor(room, key),
                  strokeWidth: 4, lineCap: 'round',
                }));
              }

              if (room.enabled) {
                const nodeSize = getRoomRectSize(roomSize, borderWidth);
                const nodeOffset = getRoomOffset(cellSize, roomSize, borderWidth);
                konvaLayer.add(new Konva.Rect({
                  x: xPos + nodeOffset, y: yPos + nodeOffset,
                  width: nodeSize, height: nodeSize,
                  fill: room.fillColor ?? ROOM_DEFAULTS.fillColor,
                  stroke: room.borderColor ?? ROOM_DEFAULTS.borderColor,
                  strokeWidth: borderWidth,
                  cornerRadius: room.borderRadius ?? ROOM_DEFAULTS.borderRadius,
                }));

                if (room.exits?.up) {
                  konvaLayer.add(new Konva.Line({
                    x: xPos, y: yPos,
                    points: getUpArrowPoints(roomSize, cellSize, cellSize / 2),
                    closed: true, fill: EXIT_ARROW_COLORS.up, stroke: EXIT_ARROW_COLORS.up, strokeWidth: 0,
                  }));
                }
                if (room.exits?.down) {
                  konvaLayer.add(new Konva.Line({
                    x: xPos, y: yPos,
                    points: getDownArrowPoints(roomSize, cellSize, cellSize / 2),
                    closed: true, fill: EXIT_ARROW_COLORS.down, stroke: EXIT_ARROW_COLORS.down, strokeWidth: 0,
                  }));
                }
                if (room.text) {
                  konvaLayer.add(new Konva.Text({
                    x: xPos, y: yPos, width: cellSize, height: cellSize,
                    text: room.text, align: 'center', verticalAlign: 'middle',
                    fontSize: Math.max(8, Math.floor(cellSize * 0.25)),
                    fill: theme?.labelText || '#222222',
                  }));
                }
              }
            }
          }
          return stage.toDataURL({ pixelRatio });
        } finally {
          stage.destroy();
          document.body.removeChild(container);
        }
      }));

      if (abortRef.current) return;

      const canvas = document.createElement('canvas');
      canvas.width = stageW * pixelRatio;
      canvas.height = totalH * pixelRatio;
      const ctx = canvas.getContext('2d');
      ctx.scale(pixelRatio, pixelRatio);

      let y = 0;
      for (let i = 0; i < layerCount; i++) {
        ctx.fillStyle = theme?.exportHeaderBackground || '#333333';
        ctx.fillRect(0, y, stageW, headerH);
        ctx.fillStyle = theme?.exportHeaderText || '#dddddd';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`LAYER ${i + 1} — ${mapLayers[i].name}`, 10, y + 18);
        y += headerH;

        const img = new Image();
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = layerImages[i]; });
        ctx.drawImage(img, 0, y, stageW, stageH);
        y += stageH;

        if (i < layerCount - 1) {
          ctx.fillStyle = theme?.exportConnectorBackground || '#f0f0f0';
          ctx.fillRect(0, y, stageW, connectorH);
          const connectors = getConnectorPositions(mapLayers, i);
          for (const pos of connectors) {
            const [posX] = pos.split(',').map(Number);
            const lineX = posX * cellSize + cellSize / 2;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.lineDashOffset = 0;
            ctx.strokeStyle = EXIT_ARROW_COLORS.up;
            ctx.beginPath(); ctx.moveTo(lineX, y); ctx.lineTo(lineX, y + connectorH); ctx.stroke();
            ctx.lineDashOffset = 3;
            ctx.strokeStyle = EXIT_ARROW_COLORS.down;
            ctx.beginPath(); ctx.moveTo(lineX, y); ctx.lineTo(lineX, y + connectorH); ctx.stroke();
          }
          ctx.setLineDash([]); ctx.lineDashOffset = 0;
          y += connectorH;
        }
      }

      if (abortRef.current) return;

      const finalUrl = canvas.toDataURL('image/png');
      const newWindow = window.open();
      if (!newWindow) return;
      const doc = newWindow.document;
      const stamped = `${mapName || 'Map'} — ${fileTimestamp()}`;
      doc.title = stamped;
      const img = doc.createElement('img');
      img.src = finalUrl;
      img.alt = stamped;
      img.style.maxWidth = '100%';
      doc.body.appendChild(img);
    } catch (error) {
      console.error(`Failed to export map: ${error}`);
    }
  }, [mapLayers, mapWidth, mapHeight, cellSize, theme, mapName]);

  return { saveMapData, exportAllLayers };
}
