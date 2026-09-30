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

test('clearing labels empties every selected room and leaves the rest', async () => {
  const user = userEvent.setup();
  render(<MapView />);
  const canvas = await screen.findByTestId('map-canvas');
  const textAt = (x, y) => JSON.parse(canvas.dataset.mapData)[x][y]?.text;
  const labelAt = async (cell) => {
    await user.click(screen.getByTestId(cell));
    await user.click(screen.getByTestId('set-room-text'));
  };

  await user.click(screen.getByTestId('set-room-text')); // starting focus 2,2
  await labelAt('cell-1-1');
  await labelAt('cell-0-0'); // focus stays on 0,0
  await user.keyboard('[ControlLeft>]');
  await user.click(screen.getByTestId('cell-1-1'));
  await user.keyboard('[/ControlLeft]');

  await user.click(screen.getByTestId('clear-labels'));
  expect(textAt(0, 0)).toBeUndefined();
  expect(textAt(1, 1)).toBeUndefined();
  expect(textAt(2, 2)).toBe('Hall');
});
