import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import OpenMapDialog from './OpenMapDialog';

const { mockNavigateToMap } = vi.hoisted(() => ({
  mockNavigateToMap: vi.fn(),
}));

vi.mock('../../context', () => ({
  useAppContext: () => ({ navigateToMap: mockNavigateToMap, activeMapId: 'map-2' }),
}));

vi.mock('../../data/index.js', () => ({
  getMaps: vi.fn().mockResolvedValue([
    { id: 'map-1', name: 'Forest Map', width: 10, height: 10 },
    { id: 'map-2', name: 'Cave Map', width: 5, height: 5 },
  ]),
  deleteMap: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => vi.clearAllMocks());

test('renders map list', async () => {
  render(<OpenMapDialog onClose={vi.fn()} theme={null} />);
  expect(await screen.findByText('Forest Map, 10×10')).toBeInTheDocument();
  expect(screen.getByText('Cave Map, 5×5')).toBeInTheDocument();
});

test('clicking a map calls navigateToMap and onClose', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<OpenMapDialog onClose={onClose} theme={null} />);
  await user.click(await screen.findByText('Forest Map, 10×10'));
  expect(mockNavigateToMap).toHaveBeenCalledWith('map-1');
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('shows empty message when no maps', async () => {
  const { getMaps } = await import('../../data/index.js');
  getMaps.mockResolvedValue([]);
  render(<OpenMapDialog onClose={vi.fn()} theme={null} />);
  expect(await screen.findByText('No saved maps found.')).toBeInTheDocument();
});

const MAPS = [
  { id: 'map-1', name: 'Forest Map', width: 10, height: 10 },
  { id: 'map-2', name: 'Cave Map', width: 5, height: 5 },
];

test('deleting a map confirms, calls deleteMap, and removes the row', async () => {
  const { getMaps, deleteMap } = await import('../../data/index.js');
  getMaps.mockResolvedValue(MAPS);
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<OpenMapDialog onClose={vi.fn()} theme={null} />);
  await user.click(await screen.findByRole('button', { name: 'Delete Forest Map' }));
  expect(window.confirm).toHaveBeenCalled();
  expect(deleteMap).toHaveBeenCalledWith('map-1');
  expect(screen.queryByText('Forest Map, 10×10')).not.toBeInTheDocument();
});

test('cannot delete the currently open map', async () => {
  const { getMaps } = await import('../../data/index.js');
  getMaps.mockResolvedValue(MAPS);
  render(<OpenMapDialog onClose={vi.fn()} theme={null} />);
  expect(await screen.findByRole('button', { name: 'Delete Cave Map' })).toBeDisabled();
});
