import { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import { ROOM_DEFAULTS, EXIT_ARROW_COLORS } from '../../constants/room.js';
import { getUpArrowPoints, getDownArrowPoints } from '../map-2d-canvas/geometry.js';

const CELL_SIZE = 36;
const COLS = 5;
const ROWS = 5;
const WIDTH = COLS * CELL_SIZE;
const HEIGHT = ROWS * CELL_SIZE;

const ROOM_SIZE = ROOM_DEFAULTS.roomSize;       // 25
const BORDER_WIDTH = ROOM_DEFAULTS.borderWidth; // 4
const BORDER_RADIUS = ROOM_DEFAULTS.borderRadius; // 50 → full circle in Konva
const KONVA_RECT_SIZE = ROOM_SIZE - BORDER_WIDTH; // 21
const ROOM_OFFSET = (CELL_SIZE - KONVA_RECT_SIZE) / 2; // 7.5
const EXIT_REACH = ROOM_SIZE / 2 + CELL_SIZE * 0.175;  // 18.8

const EXIT_DX_DY = {
  north:     [0, -1],
  south:     [0,  1],
  east:      [1,  0],
  west:      [-1, 0],
  northeast: [1, -1],
  northwest: [-1,-1],
  southeast: [1,  1],
  southwest: [-1, 1],
};

function TutorialCanvas({ script, theme }) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!script?.frames?.length) return;
    setFrameIndex(0);
    let currentIndex = 0;
    let active = true;
    let timerId;

    const step = () => {
      if (!active) return;
      currentIndex = (currentIndex + 1) % script.frames.length;
      setFrameIndex(currentIndex);
      const delay = currentIndex === 0 ? 1200 : (script.frames[currentIndex].delay || 600);
      timerId = setTimeout(step, delay);
    };

    timerId = setTimeout(step, script.frames[1]?.delay ?? 800);
    return () => { active = false; clearTimeout(timerId); };
  }, [script]);

  if (!script?.frames?.length) return null;

  const frame = script.frames[frameIndex] ?? script.frames[0];
  const [focusX, focusY] = frame.focus;
  const cells = frame.cells ?? {};
  const focusHighlight = theme?.focusHighlight || '#D4E8F5';
  const panelBg = theme?.panelBackground || '#1a1a2e';
  const gridColor = theme?.borderColor || '#2a2a44';

  const exitLines = [];
  Object.entries(cells).forEach(([key, cell]) => {
    const [cx, cy] = key.split(',').map(Number);
    const centerX = (cx + 0.5) * CELL_SIZE;
    const centerY = (cy + 0.5) * CELL_SIZE;
    Object.keys(cell.exits ?? {}).forEach(dir => {
      const dxdy = EXIT_DX_DY[dir];
      if (!dxdy) return;
      exitLines.push({
        key: `${key}-${dir}`,
        points: [centerX, centerY, centerX + dxdy[0] * EXIT_REACH, centerY + dxdy[1] * EXIT_REACH],
      });
    });
  });

  return (
    <Stage width={WIDTH} height={HEIGHT} style={{ background: panelBg }}>
      <Layer>
        {Array.from({ length: COLS + 1 }, (_, i) => (
          <Line key={`v${i}`} points={[i * CELL_SIZE, 0, i * CELL_SIZE, HEIGHT]} stroke={gridColor} strokeWidth={0.5} />
        ))}
        {Array.from({ length: ROWS + 1 }, (_, i) => (
          <Line key={`h${i}`} points={[0, i * CELL_SIZE, WIDTH, i * CELL_SIZE]} stroke={gridColor} strokeWidth={0.5} />
        ))}

        {/* Focus highlight — filled cell behind rooms, matching the real canvas */}
        <Rect
          x={focusX * CELL_SIZE}
          y={focusY * CELL_SIZE}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill={focusHighlight}
          listening={false}
        />

        {exitLines.map(l => (
          <Line key={l.key} points={l.points} stroke={ROOM_DEFAULTS.borderColor} strokeWidth={4} lineCap="round" listening={false} />
        ))}

        {Object.entries(cells).map(([key, cell]) => {
          const [cx, cy] = key.split(',').map(Number);
          const ox = cx * CELL_SIZE;
          const oy = cy * CELL_SIZE;
          const center = CELL_SIZE / 2;
          return [
            <Rect
              key={key}
              x={ox + ROOM_OFFSET}
              y={oy + ROOM_OFFSET}
              width={KONVA_RECT_SIZE}
              height={KONVA_RECT_SIZE}
              fill={ROOM_DEFAULTS.fillColor}
              stroke={ROOM_DEFAULTS.borderColor}
              strokeWidth={BORDER_WIDTH}
              cornerRadius={BORDER_RADIUS}
            />,
            cell.exits?.up ? (
              <Line
                key={`${key}-up`}
                x={ox} y={oy}
                points={getUpArrowPoints(ROOM_SIZE, CELL_SIZE, center)}
                closed fill={EXIT_ARROW_COLORS.up} stroke={EXIT_ARROW_COLORS.up} strokeWidth={0} listening={false}
              />
            ) : null,
            cell.exits?.down ? (
              <Line
                key={`${key}-down`}
                x={ox} y={oy}
                points={getDownArrowPoints(ROOM_SIZE, CELL_SIZE, center)}
                closed fill={EXIT_ARROW_COLORS.down} stroke={EXIT_ARROW_COLORS.down} strokeWidth={0} listening={false}
              />
            ) : null,
            cell.text ? (
              <Text
                key={`${key}-text`}
                x={ox} y={oy} width={CELL_SIZE} height={CELL_SIZE}
                text={cell.text} align="center" verticalAlign="middle"
                fontSize={Math.max(8, Math.floor(CELL_SIZE * 0.25))}
                fill={theme?.labelText || '#222222'}
                ellipsis wrap="none" listening={false}
              />
            ) : null,
          ];
        })}
      </Layer>
    </Stage>
  );
}

export default TutorialCanvas;
