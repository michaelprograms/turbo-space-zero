import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect } from 'vitest';
import LayerSectionContent from './LayerSectionContent';

const defaultProps = {
  layers: [{ id: 'a', name: 'Layer 1' }, { id: 'b', name: 'Layer 2' }, { id: 'c', name: 'Layer 3' }],
  focusLayer: 1,
  defaultLayer: 0,
  onLayerChange: vi.fn(),
  onLayerAdd: vi.fn(),
  onLayerDelete: vi.fn(),
  onLayerRename: vi.fn(),
  onLayerReorder: vi.fn(),
  onDefaultLayerChange: vi.fn(),
  tilingMode: 'single',
  onTilingModeChange: vi.fn(),
  theme: {},
};

test('nav strip shows active layer name and position', () => {
  render(<LayerSectionContent {...defaultProps} />);
  expect(screen.getAllByText('Layer 2').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText(/2\s*\/\s*3/)).toBeInTheDocument();
});

test('layer list renders all layers with dot indicators', () => {
  render(<LayerSectionContent {...defaultProps} />);
  expect(screen.getAllByText('●').length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText('○').length).toBeGreaterThanOrEqual(1);
});

test('clicking a list row calls onLayerChange with its index', async () => {
  const user = userEvent.setup();
  const onLayerChange = vi.fn();
  render(<LayerSectionContent {...defaultProps} onLayerChange={onLayerChange} />);
  await user.click(screen.getByText('Layer 3'));
  expect(onLayerChange).toHaveBeenCalledWith(2);
});

test('clicking add button calls onLayerAdd', async () => {
  const user = userEvent.setup();
  const onLayerAdd = vi.fn();
  render(<LayerSectionContent {...defaultProps} onLayerAdd={onLayerAdd} />);
  await user.click(screen.getByRole('button', { name: /add layer/i }));
  expect(onLayerAdd).toHaveBeenCalled();
});

test('nav strip delete button calls onLayerDelete with focusLayer index', async () => {
  const user = userEvent.setup();
  const onLayerDelete = vi.fn();
  render(<LayerSectionContent {...defaultProps} onLayerDelete={onLayerDelete} />);
  await user.click(screen.getByRole('button', { name: /delete layer/i }));
  expect(onLayerDelete).toHaveBeenCalledWith(1);
});

test('delete button is disabled when only one layer exists', () => {
  render(
    <LayerSectionContent
      {...defaultProps}
      layers={[{ id: 'a', name: 'Layer 1' }]}
      focusLayer={0}
    />
  );
  expect(screen.getByRole('button', { name: /delete layer/i })).toBeDisabled();
});

test('move up button calls onLayerReorder(focusLayer, focusLayer-1)', async () => {
  const user = userEvent.setup();
  const onLayerReorder = vi.fn();
  render(<LayerSectionContent {...defaultProps} onLayerReorder={onLayerReorder} />);
  await user.click(screen.getByRole('button', { name: /move layer up/i }));
  expect(onLayerReorder).toHaveBeenCalledWith(1, 0);
});

test('move up is disabled when focusLayer is 0', () => {
  render(<LayerSectionContent {...defaultProps} focusLayer={0} />);
  expect(screen.getByRole('button', { name: /move layer up/i })).toBeDisabled();
});

test('move down button calls onLayerReorder(focusLayer, focusLayer+1)', async () => {
  const user = userEvent.setup();
  const onLayerReorder = vi.fn();
  render(<LayerSectionContent {...defaultProps} onLayerReorder={onLayerReorder} />);
  await user.click(screen.getByRole('button', { name: /move layer down/i }));
  expect(onLayerReorder).toHaveBeenCalledWith(1, 2);
});

test('move down is disabled when focusLayer is last', () => {
  render(<LayerSectionContent {...defaultProps} focusLayer={2} />);
  expect(screen.getByRole('button', { name: /move layer down/i })).toBeDisabled();
});

test('clicking rename shows input with current layer name', async () => {
  const user = userEvent.setup();
  render(<LayerSectionContent {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: /rename layer/i }));
  expect(screen.getByDisplayValue('Layer 2')).toBeInTheDocument();
});

test('pressing Enter in rename input calls onLayerRename with trimmed value', async () => {
  const user = userEvent.setup();
  const onLayerRename = vi.fn();
  render(<LayerSectionContent {...defaultProps} onLayerRename={onLayerRename} />);
  await user.click(screen.getByRole('button', { name: /rename layer/i }));
  const input = screen.getByDisplayValue('Layer 2');
  await user.clear(input);
  await user.type(input, 'Dungeon{Enter}');
  expect(onLayerRename).toHaveBeenCalledWith(1, 'Dungeon');
});

test('pressing Escape in rename cancels without calling onLayerRename', async () => {
  const user = userEvent.setup();
  const onLayerRename = vi.fn();
  render(<LayerSectionContent {...defaultProps} onLayerRename={onLayerRename} />);
  await user.click(screen.getByRole('button', { name: /rename layer/i }));
  await user.keyboard('{Escape}');
  expect(onLayerRename).not.toHaveBeenCalled();
});

test('pressing Enter with only whitespace does not call onLayerRename', async () => {
  const user = userEvent.setup();
  const onLayerRename = vi.fn();
  render(<LayerSectionContent {...defaultProps} onLayerRename={onLayerRename} />);
  await user.click(screen.getByRole('button', { name: /rename layer/i }));
  const input = screen.getByDisplayValue('Layer 2');
  await user.clear(input);
  await user.type(input, '   {Enter}');
  expect(onLayerRename).not.toHaveBeenCalled();
});

test('layout toggle buttons render with correct active state', () => {
  render(<LayerSectionContent {...defaultProps} tilingMode="grid" />);
  expect(screen.getByRole('button', { name: /grid layout/i })).toBeInTheDocument();
});

test('clicking a layout toggle button calls onTilingModeChange', async () => {
  const user = userEvent.setup();
  const onTilingModeChange = vi.fn();
  render(<LayerSectionContent {...defaultProps} onTilingModeChange={onTilingModeChange} />);
  await user.click(screen.getByRole('button', { name: /column layout/i }));
  expect(onTilingModeChange).toHaveBeenCalledWith('column');
});

test('renders nothing in nav strip when layers is empty', () => {
  render(<LayerSectionContent {...defaultProps} layers={[]} focusLayer={0} />);
  expect(screen.queryByRole('button', { name: /delete layer/i })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /add layer/i })).toBeInTheDocument();
});

test('default layer shows filled star in nav strip when focused layer is default', () => {
  render(<LayerSectionContent {...defaultProps} focusLayer={0} defaultLayer={0} />);
  expect(screen.getByRole('button', { name: /set as default layer/i })).toHaveTextContent('★');
});

test('default layer shows outline star in nav strip when focused layer is not default', () => {
  render(<LayerSectionContent {...defaultProps} focusLayer={1} defaultLayer={0} />);
  expect(screen.getByRole('button', { name: /set as default layer/i })).toHaveTextContent('☆');
});

test('clicking set-as-default button calls onDefaultLayerChange with focusLayer', async () => {
  const user = userEvent.setup();
  const onDefaultLayerChange = vi.fn();
  render(<LayerSectionContent {...defaultProps} onDefaultLayerChange={onDefaultLayerChange} />);
  await user.click(screen.getByRole('button', { name: /set as default layer/i }));
  expect(onDefaultLayerChange).toHaveBeenCalledWith(1);
});

test('layer list shows filled star on default layer and outline stars on others', () => {
  render(<LayerSectionContent {...defaultProps} defaultLayer={1} />);
  const stars = screen.getAllByText('★');
  const outlineStars = screen.getAllByText('☆');
  expect(stars.length).toBeGreaterThanOrEqual(1);
  expect(outlineStars.length).toBeGreaterThanOrEqual(1);
});
