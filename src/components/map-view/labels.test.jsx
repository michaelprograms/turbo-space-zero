import './test-setup';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect } from 'vitest';
import MapView from './index';
import { updateMap } from '../../data';

test('editing a room label re-enables hidden room labels', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  await screen.findByTestId('map-canvas');
  const controls = screen.getByTestId('map-name-input').closest('[data-show-labels]');
  expect(controls.dataset.showLabels).toBe('true');

  await user.click(screen.getByTestId('toggle-labels'));
  expect(controls.dataset.showLabels).toBe('false');
  expect(updateMap).toHaveBeenLastCalledWith('test-map-id', { showLabels: false });

  await user.click(screen.getByTestId('set-room-text'));
  expect(controls.dataset.showLabels).toBe('true');
  expect(updateMap).toHaveBeenLastCalledWith('test-map-id', { showLabels: true });
});
