import { useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, OrbitControls, Line, Text } from '@react-three/drei';
import { styled } from 'styled-components';
import { resolveExitColor } from '../map-2d-canvas/geometry.js';
import { EXIT_DIRECTIONS } from '../map-view/utils';
import { ROOM_DEFAULTS } from '../../constants/room';

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const Toolbar = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RecordButton = styled.button`
  padding: 6px 12px;
  font-size: 13px;
  border: none;
  border-radius: 4px;
  background: ${p => (p.$active ? '#c0392b' : 'rgba(0, 0, 0, 0.6)')};
  color: #fff;
  cursor: ${p => (p.disabled ? 'default' : 'pointer')};
`;

// One full 360° turn lasts this long; also the recording length.
const ORBIT_DURATION_MS = 10000;

// Downward tilt of the panorama shot as it sweeps around from the map center.
const PANORAMA_PITCH_DEG = 15;

// --- Exported helpers (also used in tests) ---

// Rotate a 3D offset around the vertical (Y) axis by `angle` radians.
// Y (elevation) is untouched, so the camera orbits at its current view angle.
export function rotateAroundY([x, y, z], angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos + z * sin, y, -x * sin + z * cos];
}

// Camera elevation above the horizon for the default view. Lower = more
// isometric/flat, higher = more top-down. Tune to taste (45–55 reads isometric).
const CAMERA_ELEVATION_DEG = 50;

export function computeCameraSetup(mapWidth, mapHeight, cellSize, layerCount = 1) {
  const centerX = ((mapWidth - 1) * cellSize) / 2;
  const centerZ = ((mapHeight - 1) * cellSize) / 2;
  const centerY = ((layerCount - 1) * cellSize * VERTICAL_SCALE) / 2;
  const radius = Math.max(mapWidth, mapHeight, layerCount, 1) * cellSize * 1.1;
  const angle = (CAMERA_ELEVATION_DEG * Math.PI) / 180;
  return {
    target: [centerX, centerY, centerZ],
    position: [centerX, centerY + radius * Math.sin(angle), centerZ + radius * Math.cos(angle)],
  };
}

// --- Room component ---

function Room({ gridX, gridY, layerY = 0, roomData, cellSize, labelColor = '#222222' }) {
  const x = gridX * cellSize;
  const z = gridY * cellSize;

  const roomSize = roomData.roomSize ?? ROOM_DEFAULTS.roomSize;
  const borderWidth = roomData.borderWidth ?? ROOM_DEFAULTS.borderWidth;
  const fillColor = roomData.fillColor ?? ROOM_DEFAULTS.fillColor;
  const borderColor = roomData.borderColor ?? ROOM_DEFAULTS.borderColor;
  const borderRadius = roomData.borderRadius ?? ROOM_DEFAULTS.borderRadius;

  const isCircle = borderRadius >= roomSize / 2;
  const fillRadius = (roomSize - borderWidth) / 2;
  const borderRadius3d = roomSize / 2;

  return (
    <Billboard position={[x, layerY, z]}>
      {/* Border mesh — sits behind fill mesh */}
      {isCircle ? (
        <mesh position={[0, 0, -0.5]}>
          <circleGeometry args={[borderRadius3d, 32]} />
          <meshBasicMaterial color={borderColor} />
        </mesh>
      ) : (
        <mesh position={[0, 0, -0.5]}>
          <planeGeometry args={[roomSize, roomSize]} />
          <meshBasicMaterial color={borderColor} />
        </mesh>
      )}
      {/* Fill mesh — sits in front of border mesh */}
      {isCircle ? (
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[fillRadius, 32]} />
          <meshBasicMaterial color={fillColor} />
        </mesh>
      ) : (
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[roomSize - borderWidth, roomSize - borderWidth]} />
          <meshBasicMaterial color={fillColor} />
        </mesh>
      )}
      {/* Label — sits in front of the fill, faces camera via the Billboard.
          drei <Text> loads a font from a remote CDN and suspends while it does.
          Its own Suspense boundary keeps that suspension local: the room mesh
          still renders and the label pops in when the font arrives. Without this,
          the suspension propagates to R3F's Canvas <Block> and up to the outer
          Suspense, collapsing the whole canvas if the font is slow/blocked. */}
      {roomData.text ? (
        <Suspense fallback={null}>
          <Text
            position={[0, 0, 0.5]}
            fontSize={roomSize * 0.32}
            color={labelColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={roomSize}
          >
            {roomData.text}
          </Text>
        </Suspense>
      ) : null}
    </Billboard>
  );
}

// --- ExitLines component ---


// Layers are spaced (and up/down exits reach) this multiple of a cardinal step,
// so vertical connections read taller than N/E/S/W. Diagonals are ~1.41x.
const VERTICAL_SCALE = 1.2;

const VERTICAL_DIRECTIONS = [
  { dir: 'up',   dLayer: +1 },
  { dir: 'down', dLayer: -1 },
];

function ExitLines({ gridX, gridY, layerY = 0, layerIndex = 0, layerCount = 1, roomData, cellSize, mapWidth, mapHeight }) {
  const x = gridX * cellSize;
  const z = gridY * cellSize;
  const Y = layerY + 0.5;

  const horizontalLines = EXIT_DIRECTIONS.flatMap(({ key: dir, dx, dy }) => {
    if (!roomData.exits?.[dir]) return [];

    const targetGridX = gridX + dx;
    const targetGridY = gridY + dy;
    if (targetGridX < 0 || targetGridX >= mapWidth || targetGridY < 0 || targetGridY >= mapHeight) {
      return [];
    }

    const tx = targetGridX * cellSize;
    const tz = targetGridY * cellSize;
    const color = resolveExitColor(roomData, dir);

    return (
      <Line
        key={dir}
        points={[[x, Y, z], [tx, Y, tz]]}
        color={color}
        lineWidth={2}
      />
    );
  });

  const verticalLines = VERTICAL_DIRECTIONS.flatMap(({ dir, dLayer }) => {
    if (!roomData.exits?.[dir]) return [];

    const targetLayer = layerIndex + dLayer;
    if (targetLayer < 0 || targetLayer >= layerCount) return [];

    const color = resolveExitColor(roomData, dir);

    return (
      <Line
        key={dir}
        points={[[x, layerY, z], [x, layerY + dLayer * cellSize * VERTICAL_SCALE, z]]}
        color={color}
        lineWidth={2}
      />
    );
  });

  return <>{horizontalLines}{verticalLines}</>;
}

// --- LayerGroup component ---

function LayerGroup({ layerData, layerIndex, layerCount, cellSize, mapWidth, mapHeight, labelColor, showPlane = false }) {
  const layerY = layerIndex * cellSize * VERTICAL_SCALE;
  const rooms = [];
  const exits = [];
  const tiles = [];

  for (let x = 0; x < mapWidth; x++) {
    for (let y = 0; y < mapHeight; y++) {
      const cell = layerData[x]?.[y];
      if (!cell) continue;

      // Cell background → flat floor tile, full cell, sits just under the room.
      if (cell?.bg) {
        tiles.push(
          <mesh key={`bg-${x}-${y}`} position={[x * cellSize, layerY - 0.5, y * cellSize]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[cellSize, cellSize]} />
            <meshBasicMaterial color={cell.bg} side={2} />
          </mesh>
        );
      }

      if (cell?.enabled) {
        rooms.push(
          <Room key={`room-${x}-${y}`} gridX={x} gridY={y} layerY={layerY} roomData={cell} cellSize={cellSize} labelColor={labelColor} />
        );
      }

      exits.push(
        <ExitLines
          key={`exits-${x}-${y}`}
          gridX={x}
          gridY={y}
          layerY={layerY}
          layerIndex={layerIndex}
          layerCount={layerCount}
          roomData={cell}
          cellSize={cellSize}
          mapWidth={mapWidth}
          mapHeight={mapHeight}
        />
      );
    }
  }

  return (
    <group>
      {/* showPlane={true}: future translucent floor plane per layer goes here */}
      {tiles}
      {rooms}
      {exits}
    </group>
  );
}

// --- MapScene ---

function MapScene({ mapLayers, cellSize, mapWidth, mapHeight, labelColor }) {
  if (!mapLayers || !Array.isArray(mapLayers)) return null;

  return (
    <group>
      {mapLayers.map((layer, layerIndex) => (
        <LayerGroup
          key={layer.id ?? layerIndex}
          layerData={layer.data ?? []}
          layerIndex={layerIndex}
          layerCount={mapLayers.length}
          cellSize={cellSize}
          mapWidth={mapWidth}
          mapHeight={mapHeight}
          labelColor={labelColor}
        />
      ))}
    </group>
  );
}

// --- ShotRecorder ---
// While `recording`, drives the camera one full 360° turn over ORBIT_DURATION_MS
// (real time, so it's frame-rate independent). Two modes:
//   'orbit'    — camera stays outside and circles the point the user is looking
//                at (OrbitControls' live target, so any panning is preserved).
//   'panorama' — camera sits at the map center and spins in place, sweeping the
//                surrounding rooms with a slight downward tilt.
//
// The click that starts recording triggers a brief render-loop stall (a React
// re-render of the scene). If the MediaRecorder ran during that stall it would
// bake ~2s of frozen frames into the start of the clip. So we wait for a few
// consecutive live frames — which only tick once the loop is past the stall —
// then fire onArmed() (parent starts the recorder) and begin the spin together.
const WARMUP_FRAMES = 5;

function ShotRecorder({ recording, mode, mapCenter, cellSize, onArmed, onComplete }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const spinStart = useRef(null);
  const center = useRef(null);   // orbit: point circled | panorama: eye position
  const offset = useRef(null);   // orbit only: camera offset from center
  const warmFrames = useRef(0);
  const done = useRef(false);

  useFrame(() => {
    if (!recording) {
      spinStart.current = null;
      center.current = null;
      offset.current = null;
      warmFrames.current = 0;
      done.current = false;
      return;
    }
    if (spinStart.current === null) {
      warmFrames.current += 1;
      if (warmFrames.current < WARMUP_FRAMES) return;
      spinStart.current = performance.now();
      if (mode === 'panorama') {
        // Stand at the map center, lifted one cell so we're not inside a room.
        center.current = [mapCenter[0], mapCenter[1] + cellSize, mapCenter[2]];
      } else {
        const t = controls?.target;
        center.current = t ? [t.x, t.y, t.z] : mapCenter;
        offset.current = [
          camera.position.x - center.current[0],
          camera.position.y - center.current[1],
          camera.position.z - center.current[2],
        ];
      }
      onArmed();
    }
    const [cx, cy, cz] = center.current;
    const frac = Math.min((performance.now() - spinStart.current) / ORBIT_DURATION_MS, 1);
    const theta = frac * Math.PI * 2;

    if (mode === 'panorama') {
      const pitch = (PANORAMA_PITCH_DEG * Math.PI) / 180;
      const cp = Math.cos(pitch);
      camera.position.set(cx, cy, cz);
      camera.lookAt(cx + Math.cos(theta) * cp, cy - Math.sin(pitch), cz + Math.sin(theta) * cp);
    } else {
      const [ox, oy, oz] = rotateAroundY(offset.current, theta);
      camera.position.set(cx + ox, cy + oy, cz + oz);
      camera.lookAt(cx, cy, cz);
    }

    if (frac >= 1 && !done.current) {
      done.current = true;
      onComplete();
    }
  });

  return null;
}

// --- Main export ---

export default function Map3DCanvas({ mapLayers, cellSize, mapWidth, mapHeight, theme }) {
  const { position, target } = useMemo(
    () => computeCameraSetup(mapWidth, mapHeight, cellSize, mapLayers?.length ?? 1),
    [mapWidth, mapHeight, cellSize, mapLayers?.length]
  );

  const bg = theme?.canvasOutOfBounds ?? '#ffffff';
  const labelColor = theme?.labelText ?? '#222222';

  const [recording, setRecording] = useState(false);
  const [mode, setMode] = useState('orbit');
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = (shotMode) => {
    const canvas = canvasRef.current;
    if (!canvas || recording || typeof MediaRecorder === 'undefined') return;

    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = shotMode + '.webm';
      a.click();
      URL.revokeObjectURL(url);
      setRecording(false);
    };
    recorderRef.current = recorder;
    // Don't start the recorder yet — ShotRecorder starts it via onArmed once
    // the render loop is live, so the warm-up stall isn't recorded.
    setMode(shotMode);
    setRecording(true);
  };

  return (
    <CanvasContainer>
      <Toolbar>
        <RecordButton
          $active={recording && mode === 'orbit'}
          onClick={() => startRecording('orbit')}
          disabled={recording}
        >
          {recording && mode === 'orbit' ? 'Recording…' : '⏺ Orbit'}
        </RecordButton>
        <RecordButton
          $active={recording && mode === 'panorama'}
          onClick={() => startRecording('panorama')}
          disabled={recording}
        >
          {recording && mode === 'panorama' ? 'Recording…' : '⏺ Panorama'}
        </RecordButton>
      </Toolbar>
      <Canvas
        // alpha:false → opaque frames, so MediaRecorder doesn't flag the WebM
        // with alpha_mode (which makes Chrome error on playback).
        gl={{ alpha: false }}
        camera={{ position, fov: 50, near: 0.1, far: 50000 }}
        onCreated={({ gl }) => { canvasRef.current = gl.domElement; }}
      >
        <color attach="background" args={[bg]} />
        <OrbitControls makeDefault target={target} enabled={!recording} />
        <ShotRecorder
          recording={recording}
          mode={mode}
          mapCenter={target}
          cellSize={cellSize}
          onArmed={() => recorderRef.current?.start()}
          onComplete={() => recorderRef.current?.stop()}
        />
        <MapScene
          mapLayers={mapLayers}
          cellSize={cellSize}
          mapWidth={mapWidth}
          mapHeight={mapHeight}
          labelColor={labelColor}
        />
      </Canvas>
    </CanvasContainer>
  );
}
