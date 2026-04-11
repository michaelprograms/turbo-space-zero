import './test-setup';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect } from 'vitest';
import MapView from './index';

test('mapWidth and mapHeight are passed to MapControls from DB result', async () => {
  render(<MapView />);
  await screen.findByTestId('map-canvas');
  const sidebar = screen.getByTestId('map-name-input').closest('[data-map-width]');
  // Wait for map dimensions to be synced from DB result
  await waitFor(() => expect(sidebar.dataset.mapWidth).toBe('5'));
  expect(sidebar.dataset.mapHeight).toBe('5');
});

test('handleExtendMap add north increases mapHeight and shifts focusY up by 1', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  const sidebar = screen.getByTestId('map-name-input').closest('[data-map-width]');

  // Wait for focusY to be synced from DB result
  await waitFor(() => expect(canvas.dataset.focusY).toBe('2'));
  const initialFocusY = Number(canvas.dataset.focusY); // 2

  await user.click(screen.getByTestId('extend-add-north'));

  expect(sidebar.dataset.mapHeight).toBe('6');
  expect(Number(canvas.dataset.focusY)).toBe(initialFocusY + 1);
});

test('handleExtendMap remove south decreases mapHeight', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');
  const sidebar = screen.getByTestId('map-name-input').closest('[data-map-width]');

  await user.click(screen.getByTestId('extend-remove-south'));

  expect(sidebar.dataset.mapHeight).toBe('4');
});

test('handleExtendMap add west increases mapWidth and shifts focusX right by 1', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  const sidebar = screen.getByTestId('map-name-input').closest('[data-map-width]');

  // Wait for focusX to be synced from DB result
  await waitFor(() => expect(canvas.dataset.focusX).toBe('2'));
  const initialFocusX = Number(canvas.dataset.focusX); // 2

  await user.click(screen.getByTestId('extend-add-west'));

  expect(sidebar.dataset.mapWidth).toBe('6');
  expect(Number(canvas.dataset.focusX)).toBe(initialFocusX + 1);
});

test('auto-scrolls canvas when keyboard navigation moves focus outside visible area', async () => {
  const scrollToMock = vi.fn();
  const originalScrollTo = HTMLElement.prototype.scrollTo;
  HTMLElement.prototype.scrollTo = scrollToMock;

  const user = userEvent.setup();
  render(<MapView />);

  const canvas = await screen.findByTestId('map-canvas');
  // jsdom doesn't compute layout; set small viewport so the focus cell is outside it
  Object.defineProperty(canvas, 'clientWidth', { configurable: true, value: 80 });
  Object.defineProperty(canvas, 'clientHeight', { configurable: true, value: 80 });

  // Clear scroll calls from the initial mount effect
  scrollToMock.mockClear();

  // Initial focus is (2,2). Move right → (3,2). Cell right edge (3*40+40+40=200) > clientWidth (80).
  await user.keyboard('{ArrowRight}');

  expect(scrollToMock).toHaveBeenCalledWith(
    expect.objectContaining({ behavior: 'smooth' })
  );

  HTMLElement.prototype.scrollTo = originalScrollTo;
});
