import { Children } from 'react';
import { render, screen } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import Map3DCanvas, { computeCameraSetup, rotateAroundY } from './index';

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
  expect(target[1]).toBe(0);
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

test('renders one billboard per enabled room', () => {
  const mapLayers = makeMapLayers(makeMapData(3, 3, [[0, 0], [1, 2]]));
  render(
    <Map3DCanvas
      mapLayers={mapLayers}
      mapWidth={3}
      mapHeight={3}
      cellSize={40}
      theme={{}}
    />
  );
  expect(screen.getAllByTestId('billboard')).toHaveLength(2);
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

test('renders no billboards when no rooms are enabled', () => {
  const mapLayers = makeMapLayers(makeMapData(3, 3));
  render(
    <Map3DCanvas
      mapLayers={mapLayers}
      mapWidth={3}
      mapHeight={3}
      cellSize={40}
      theme={{}}
    />
  );
  expect(screen.queryAllByTestId('billboard')).toHaveLength(0);
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
  // centerY = ((3-1) * 40 * 1.2) / 2 = 48  (VERTICAL_SCALE = 1.2)
  expect(target[1]).toBeCloseTo(48);
  // camera position Y is above center
  expect(position[1]).toBeGreaterThan(target[1]);
});

test('computeCameraSetup with layerCount=1 is backward-compatible', () => {
  const single = computeCameraSetup(5, 5, 40, 1);
  const legacy = computeCameraSetup(5, 5, 40);
  expect(single.target[1]).toBeCloseTo(legacy.target[1]);
  expect(single.position[1]).toBeCloseTo(legacy.position[1]);
});

test('renders billboards from all layers', () => {
  const data0 = makeMapData(3, 3, [[0, 0], [1, 1]]);
  const data1 = makeMapData(3, 3, [[2, 2]]);
  const mapLayers = [
    { id: 'l0', name: 'Layer 1', data: data0 },
    { id: 'l1', name: 'Layer 2', data: data1 },
  ];
  render(
    <Map3DCanvas
      mapLayers={mapLayers}
      mapWidth={3}
      mapHeight={3}
      cellSize={40}
      theme={{}}
    />
  );
  // 2 rooms on layer 0 + 1 room on layer 1 = 3 billboards
  expect(screen.getAllByTestId('billboard')).toHaveLength(3);
});

test('renders a vertical exit line when room has up exit and next layer exists', () => {
  const data0 = makeMapData(3, 3, [[1, 1]]);
  data0[1][1] = { ...data0[1][1], exits: { up: true }, exitColors: {} };
  const data1 = makeMapData(3, 3);
  const mapLayers = [
    { id: 'l0', name: 'Layer 1', data: data0 },
    { id: 'l1', name: 'Layer 2', data: data1 },
  ];
  render(
    <Map3DCanvas mapLayers={mapLayers} mapWidth={3} mapHeight={3} cellSize={40} theme={{}} />
  );
  const lines = screen.getAllByTestId('exit-line');
  const vertical = lines.find(l => {
    const pts = JSON.parse(l.dataset.points);
    return pts[0][0] === pts[1][0] && pts[0][2] === pts[1][2] && pts[0][1] !== pts[1][1];
  });
  expect(vertical).toBeDefined();
});

test('does not render a vertical exit line when target layer does not exist', () => {
  const data0 = makeMapData(3, 3, [[1, 1]]);
  data0[1][1] = { ...data0[1][1], exits: { up: true }, exitColors: {} };
  const mapLayers = [{ id: 'l0', name: 'Layer 1', data: data0 }];
  render(
    <Map3DCanvas mapLayers={mapLayers} mapWidth={3} mapHeight={3} cellSize={40} theme={{}} />
  );
  const lines = screen.queryAllByTestId('exit-line');
  const vertical = lines.find(l => {
    const pts = JSON.parse(l.dataset.points);
    return pts[0][0] === pts[1][0] && pts[0][2] === pts[1][2] && pts[0][1] !== pts[1][1];
  });
  expect(vertical).toBeUndefined();
});
