import { useMemo, useRef, useState, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, OrbitControls, Line, Text } from '@react-three/drei';
// ponytail: RoundedBoxGeometry is a transitive dep (drei → three-stdlib). It's
// the only ready-made rounded-box *geometry class* (drei's is a JSX component,
// unusable for an imperative instanced base). Vendor a tiny copy if drei ever drops it.
import { RoundedBoxGeometry } from 'three-stdlib';
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
// isometric/flat, higher = more top-down. Tune to taste (30–35 reads as a gentle
// downward look; 45–55 is steeper/isometric).
const CAMERA_ELEVATION_DEG = 33;

// A tilted view foreshortens the near half of the ground plane, so with the
// camera aimed at the true center the map sits low on screen (near edge clips
// off the bottom, empty space up top). Aiming slightly below center pitches the
// view down a touch, lifting the whole map up into frame. Fraction of the map's
// horizontal extent; tune to taste (0 = aim dead center).
const FRAMING_LIFT_FRAC = 0.1;

export function computeCameraSetup(mapWidth, mapHeight, cellSize, layerCount = 1) {
  const centerX = ((mapWidth - 1) * cellSize) / 2;
  const centerZ = ((mapHeight - 1) * cellSize) / 2;
  const centerY = ((layerCount - 1) * cellSize * VERTICAL_SCALE) / 2;
  const extent = Math.max(mapWidth, mapHeight, 1) * cellSize;
  const radius = Math.max(mapWidth, mapHeight, layerCount, 1) * cellSize * 1.1;
  const angle = (CAMERA_ELEVATION_DEG * Math.PI) / 180;
  const targetY = centerY - extent * FRAMING_LIFT_FRAC;
  return {
    target: [centerX, targetY, centerZ],
    position: [centerX, centerY + radius * Math.sin(angle), centerZ + radius * Math.cos(angle)],
  };
}

// --- Room instances ---

// Map a room's border radius to a 3D shape bucket. borderRadius is the 2D corner
// roundness percent (0–50 slider, 50 = fully round). That 0..1 roundness splits
// into three shapes: square-ish → cube, mid → rounded box, round → sphere.
// Default (50) → sphere. roomSize is unused now that roundness is size-independent.
export function roomShape(borderRadius, roomSize) {
  const round = Math.min(Math.max(borderRadius, 0) / 50, 1);
  if (round < 1 / 3) return 'cube';
  if (round < 2 / 3) return 'rounded';
  return 'sphere';
}

// Collect every enabled room across all layers into flat instance data.
// Exported + pure so the placement/color logic is unit-testable without WebGL.
export function collectRoomInstances(mapLayers, cellSize) {
  const out = [];
  if (!Array.isArray(mapLayers)) return out;
  mapLayers.forEach((layer, layerIndex) => {
    const layerData = layer.data ?? [];
    const layerY = layerIndex * cellSize * VERTICAL_SCALE;
    for (let x = 0; x < layerData.length; x++) {
      const col = layerData[x];
      if (!col) continue;
      for (let y = 0; y < col.length; y++) {
        const cell = col[y];
        if (!cell?.enabled) continue;
        const roomSize = cell.roomSize ?? ROOM_DEFAULTS.roomSize;
        const borderWidth = cell.borderWidth ?? ROOM_DEFAULTS.borderWidth;
        const borderRadius = cell.borderRadius ?? ROOM_DEFAULTS.borderRadius;
        out.push({
          position: [x * cellSize, layerY, y * cellSize],
          radius: roomSize / 2,
          // Border as a fraction of the radius, mirroring the 2D ring:
          // fill spans (roomSize-borderWidth), border is the outer rim.
          borderFrac: Math.min(Math.max(borderWidth / roomSize, 0), 0.5),
          shape: roomShape(borderRadius, roomSize),
          fillColor: cell.fillColor ?? ROOM_DEFAULTS.fillColor,
          borderColor: cell.borderColor ?? ROOM_DEFAULTS.borderColor,
        });
      }
    }
  });
  return out;
}

// Rim/corona border: fill in the center, blending to border color toward the
// silhouette (where the surface normal turns away from the camera). A real
// sphere looks the same from every angle, so no billboarding is needed.
// Position/scale/colors ride on per-instance attributes so all rooms draw in
// one call. uBorderStart/uBorderPower tune where the border ring sits and how
// sharp it is — adjust to taste against the old ring-around-a-disc look.
const roomVertexShader = /* glsl */`
  attribute vec3 instanceOffset;
  attribute float instanceRadius;
  attribute float instanceBorderFrac;
  attribute vec3 instanceFill;
  attribute vec3 instanceBorder;
  varying vec3 vFill;
  varying vec3 vBorder;
  varying float vBorderFrac;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vFill = instanceFill;
    vBorder = instanceBorder;
    vBorderFrac = instanceBorderFrac;
    vec3 local = position * instanceRadius + instanceOffset;
    vec4 mvPosition = modelViewMatrix * vec4(local, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// facing = how head-on the surface is (1 center, 0 silhouette). The projected
// radial position on the disc is r = sqrt(1 - facing^2) (0 center → 1 edge), so
// the border is simply the outer `borderFrac` of the radius — a real ring, not
// a silhouette sliver.
const roomFragmentShader = /* glsl */`
  uniform float uBorderScale;
  varying vec3 vFill;
  varying vec3 vBorder;
  varying float vBorderFrac;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    float facing = abs(dot(normalize(vNormalV), normalize(vViewDir)));
    float r = sqrt(max(0.0, 1.0 - facing * facing));
    float edge = 1.0 - clamp(vBorderFrac * uBorderScale, 0.0, 1.0);
    float aa = fwidth(r) + 0.001;
    float t = smoothstep(edge - aa, edge + aa, r);
    gl_FragColor = vec4(mix(vFill, vBorder, t), 1.0);
    #include <colorspace_fragment>
  }
`;

// Base geometry per shape bucket, sized so its half-extent is 1 (the vertex
// shader scales by instanceRadius). Sphere radius 1; box/rounded-box span 2.
// The rim shader keys off each geometry's own normals, so a cube shows its
// border on the faces angled away from the camera and a sphere all around.
function makeBaseGeometry(shape) {
  switch (shape) {
    case 'cube':    return new THREE.BoxGeometry(2, 2, 2);
    case 'rounded': return new RoundedBoxGeometry(2, 2, 2, 4, 0.5);
    default:        return new THREE.SphereGeometry(1, 24, 16);
  }
}

function RoomInstances({ instances, shape = 'sphere' }) {
  const geometry = useMemo(() => {
    const base = makeBaseGeometry(shape);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('normal', base.attributes.normal);

    const n = instances.length;
    const offsets = new Float32Array(n * 3);
    const radii = new Float32Array(n);
    const borderFracs = new Float32Array(n);
    const fills = new Float32Array(n * 3);
    const borders = new Float32Array(n * 3);
    const c = new THREE.Color();
    instances.forEach((r, i) => {
      offsets.set(r.position, i * 3);
      radii[i] = r.radius;
      borderFracs[i] = r.borderFrac;
      c.set(r.fillColor); fills[i * 3] = c.r; fills[i * 3 + 1] = c.g; fills[i * 3 + 2] = c.b;
      c.set(r.borderColor); borders[i * 3] = c.r; borders[i * 3 + 1] = c.g; borders[i * 3 + 2] = c.b;
    });
    geo.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(offsets, 3));
    geo.setAttribute('instanceRadius', new THREE.InstancedBufferAttribute(radii, 1));
    geo.setAttribute('instanceBorderFrac', new THREE.InstancedBufferAttribute(borderFracs, 1));
    geo.setAttribute('instanceFill', new THREE.InstancedBufferAttribute(fills, 3));
    geo.setAttribute('instanceBorder', new THREE.InstancedBufferAttribute(borders, 3));
    geo.instanceCount = n;
    return geo;
    // ponytail: leaks the prior geometry's GPU buffers when `instances` changes
    // (rare — only on map edits). Dispose in a useEffect cleanup if it bites.
  }, [instances, shape]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: roomVertexShader,
    fragmentShader: roomFragmentShader,
    // uBorderScale multiplies every room's border width at once — bump it up to
    // exaggerate the ring, drop below 1 to thin it. 1.0 matches the 2D ratio.
    uniforms: {
      uBorderScale: { value: 1.0 },
    },
  }), []);

  if (instances.length === 0) return null;
  // frustumCulled off: the shared unit-sphere geometry has no per-instance
  // bounds, so three would cull the whole batch when the origin leaves view.
  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

// --- Room label (billboarded so text faces the camera) ---
// drei <Text> loads a font from a remote CDN and suspends while it does; its own
// Suspense boundary keeps that suspension local so a slow font can't collapse
// the whole canvas.
function RoomLabel({ gridX, gridY, layerY = 0, roomData, cellSize, labelColor = '#222222' }) {
  const roomSize = roomData.roomSize ?? ROOM_DEFAULTS.roomSize;
  return (
    <Billboard position={[gridX * cellSize, layerY, gridY * cellSize]}>
      <Suspense fallback={null}>
        <Text
          position={[0, 0, roomSize / 2 + 0.5]}
          fontSize={roomSize * 0.32}
          color={labelColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={roomSize}
        >
          {roomData.text}
        </Text>
      </Suspense>
    </Billboard>
  );
}

// --- Exit segments ---

// Layers are spaced (and up/down exits reach) this multiple of a cardinal step,
// so vertical connections read taller than N/E/S/W. Diagonals are ~1.41x.
const VERTICAL_SCALE = 1.2;

const VERTICAL_DIRECTIONS = [
  { dir: 'up',   dLayer: +1 },
  { dir: 'down', dLayer: -1 },
];

// Collect every exit link across all layers into flat {a, b, color} segments.
// Exported + pure so the geometry/bounds logic is unit-testable without WebGL.
// Horizontal links sit 0.5 above the layer; vertical links span to the layer
// above/below — mirrors the old per-line placement exactly.
export function collectExitSegments(mapLayers, cellSize, mapWidth, mapHeight) {
  const out = [];
  if (!Array.isArray(mapLayers)) return out;
  const layerCount = mapLayers.length;

  mapLayers.forEach((layer, layerIndex) => {
    const layerData = layer.data ?? [];
    const layerY = layerIndex * cellSize * VERTICAL_SCALE;
    const Y = layerY + 0.5;

    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        const cell = layerData[x]?.[y];
        if (!cell?.exits) continue;
        const px = x * cellSize;
        const pz = y * cellSize;

        for (const { key: dir, dx, dy } of EXIT_DIRECTIONS) {
          if (!cell.exits[dir]) continue;
          const tx = x + dx;
          const ty = y + dy;
          if (tx < 0 || tx >= mapWidth || ty < 0 || ty >= mapHeight) continue;
          out.push({ a: [px, Y, pz], b: [tx * cellSize, Y, ty * cellSize], color: resolveExitColor(cell, dir) });
        }

        for (const { dir, dLayer } of VERTICAL_DIRECTIONS) {
          if (!cell.exits[dir]) continue;
          const targetLayer = layerIndex + dLayer;
          if (targetLayer < 0 || targetLayer >= layerCount) continue;
          out.push({ a: [px, layerY, pz], b: [px, layerY + dLayer * cellSize * VERTICAL_SCALE, pz], color: resolveExitColor(cell, dir) });
        }
      }
    }
  });
  return out;
}

// Exit-link width in WORLD units (via <Line worldUnits>), so links scale with
// zoom like the rest of the scene instead of staying a fixed pixel width — the
// latter looked absurdly thick at the zoomed-out default view. 4 matches the 2D
// canvas (strokeWidth={4}, also world units) on the shared cellSize.
const EXIT_LINE_WIDTH = 4;

// All exit links in one draw call. drei's <Line segments> renders a single
// LineSegments2 (GPU "fat lines"), so we keep the original 2px width and
// per-link colors while collapsing ~5,300 lines into one object.
function ExitSegments({ segments }) {
  const { points, colors } = useMemo(() => {
    const points = [];
    const colors = [];
    const c = new THREE.Color();
    segments.forEach((s) => {
      c.set(s.color);
      const rgb = [c.r, c.g, c.b];
      points.push(s.a, s.b);
      colors.push(rgb, rgb);
    });
    return { points, colors };
  }, [segments]);

  if (segments.length === 0) return null;
  return <Line points={points} vertexColors={colors} lineWidth={EXIT_LINE_WIDTH} worldUnits segments />;
}

// --- Cell backgrounds ---

// Collect every cell with a background color across all layers into flat tile
// data. Exported + pure so the placement logic is unit-testable without WebGL.
// Tiles sit 0.5 below the room, matching the old per-cell floor plane.
export function collectCellBackgrounds(mapLayers, cellSize) {
  const out = [];
  if (!Array.isArray(mapLayers)) return out;
  mapLayers.forEach((layer, layerIndex) => {
    const layerData = layer.data ?? [];
    const layerY = layerIndex * cellSize * VERTICAL_SCALE;
    for (let x = 0; x < layerData.length; x++) {
      const col = layerData[x];
      if (!col) continue;
      for (let y = 0; y < col.length; y++) {
        const cell = col[y];
        if (!cell?.bg) continue;
        out.push({ position: [x * cellSize, layerY - 0.5, y * cellSize], color: cell.bg });
      }
    }
  });
  return out;
}

// All background tiles in one draw call: a single merged geometry of flat quads
// on the XZ plane, colored per-vertex (same trick as the exit lines).
function CellBackgrounds({ tiles, cellSize }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const h = cellSize / 2;
    const n = tiles.length;
    const positions = new Float32Array(n * 18); // 2 triangles × 3 verts × 3 coords
    const colors = new Float32Array(n * 18);
    const c = new THREE.Color();
    tiles.forEach((t, i) => {
      const [px, py, pz] = t.position;
      // Quad corners flat on XZ; two tris (A,B,C)(A,C,D).
      const verts = [
        px - h, py, pz - h,  px + h, py, pz - h,  px + h, py, pz + h,
        px - h, py, pz - h,  px + h, py, pz + h,  px - h, py, pz + h,
      ];
      positions.set(verts, i * 18);
      c.set(t.color);
      for (let v = 0; v < 6; v++) {
        colors[i * 18 + v * 3] = c.r;
        colors[i * 18 + v * 3 + 1] = c.g;
        colors[i * 18 + v * 3 + 2] = c.b;
      }
    });
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
    // ponytail: leaks prior GPU buffers on data change (rare — map edits only).
  }, [tiles, cellSize]);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }), []);

  if (tiles.length === 0) return null;
  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

// --- Map guides (floor grid / chunk lines / bounds outline) ---

// Cells per chunk — mirrors map-2d-canvas (CHUNK = 10).
const CHUNK = 10;

// Guide lines sit just below the floor tiles so nothing z-fights the rooms.
const GUIDE_Y = -0.6;

// Guide widths in WORLD units (via <Line worldUnits>), so they scale with zoom
// like the rooms and exits. Relative to cellSize to stay proportional.
const GUIDE_BORDER_WIDTH = 0.12;
const GUIDE_GRID_WIDTH = 0.05;
const GUIDE_CHUNK_WIDTH = 0.1;

// Build the floor guide lines for a map. Cells are centered on i*cellSize (3D
// convention), so cell boundaries fall at (i-0.5)*cellSize — this encloses every
// room. Pure + exported for testing. Returns {border, grid, chunk} groups; each
// line is {a:[x,y,z], b:[x,y,z]}. border = the 4 outer edges; chunk = interior
// lines on a CHUNK boundary; grid = every other interior line.
export function collectGuideLines(mapWidth, mapHeight, cellSize, y = GUIDE_Y) {
  const border = [], grid = [], chunk = [];
  if (!mapWidth || !mapHeight) return { border, grid, chunk };
  const b = (k) => (k - 0.5) * cellSize;
  const x0 = b(0), x1 = b(mapWidth), z0 = b(0), z1 = b(mapHeight);

  for (let k = 0; k <= mapWidth; k++) {
    const line = { a: [b(k), y, z0], b: [b(k), y, z1] };
    if (k === 0 || k === mapWidth) border.push(line);
    else if (k % CHUNK === 0) chunk.push(line);
    else grid.push(line);
  }
  for (let k = 0; k <= mapHeight; k++) {
    const line = { a: [x0, y, b(k)], b: [x1, y, b(k)] };
    if (k === 0 || k === mapHeight) border.push(line);
    else if (k % CHUNK === 0) chunk.push(line);
    else grid.push(line);
  }
  return { border, grid, chunk };
}

// One drei fat-line per group (border/grid/chunk), each a single draw call.
// The bounds outline always shows; grid and chunk lines follow the same toggles
// as the 2D canvas. Interior chunk lines double as thin grid lines when only the
// grid is on, matching 2D (chunk boundaries are grid lines, recolored when shown).
function GuideLine({ lines, color, width }) {
  const points = useMemo(() => lines.flatMap((l) => [l.a, l.b]), [lines]);
  if (lines.length === 0) return null;
  return <Line points={points} color={color} lineWidth={width} worldUnits segments />;
}

function MapGuides({ mapWidth, mapHeight, cellSize, showGrid, showChunks, theme }) {
  const { border, grid, chunk } = useMemo(
    () => collectGuideLines(mapWidth, mapHeight, cellSize),
    [mapWidth, mapHeight, cellSize]
  );
  const gridColor = theme?.gridStroke || '#E1E8ED';
  const chunkColor = theme?.chunkStroke || '#9aa5b1';

  // Thin grid pass includes chunk-boundary lines only when chunks aren't drawn
  // thick separately, so the full cell grid always reads.
  const thinGrid = showGrid ? (showChunks ? grid : [...grid, ...chunk]) : [];

  return (
    <group>
      <GuideLine lines={border} color={chunkColor} width={GUIDE_BORDER_WIDTH * cellSize} />
      <GuideLine lines={thinGrid} color={gridColor} width={GUIDE_GRID_WIDTH * cellSize} />
      {showChunks && <GuideLine lines={chunk} color={chunkColor} width={GUIDE_CHUNK_WIDTH * cellSize} />}
    </group>
  );
}

// --- LayerGroup component ---
// Rooms, exits and backgrounds are each drawn in one batch at the scene level
// (see <RoomInstances>, <ExitSegments>, <CellBackgrounds>); LayerGroup only
// places the billboarded text labels, which stay per-room.
function LayerGroup({ layerData, layerIndex, cellSize, mapWidth, mapHeight, labelColor }) {
  const layerY = layerIndex * cellSize * VERTICAL_SCALE;
  const labels = [];

  for (let x = 0; x < mapWidth; x++) {
    for (let y = 0; y < mapHeight; y++) {
      const cell = layerData[x]?.[y];
      if (cell?.enabled && cell.text) {
        labels.push(
          <RoomLabel key={`label-${x}-${y}`} gridX={x} gridY={y} layerY={layerY} roomData={cell} cellSize={cellSize} labelColor={labelColor} />
        );
      }
    }
  }

  return <group>{labels}</group>;
}

// --- MapScene ---

function MapScene({ mapLayers, cellSize, mapWidth, mapHeight, labelColor, showGrid, showChunks, theme }) {
  const roomBuckets = useMemo(() => {
    const all = collectRoomInstances(mapLayers, cellSize);
    return {
      cube: all.filter(r => r.shape === 'cube'),
      rounded: all.filter(r => r.shape === 'rounded'),
      sphere: all.filter(r => r.shape === 'sphere'),
    };
  }, [mapLayers, cellSize]);
  const exitSegments = useMemo(
    () => collectExitSegments(mapLayers, cellSize, mapWidth, mapHeight),
    [mapLayers, cellSize, mapWidth, mapHeight]
  );
  const cellBackgrounds = useMemo(() => collectCellBackgrounds(mapLayers, cellSize), [mapLayers, cellSize]);
  if (!mapLayers || !Array.isArray(mapLayers)) return null;

  return (
    <group>
      <RoomInstances instances={roomBuckets.cube} shape="cube" />
      <RoomInstances instances={roomBuckets.rounded} shape="rounded" />
      <RoomInstances instances={roomBuckets.sphere} shape="sphere" />
      <ExitSegments segments={exitSegments} />
      <CellBackgrounds tiles={cellBackgrounds} cellSize={cellSize} />
      <MapGuides
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        cellSize={cellSize}
        showGrid={showGrid}
        showChunks={showChunks}
        theme={theme}
      />
      {mapLayers.map((layer, layerIndex) => (
        <LayerGroup
          key={layer.id ?? layerIndex}
          layerData={layer.data ?? []}
          layerIndex={layerIndex}
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

export default function Map3DCanvas({ mapLayers, cellSize, mapWidth, mapHeight, theme, showGrid = true, showChunks = false }) {
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
          showGrid={showGrid}
          showChunks={showChunks}
          theme={theme}
        />
      </Canvas>
    </CanvasContainer>
  );
}
