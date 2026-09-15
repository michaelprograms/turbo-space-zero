import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect } from 'vitest';
import MapCanvasTiling from './index';

// Mock Map2DCanvas since it depends on Konva
vi.mock('../map-2d-canvas', () => ({
  default: (props) => (
    <div
      data-testid={`canvas-layer-${props.layerIndex ?? props.focusLayer}`}
      data-layer-index={props.layerIndex ?? props.focusLayer}
      data-disable-ghosts={props.disableGhosts ? 'true' : 'false'}
      onClick={() => props.onCellClick?.(0, 0, {})}
    />
  ),
}));

const layers = [
  { id: 'a', name: 'Ground', data: [[{}]] },
  { id: 'b', name: 'Buildings', data: [[{}]] },
  { id: 'c', name: 'Sky', data: [[{}]] },
];

const defaultProps = {
  layers,
  focusLayer: 0,
  focusX: 0,
  focusY: 0,
  onCellClick: vi.fn(),
  onLayerChange: vi.fn(),
  cellSize: 40,
  showGrid: true,
  darkMode: false,
  theme: {},
  selectedCells: new Set(),
};

test('single mode renders one Map2DCanvas without tiling grid', () => {
  render(<MapCanvasTiling {...defaultProps} tilingMode="single" />);
  expect(screen.getByTestId('canvas-layer-0')).toBeInTheDocument();
  expect(screen.queryByText('Ground')).not.toBeInTheDocument();
});

test('column mode renders all layers with tile labels', () => {
  render(<MapCanvasTiling {...defaultProps} tilingMode="column" />);
  expect(screen.getByText('Ground')).toBeInTheDocument();
  expect(screen.getByText('Buildings')).toBeInTheDocument();
  expect(screen.getByText('Sky')).toBeInTheDocument();
});

test('row mode renders all layers', () => {
  render(<MapCanvasTiling {...defaultProps} tilingMode="row" />);
  expect(screen.getAllByTestId(/canvas-layer-/)).toHaveLength(3);
});

test('grid mode renders all layers', () => {
  render(<MapCanvasTiling {...defaultProps} tilingMode="grid" />);
  expect(screen.getAllByTestId(/canvas-layer-/)).toHaveLength(3);
});

test('tiled canvases have disableGhosts=true', () => {
  render(<MapCanvasTiling {...defaultProps} tilingMode="column" />);
  const canvases = screen.getAllByTestId(/canvas-layer-/);
  canvases.forEach(canvas => {
    expect(canvas).toHaveAttribute('data-disable-ghosts', 'true');
  });
});

test('clicking a non-focused tile calls onLayerChange then onCellClick', async () => {
  const user = userEvent.setup();
  const onLayerChange = vi.fn();
  const onCellClick = vi.fn();
  render(
    <MapCanvasTiling
      {...defaultProps}
      tilingMode="column"
      focusLayer={0}
      onLayerChange={onLayerChange}
      onCellClick={onCellClick}
    />
  );
  await user.click(screen.getByTestId('canvas-layer-2'));
  expect(onLayerChange).toHaveBeenCalledWith(2);
  expect(onCellClick).toHaveBeenCalledWith(0, 0, {});
});

test('clicking the focused tile does not call onLayerChange', async () => {
  const user = userEvent.setup();
  const onLayerChange = vi.fn();
  const onCellClick = vi.fn();
  render(
    <MapCanvasTiling
      {...defaultProps}
      tilingMode="column"
      focusLayer={0}
      onLayerChange={onLayerChange}
      onCellClick={onCellClick}
    />
  );
  await user.click(screen.getByTestId('canvas-layer-0'));
  expect(onLayerChange).not.toHaveBeenCalled();
  expect(onCellClick).toHaveBeenCalled();
});
