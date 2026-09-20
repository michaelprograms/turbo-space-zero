import { Children } from 'react';
import { render, screen } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import Map3DCanvas, { computeCameraSetup, rotateAroundY, collectRoomInstances, collectExitSegments, collectCellBackgrounds, roomShape, collectGuideLines } from './index';

// Mock react-three/fiber — Canvas just renders its children into a div.
// The scene background is set via <color attach="background" args={[bg]} />, so
// data-bg pulls that color straight off the element's props (reliable; avoids
// jsdom attribute/color normalization).
// useFrame/useThree are no-ops so ShotRecorder can render without a real WebGL context.
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, style }) => {
    let bg;
    Children.forEach(children, (child) => {
      if (child?.type === 'color' && child.props?.attach === 'background') {
        bg = child.props.args?.[0];
      }
    });
    return <div data-testid="canvas-container" data-bg={bg} style={style}>{children}</div>;
  },
  useFrame: () => {},
  useThree: () => ({ camera: { position: { x: 0, y: 0, z: 0, set: () => {} }, lookAt: () => {} } }),
}));

// Mock drei — Billboard renders children so we can count rooms
vi.mock('@react-three/drei', () => ({
  Billboard: ({ children }) => <div data-testid="billboard">{children}</div>,
  OrbitControls: () => null,
  Line: ({ points }) => <div data-testid="exit-line" data-points={JSON.stringify(points)} />,
  Text: ({ children, color }) => <div data-testid="room-label" data-color={color}>{children}</div>,
}));

// Helper: build a mapData array (column-major: mapData[x][y])
function makeMapData(width, height, enabledCells = []) {
  const data = Array.from({ length: width }, (_, x) =>
    Array.from({ length: height }, (_, y) => {
      const isEnabled = enabledCells.some(([ex, ey]) => ex === x && ey === y);
      return isEnabled
        ? { enabled: true, fillColor: '#999', borderColor: '#666', roomSize: 25, borderWidth: 4, borderRadius: 50 }
        : {};
    })
  );
  return data;
}

function makeMapLayers(mapData) {
  return [{ id: 'layer-1', name: 'Layer 1', data: mapData }];
}

// --- Pure helper tests ---

test('computeCameraSetup returns center and position scaled to grid', () => {
  const { target, position } = computeCameraSetup(5, 5, 40);
  // center of a 5x5 grid with cellSize=40 is (80, 0, 80)
  expect(target[0]).toBeCloseTo(80);
  // aimed slightly below center for framing: centerY(0) - extent(200)*0.1 = -20
  expect(target[1]).toBeCloseTo(-20);
  expect(target[2]).toBeCloseTo(80);
  // position is above (y > 0) and south of center (z > target[2])
  expect(position[1]).toBeGreaterThan(0);
  expect(position[2]).toBeGreaterThan(target[2]);
});

test('rotateAroundY preserves elevation and returns to start after a full turn', () => {
  const offset = [3, 7, 0];
  // Quarter turn: [x,0,z] with z=0 → x maps toward -z axis, y unchanged.
  const quarter = rotateAroundY(offset, Math.PI / 2);
  expect(quarter[0]).toBeCloseTo(0);
  expect(quarter[1]).toBe(7); // elevation untouched
  expect(quarter[2]).toBeCloseTo(-3);
  // Full turn returns to the original offset.
  const full = rotateAroundY(offset, Math.PI * 2);
  expect(full[0]).toBeCloseTo(3);
  expect(full[2]).toBeCloseTo(0);
});

// --- Component tests ---

test('canvas container uses canvasOutOfBounds as background', () => {
  const mapLayers = makeMapLayers(makeMapData(3, 3));
  render(
    <Map3DCanvas
      mapLayers={mapLayers}
      mapWidth={3}
      mapHeight={3}
      cellSize={40}
      theme={{ canvasOutOfBounds: '#222222' }}
    />
  );
  const container = screen.getByTestId('canvas-container');
  expect(container.dataset.bg).toBe('#222222');
});

test('collectRoomInstances returns one instance per enabled room, positioned by grid', () => {
  const mapLayers = makeMapLayers(makeMapData(3, 3, [[0, 0], [1, 2]]));
  const instances = collectRoomInstances(mapLayers, 40);
  expect(instances).toHaveLength(2);
  // [1,2] → x*cellSize=40, layerY=0, y*cellSize=80; radius = roomSize/2 = 12.5
  const room = instances.find(r => r.position[0] === 40 && r.position[2] === 80);
  expect(room).toBeDefined();
  expect(room.position[1]).toBe(0);
  expect(room.radius).toBe(12.5);
  expect(room.fillColor).toBe('#999');
  expect(room.borderColor).toBe('#666');
});

test('roomShape buckets by roundness: square→cube, mid→rounded, round→sphere', () => {
  // roundness = borderRadius / 50 (percent scale); 50 = full circle.
  expect(roomShape(0, 25)).toBe('cube');       // sharp corners
  expect(roomShape(8, 25)).toBe('cube');       // 0.16
  expect(roomShape(25, 25)).toBe('rounded');   // 0.50
  expect(roomShape(40, 25)).toBe('sphere');    // 0.80
  expect(roomShape(50, 25)).toBe('sphere');    // default → sphere
});

test('collectRoomInstances tags each room with its shape bucket', () => {
  const data = makeMapData(3, 3, [[0, 0], [1, 1]]);
  data[0][0] = { ...data[0][0], borderRadius: 0 };   // cube
  data[1][1] = { ...data[1][1], borderRadius: 50 };  // sphere
  const instances = collectRoomInstances(makeMapLayers(data), 40);
  expect(instances.find(r => r.position[0] === 0).shape).toBe('cube');
  expect(instances.find(r => r.position[0] === 40).shape).toBe('sphere');
});

test('collectGuideLines splits a 25×25 map into border / chunk / grid lines', () => {
  const { border, grid, chunk } = collectGuideLines(25, 25, 40);
  // Per axis (k=0..25): 2 border (0,25), 2 chunk (10,20), 22 grid. Two axes.
  expect(border).toHaveLength(4);
  expect(chunk).toHaveLength(4);
  expect(grid).toHaveLength(44);
  // Boundaries use the 3D convention (i-0.5)*cellSize, enclosing all rooms.
  const xs = border.flatMap(l => [l.a[0], l.b[0]]);
  expect(Math.min(...xs)).toBeCloseTo(-20);       // (0-0.5)*40
  expect(Math.max(...xs)).toBeCloseTo(980);       // (25-0.5)*40
});

test('collectGuideLines returns empty groups for a zero-size map', () => {
  const { border, grid, chunk } = collectGuideLines(0, 0, 40);
  expect(border).toHaveLength(0);
  expect(grid).toHaveLength(0);
  expect(chunk).toHaveLength(0);
});

test('renders a room label with its text and the theme label color', () => {
  const data = makeMapData(3, 3, [[1, 1]]);
  data[1][1] = { ...data[1][1], text: 'Entrance' };
  render(
    <Map3DCanvas
      mapLayers={makeMapLayers(data)}
      mapWidth={3}
      mapHeight={3}
      cellSize={40}
      theme={{ labelText: '#abcdef' }}
    />
  );
  const label = screen.getByTestId('room-label');
  expect(label).toHaveTextContent('Entrance');
  expect(label.dataset.color).toBe('#abcdef');
});

test('renders no label when a room has no text', () => {
  const mapLayers = makeMapLayers(makeMapData(3, 3, [[1, 1]]));
  render(
    <Map3DCanvas mapLayers={mapLayers} mapWidth={3} mapHeight={3} cellSize={40} theme={{}} />
  );
  expect(screen.queryByTestId('room-label')).not.toBeInTheDocument();
});

test('collectRoomInstances returns nothing when no rooms are enabled', () => {
  const mapLayers = makeMapLayers(makeMapData(3, 3));
  expect(collectRoomInstances(mapLayers, 40)).toHaveLength(0);
});

test('does not crash with empty mapLayers', () => {
  render(
    <Map3DCanvas
      mapLayers={[]}
      mapWidth={0}
      mapHeight={0}
      cellSize={40}
      theme={{}}
    />
  );
  expect(screen.getByTestId('canvas-container')).toBeInTheDocument();
});

test('uses theme.canvasOutOfBounds falling back to #ffffff when undefined', () => {
  const mapLayers = makeMapLayers(makeMapData(2, 2));
  render(
    <Map3DCanvas
      mapLayers={mapLayers}
      mapWidth={2}
      mapHeight={2}
      cellSize={40}
      theme={{}}
    />
  );
  const container = screen.getByTestId('canvas-container');
  // No canvasOutOfBounds in theme — should fall back to #ffffff
  expect(container.dataset.bg).toBe('#ffffff');
});

test('computeCameraSetup centers vertically across multiple layers', () => {
  const { target, position } = computeCameraSetup(5, 5, 40, 3);
  // centerY = ((3-1) * 40 * 1.2) / 2 = 48  (VERTICAL_SCALE = 1.2);
  // framing lift drops the aim by extent(200)*0.1 = 20 → 28
  expect(target[1]).toBeCloseTo(28);
  // camera position Y is above the aim point
  expect(position[1]).toBeGreaterThan(target[1]);
});

test('computeCameraSetup with layerCount=1 is backward-compatible', () => {
  const single = computeCameraSetup(5, 5, 40, 1);
  const legacy = computeCameraSetup(5, 5, 40);
  expect(single.target[1]).toBeCloseTo(legacy.target[1]);
  expect(single.position[1]).toBeCloseTo(legacy.position[1]);
});

test('collectRoomInstances gathers rooms from all layers with per-layer height', () => {
  const data0 = makeMapData(3, 3, [[0, 0], [1, 1]]);
  const data1 = makeMapData(3, 3, [[2, 2]]);
  const mapLayers = [
    { id: 'l0', name: 'Layer 1', data: data0 },
    { id: 'l1', name: 'Layer 2', data: data1 },
  ];
  const instances = collectRoomInstances(mapLayers, 40);
  // 2 rooms on layer 0 + 1 room on layer 1 = 3
  expect(instances).toHaveLength(3);
  // layer 1 room sits above layer 0: layerY = 1 * 40 * 1.2 = 48
  const upper = instances.find(r => r.position[1] > 0);
  expect(upper.position[1]).toBeCloseTo(48);
});

test('collectCellBackgrounds gathers bg cells from all layers, positioned under the room', () => {
  const data0 = makeMapData(3, 3);
  data0[1][2] = { bg: '#00AF00' };
  const data1 = makeMapData(3, 3);
  data1[0][0] = { bg: '#ff0000' };
  const mapLayers = [
    { id: 'l0', data: data0 },
    { id: 'l1', data: data1 },
  ];
  const tiles = collectCellBackgrounds(mapLayers, 40);
  expect(tiles).toHaveLength(2);
  const green = tiles.find(t => t.color === '#00AF00');
  // [1,2] on layer 0 → x=40, y=-0.5 (just under the room), z=80
  expect(green.position).toEqual([40, -0.5, 80]);
  // layer 1 tile sits higher: layerY = 1*40*1.2 = 48, minus 0.5 = 47.5
  const red = tiles.find(t => t.color === '#ff0000');
  expect(red.position[1]).toBeCloseTo(47.5);
});

const isVertical = s => s.a[0] === s.b[0] && s.a[2] === s.b[2] && s.a[1] !== s.b[1];

test('collectExitSegments emits a vertical segment when room has up exit and next layer exists', () => {
  const data0 = makeMapData(3, 3, [[1, 1]]);
  data0[1][1] = { ...data0[1][1], exits: { up: true }, exitColors: {} };
  const data1 = makeMapData(3, 3);
  const mapLayers = [
    { id: 'l0', name: 'Layer 1', data: data0 },
    { id: 'l1', name: 'Layer 2', data: data1 },
  ];
  const segments = collectExitSegments(mapLayers, 40, 3, 3);
  expect(segments.some(isVertical)).toBe(true);
});

test('collectExitSegments emits no vertical segment when target layer does not exist', () => {
  const data0 = makeMapData(3, 3, [[1, 1]]);
  data0[1][1] = { ...data0[1][1], exits: { up: true }, exitColors: {} };
  const mapLayers = [{ id: 'l0', name: 'Layer 1', data: data0 }];
  const segments = collectExitSegments(mapLayers, 40, 3, 3);
  expect(segments.some(isVertical)).toBe(false);
});

test('collectExitSegments drops horizontal exits that leave the grid, keeps in-bounds ones', () => {
  const data = makeMapData(3, 3, [[0, 0]]);
  // corner room with west (off-grid) and east (in-grid) exits
  data[0][0] = { ...data[0][0], exits: { west: true, east: true }, exitColors: {} };
  const segments = collectExitSegments([{ id: 'l0', data }], 40, 3, 3);
  const horizontal = segments.filter(s => s.a[1] === s.b[1]);
  expect(horizontal).toHaveLength(1); // east only; west clipped
  expect(horizontal[0].b[0]).toBe(40); // target x = (0+1)*40
});
