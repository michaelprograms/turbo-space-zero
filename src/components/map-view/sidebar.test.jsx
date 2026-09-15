import './test-setup';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect } from 'vitest';
import MapView from './index';

test('hamburger button is in the document', async () => {
  render(<MapView />);
  await screen.findByTestId('map-canvas');
  expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
});

test('clicking hamburger button renders the drawer backdrop', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');

  expect(screen.queryByTestId('drawer-backdrop')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /menu/i }));

  expect(screen.getByTestId('drawer-backdrop')).toBeInTheDocument();
});

test('clicking the backdrop closes the drawer', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');

  await user.click(screen.getByRole('button', { name: /menu/i }));
  expect(screen.getByTestId('drawer-backdrop')).toBeInTheDocument();

  await user.click(screen.getByTestId('drawer-backdrop'));
  expect(screen.queryByTestId('drawer-backdrop')).not.toBeInTheDocument();
});

test('sidebarOpen prop is passed to MapControls when drawer opens', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');

  const controls = screen.getByTestId('map-name-input').closest('[data-sidebar-open]');
  expect(controls.dataset.sidebarOpen).toBe('false');

  await user.click(screen.getByRole('button', { name: /menu/i }));

  expect(controls.dataset.sidebarOpen).toBe('true');
});
