import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import MapSectionContent from './MapSectionContent';
import { estimateMapKbSize } from '../map-view/utils';

const CREATED_TS = 1748995200000;
const EDITED_TS  = 1749081600000;

const defaultProps = {
  mapName: 'Test Map',
  onMapNameCommit: vi.fn(),
  mapCreated: CREATED_TS,
  mapEdited: EDITED_TS,
  layers: [],
  mapWidth: 10,
  mapHeight: 10,
  maxMapSize: 100,
  onExtendMap: vi.fn(),
  theme: {},
};

// ── Map name rename ───────────────────────────────────────────────────────────

test('renders map name as text, not an input, by default', () => {
  render(<MapSectionContent {...defaultProps} />);
  expect(screen.getByText('Test Map')).toBeInTheDocument();
  expect(screen.queryByDisplayValue('Test Map')).not.toBeInTheDocument();
});

test('renders a rename button', () => {
  render(<MapSectionContent {...defaultProps} />);
  expect(screen.getByRole('button', { name: /rename/i })).toBeInTheDocument();
});

test('clicking rename button shows an input pre-filled with the current name', async () => {
  const user = userEvent.setup();
  render(<MapSectionContent {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: /rename/i }));
  expect(screen.getByDisplayValue('Test Map')).toBeInTheDocument();
});

test('pressing Enter commits the new name via onMapNameCommit', async () => {
  const user = userEvent.setup();
  const onMapNameCommit = vi.fn();
  render(<MapSectionContent {...defaultProps} onMapNameCommit={onMapNameCommit} />);
  await user.click(screen.getByRole('button', { name: /rename/i }));
  const input = screen.getByDisplayValue('Test Map');
  await user.clear(input);
  await user.type(input, 'New Name');
  await user.keyboard('{Enter}');
  expect(onMapNameCommit).toHaveBeenCalledWith('New Name');
});

test('pressing Escape cancels without calling onMapNameCommit', async () => {
  const user = userEvent.setup();
  const onMapNameCommit = vi.fn();
  render(<MapSectionContent {...defaultProps} onMapNameCommit={onMapNameCommit} />);
  await user.click(screen.getByRole('button', { name: /rename/i }));
  const input = screen.getByDisplayValue('Test Map');
  await user.clear(input);
  await user.type(input, 'Oops');
  await user.keyboard('{Escape}');
  expect(onMapNameCommit).not.toHaveBeenCalled();
  expect(screen.getByText('Test Map')).toBeInTheDocument();
});

test('blurring the rename input cancels without calling onMapNameCommit', async () => {
  const user = userEvent.setup();
  const onMapNameCommit = vi.fn();
  render(<MapSectionContent {...defaultProps} onMapNameCommit={onMapNameCommit} />);
  await user.click(screen.getByRole('button', { name: /rename/i }));
  await user.keyboard('{Tab}');
  expect(onMapNameCommit).not.toHaveBeenCalled();
  expect(screen.getByText('Test Map')).toBeInTheDocument();
});

// ── Metadata ─────────────────────────────────────────────────────────────────

test('renders a "Created" label', () => {
  render(<MapSectionContent {...defaultProps} />);
  expect(screen.getByText(/^created$/i)).toBeInTheDocument();
});

test('renders a formatted created date', () => {
  render(<MapSectionContent {...defaultProps} mapCreated={CREATED_TS} />);
  const formatted = new Date(CREATED_TS).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  expect(screen.getByText(formatted)).toBeInTheDocument();
});

test('counts rooms, links and backgrounds for the active layer and all layers', () => {
  const active = [[{ enabled: true, exits: { east: true } }, { bg: '#111111' }], [{ enabled: true, exits: { west: true } }, {}]];
  const other = [[{ enabled: true, bg: '#222222' }]];
  render(<MapSectionContent {...defaultProps} mapData={active} layers={[{ data: active }, { data: other }]} />);
  expect(screen.getByText('2 active · 3 total')).toBeInTheDocument(); // rooms
  expect(screen.getByText('2 active · 2 total')).toBeInTheDocument(); // exit links
  expect(screen.getByText('1 active · 2 total')).toBeInTheDocument(); // backgrounds
});

// A layer whose serialized size is clearly bigger than an empty one.
const bigLayers = [{ name: 'L', data: Array.from({ length: 30 }, () =>
  Array.from({ length: 30 }, () => ({ enabled: true, text: 'A long room label', bg: '#123456' }))) }];

test('renders size as width × height with kb estimate', () => {
  render(<MapSectionContent {...defaultProps} mapWidth={15} mapHeight={20} layers={bigLayers} />);
  expect(screen.getByText(`15 × 20 · ~${estimateMapKbSize(bigLayers)} kb`)).toBeInTheDocument();
});

test('kb estimate waits for edits to pause before re-measuring', () => {
  vi.useFakeTimers();
  try {
    const { rerender } = render(<MapSectionContent {...defaultProps} layers={[]} />);
    const empty = `~${estimateMapKbSize([])} kb`;
    expect(screen.getByText(new RegExp(empty))).toBeInTheDocument();

    rerender(<MapSectionContent {...defaultProps} layers={bigLayers} />);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getByText(new RegExp(empty))).toBeInTheDocument(); // not yet

    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByText(new RegExp(`~${estimateMapKbSize(bigLayers)} kb`))).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

// ── Resize section ────────────────────────────────────────────────────────────

test('renders "Resize Map" label', () => {
  render(<MapSectionContent {...defaultProps} />);
  expect(screen.getByText(/resize map/i)).toBeInTheDocument();
});

test('renders Add and Remove mode buttons', () => {
  render(<MapSectionContent {...defaultProps} />);
  expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^remove$/i })).toBeInTheDocument();
});

test('edge grid has 8 direction buttons and no center button', () => {
  render(<MapSectionContent {...defaultProps} />);
  const grid = screen.getByTestId('edge-grid');
  const buttons = grid.querySelectorAll('button');
  expect(buttons).toHaveLength(8);
});

test('clicking north in Add mode calls onExtendMap("north", "add")', async () => {
  const user = userEvent.setup();
  const onExtendMap = vi.fn();
  render(<MapSectionContent {...defaultProps} onExtendMap={onExtendMap} />);
  await user.click(screen.getByRole('button', { name: '↑' }));
  expect(onExtendMap).toHaveBeenCalledWith('north', 'add');
});

test('switching to Remove mode then clicking north calls onExtendMap("north", "remove")', async () => {
  const user = userEvent.setup();
  const onExtendMap = vi.fn();
  render(<MapSectionContent {...defaultProps} onExtendMap={onExtendMap} />);
  await user.click(screen.getByRole('button', { name: /^remove$/i }));
  await user.click(screen.getByRole('button', { name: '↑' }));
  expect(onExtendMap).toHaveBeenCalledWith('north', 'remove');
});

test('north button is disabled when Add mode and mapHeight >= maxMapSize', () => {
  render(<MapSectionContent {...defaultProps} mapHeight={100} maxMapSize={100} />);
  expect(screen.getByRole('button', { name: '↑' })).toBeDisabled();
});

test('east button is disabled when Add mode and mapWidth >= maxMapSize', () => {
  render(<MapSectionContent {...defaultProps} mapWidth={100} maxMapSize={100} />);
  expect(screen.getByRole('button', { name: '→' })).toBeDisabled();
});

test('north button is disabled when Remove mode and mapHeight <= 1', async () => {
  const user = userEvent.setup();
  render(<MapSectionContent {...defaultProps} mapHeight={1} />);
  await user.click(screen.getByRole('button', { name: /^remove$/i }));
  expect(screen.getByRole('button', { name: '↑' })).toBeDisabled();
});

test('east button is disabled when Remove mode and mapWidth <= 1', async () => {
  const user = userEvent.setup();
  render(<MapSectionContent {...defaultProps} mapWidth={1} />);
  await user.click(screen.getByRole('button', { name: /^remove$/i }));
  expect(screen.getByRole('button', { name: '→' })).toBeDisabled();
});

// ── Removed controls ─────────────────────────────────────────────────────────

test('does not render a grid toggle', () => {
  render(<MapSectionContent {...defaultProps} />);
  expect(screen.queryByRole('switch', { name: /grid/i })).not.toBeInTheDocument();
});

test('does not render a dark mode toggle', () => {
  render(<MapSectionContent {...defaultProps} />);
  expect(screen.queryByRole('switch', { name: /dark mode/i })).not.toBeInTheDocument();
});

test('does not render a cell size slider', () => {
  render(<MapSectionContent {...defaultProps} />);
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
});
