import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import MapSectionContent from './MapSectionContent';

const CREATED_TS = 1748995200000;
const EDITED_TS  = 1749081600000;

const defaultProps = {
  mapName: 'Test Map',
  onMapNameCommit: vi.fn(),
  mapCreated: CREATED_TS,
  mapEdited: EDITED_TS,
  roomCountActive: 3,
  roomCountTotal: 10,
  mapKbSize: '1.4',
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

test('renders room count with active and total', () => {
  render(<MapSectionContent {...defaultProps} roomCountActive={3} roomCountTotal={10} />);
  expect(screen.getByText(/3 active · 10 total/i)).toBeInTheDocument();
});

test('renders size as width × height with kb estimate', () => {
  render(<MapSectionContent {...defaultProps} mapWidth={15} mapHeight={20} mapKbSize="2.3" />);
  expect(screen.getByText(/15 × 20 · ~2\.3 kb/i)).toBeInTheDocument();
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
