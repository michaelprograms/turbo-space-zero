import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import MapControls from './index';

vi.mock('../menu-bar', () => ({
  default: () => <div data-testid="menu-bar" />,
}));

vi.mock('./CollapsibleSection', () => ({
  default: ({ title, defaultOpen, storageKey, children }) => (
    <div
      data-testid={`collapsible-${storageKey}`}
      data-title={title}
      data-default-open={String(defaultOpen)}
    >
      {children}
    </div>
  ),
}));

vi.mock('./MapSectionContent', () => ({
  default: (props) => (
    <div
      data-testid="map-section-content"
      data-map-name={props.mapName}
      data-room-count-active={props.roomCountActive}
    />
  ),
}));

vi.mock('./RoomSectionContent', () => ({
  default: (props) => (
    <div
      data-testid="room-section-content"
      data-room-text={props.room?.text ?? ''}
    />
  ),
}));

vi.mock('./LayerSectionContent', () => ({
  default: (props) => (
    <div
      data-testid="layer-section-content"
      data-focus-layer={props.focusLayer}
    />
  ),
}));

const defaultProps = {
  mapData: [],
  focusX: 0,
  focusY: 0,
  handleControlRoomValue: vi.fn(),
  handleControlRoomToggle: vi.fn(),
  showGrid: true,
  onToggleGrid: vi.fn(),
  darkMode: true,
  onToggleDarkMode: vi.fn(),
  cellSize: 40,
  onCellSizeChange: vi.fn(),
  mapName: 'Test Map',
  onMapNameCommit: vi.fn(),
  mapCreated: 1748995200000,
  mapEdited: 1749081600000,
  roomCountActive: 0,
  roomCountTotal: 0,
  mapKbSize: '0.0',
  onExport: vi.fn(),
  mapWidth: 25,
  mapHeight: 20,
  maxMapSize: 100,
  onExtendMap: vi.fn(),
};

// ── Structural tests ──────────────────────────────────────────────────────────

test('renders MenuBar at the top of the sidebar', () => {
  render(<MapControls {...defaultProps} />);
  expect(screen.getByTestId('menu-bar')).toBeInTheDocument();
});

test('renders three CollapsibleSection wrappers', () => {
  render(<MapControls {...defaultProps} />);
  expect(screen.getByTestId('collapsible-sidebar.map')).toBeInTheDocument();
  expect(screen.getByTestId('collapsible-sidebar.room')).toBeInTheDocument();
  expect(screen.getByTestId('collapsible-sidebar.layers')).toBeInTheDocument();
});

test('Map CollapsibleSection has defaultOpen=true', () => {
  render(<MapControls {...defaultProps} />);
  expect(screen.getByTestId('collapsible-sidebar.map')).toHaveAttribute('data-default-open', 'true');
});

test('Room CollapsibleSection has defaultOpen=false', () => {
  render(<MapControls {...defaultProps} />);
  expect(screen.getByTestId('collapsible-sidebar.room')).toHaveAttribute('data-default-open', 'false');
});

test('Layers CollapsibleSection has defaultOpen=false', () => {
  render(<MapControls {...defaultProps} />);
  expect(screen.getByTestId('collapsible-sidebar.layers')).toHaveAttribute('data-default-open', 'false');
});

test('Map CollapsibleSection title is "Map"', () => {
  render(<MapControls {...defaultProps} />);
  expect(screen.getByTestId('collapsible-sidebar.map')).toHaveAttribute('data-title', 'Map');
});

test('Room CollapsibleSection title contains "Room"', () => {
  render(<MapControls {...defaultProps} />);
  expect(screen.getByTestId('collapsible-sidebar.room').dataset.title).toMatch(/Room/i);
});

test('Layers CollapsibleSection title contains "Layer"', () => {
  render(<MapControls {...defaultProps} />);
  expect(screen.getByTestId('collapsible-sidebar.layers').dataset.title).toMatch(/Layer/i);
});

// ── Sub-component rendering ───────────────────────────────────────────────────

test('renders MapSectionContent inside Map section', () => {
  render(<MapControls {...defaultProps} />);
  const mapSection = screen.getByTestId('collapsible-sidebar.map');
  expect(mapSection.querySelector('[data-testid="map-section-content"]')).toBeTruthy();
});

test('renders RoomSectionContent inside Room section', () => {
  render(<MapControls {...defaultProps} />);
  const roomSection = screen.getByTestId('collapsible-sidebar.room');
  expect(roomSection.querySelector('[data-testid="room-section-content"]')).toBeTruthy();
});

test('renders LayerSectionContent inside Layers section', () => {
  render(<MapControls {...defaultProps} />);
  const layersSection = screen.getByTestId('collapsible-sidebar.layers');
  expect(layersSection.querySelector('[data-testid="layer-section-content"]')).toBeTruthy();
});

// ── Prop delegation: room derivation ─────────────────────────────────────────

test('derives room from mapData[focusX][focusY] and passes it to RoomSectionContent', () => {
  const mapData = [[{ text: 'Tavern', enabled: true }]];
  render(<MapControls {...defaultProps} mapData={mapData} focusX={0} focusY={0} />);
  expect(screen.getByTestId('room-section-content')).toHaveAttribute('data-room-text', 'Tavern');
});

test('passes empty room object to RoomSectionContent when mapData has no entry at focusX/focusY', () => {
  render(<MapControls {...defaultProps} mapData={[]} focusX={0} focusY={0} />);
  expect(screen.getByTestId('room-section-content')).toHaveAttribute('data-room-text', '');
});

test('passes mapName to MapSectionContent', () => {
  render(<MapControls {...defaultProps} mapName="Adventure Map" />);
  expect(screen.getByTestId('map-section-content')).toHaveAttribute('data-map-name', 'Adventure Map');
});

test('passes focusLayer to LayerSectionContent', () => {
  render(<MapControls {...defaultProps} focusLayer={2} />);
  expect(screen.getByTestId('layer-section-content')).toHaveAttribute('data-focus-layer', '2');
});

test('passes roomCountActive to MapSectionContent', () => {
  render(<MapControls {...defaultProps} roomCountActive={7} />);
  expect(screen.getByTestId('map-section-content')).toHaveAttribute('data-room-count-active', '7');
});
