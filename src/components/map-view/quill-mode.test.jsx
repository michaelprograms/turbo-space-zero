import './test-setup';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect } from 'vitest';
import MapView from './index';

test('pressing q shows the QUILL mode badge', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');

  expect(screen.queryByText('✦ QUILL')).not.toBeInTheDocument();

  await user.keyboard('q');

  expect(screen.getByText('✦ QUILL')).toBeInTheDocument();
});

test('pressing q twice hides the QUILL mode badge', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');

  await user.keyboard('q');
  expect(screen.getByText('✦ QUILL')).toBeInTheDocument();

  await user.keyboard('q');
  expect(screen.queryByText('✦ QUILL')).not.toBeInTheDocument();
});

test('entering Quill Mode enables the current focus room', async () => {
  const user = userEvent.setup();
  render(<MapView />);

  const canvas = await screen.findByTestId('map-canvas');
  // Wait for focus coords to be synced from DB result
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const x = Number(canvas.dataset.focusX);
  const y = Number(canvas.dataset.focusY);

  let mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[x][y].enabled).toBeFalsy();

  await user.keyboard('q');

  mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[x][y].enabled).toBe(true);
});

test('in Quill Mode, pressing 8 (north) creates north exit on origin and south exit on destination', async () => {
  const user = userEvent.setup();
  render(<MapView />);

  const canvas = await screen.findByTestId('map-canvas');
  // Wait for focus coords to be synced from DB result
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const originX = Number(canvas.dataset.focusX); // 2
  const originY = Number(canvas.dataset.focusY); // 2

  // Enter Quill Mode
  await user.keyboard('q');
  // Move north (8)
  await user.keyboard('8');

  const mapData = JSON.parse(canvas.dataset.mapData);
  // Focus moved north (Y decreases)
  expect(Number(canvas.dataset.focusY)).toBe(originY - 1);
  // Origin room enabled + north exit
  expect(mapData[originX][originY].enabled).toBe(true);
  expect(mapData[originX][originY].exits?.north).toBe(true);
  // Destination room enabled + south exit (return path)
  expect(mapData[originX][originY - 1].enabled).toBe(true);
  expect(mapData[originX][originY - 1].exits?.south).toBe(true);
});

test('in normal mode, pressing 8 only moves focus — no rooms or exits created', async () => {
  const user = userEvent.setup();
  render(<MapView />);

  const canvas = await screen.findByTestId('map-canvas');
  // Wait for focus coords to be synced from DB result
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const originX = Number(canvas.dataset.focusX); // 2
  const originY = Number(canvas.dataset.focusY); // 2

  await user.keyboard('8');

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(Number(canvas.dataset.focusY)).toBe(originY - 1);
  expect(mapData[originX][originY].enabled).toBeFalsy();
  expect(mapData[originX][originY].exits?.north).toBeFalsy();
});

test('QuillDock appears when Quill Mode is active', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');

  expect(screen.queryByRole('button', { name: '↑' })).not.toBeInTheDocument();

  await user.keyboard('q');

  expect(screen.getByRole('button', { name: '↑' })).toBeInTheDocument();
});

test('in quill mode, navigating north at y=0 extends the map and moves to new top row', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  const sidebar = screen.getByTestId('map-name-input').closest('[data-map-width]');

  // Navigate to y=0 (two presses north from y=2)
  await user.keyboard('8');
  await user.keyboard('8');
  expect(canvas.dataset.focusY).toBe('0');

  // Enter quill mode
  await user.keyboard('q');

  // Navigate north — should extend the map
  await user.keyboard('8');

  // Map height grew from 5 to 6
  expect(sidebar.dataset.mapHeight).toBe('6');
  // Focus landed at y=0 (the new top row)
  expect(canvas.dataset.focusY).toBe('0');

  const mapData = JSON.parse(canvas.dataset.mapData);
  // The old origin room (now at y=1) has north exit
  expect(mapData[2][1].exits?.north).toBe(true);
  // The new room at y=0 has south exit
  expect(mapData[2][0].exits?.south).toBe(true);
  expect(mapData[2][0].enabled).toBe(true);
});

test('in quill mode, navigating east at the right edge extends the map', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  const sidebar = screen.getByTestId('map-name-input').closest('[data-map-width]');

  // Navigate to x=4 (right edge): two presses east from x=2
  await user.keyboard('6');
  await user.keyboard('6');
  expect(canvas.dataset.focusX).toBe('4');

  await user.keyboard('q');
  await user.keyboard('6');

  expect(sidebar.dataset.mapWidth).toBe('6');
  expect(canvas.dataset.focusX).toBe('5');

  const mapData = JSON.parse(canvas.dataset.mapData);
  expect(mapData[4][2].exits?.east).toBe(true);
  expect(mapData[5][2].exits?.west).toBe(true);
});

test('in normal mode, navigating north at y=0 does not extend the map', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  const sidebar = screen.getByTestId('map-name-input').closest('[data-map-width]');

  await user.keyboard('8');
  await user.keyboard('8');
  expect(canvas.dataset.focusY).toBe('0');

  // No quill mode — plain navigate at edge should be blocked
  await user.keyboard('8');

  expect(canvas.dataset.focusY).toBe('0');
  expect(sidebar.dataset.mapHeight).toBe('5');
});
