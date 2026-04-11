import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import RoomSectionContent from './RoomSectionContent';

const defaultRoom = {
  enabled: true,
  text: 'Test Room',
  fillColor: '#aabbcc',
  borderColor: '#334455',
  borderWidth: 4,
  borderRadius: 50,
  roomSize: 25,
  exits: {
    north: false,
    northeast: false,
    east: false,
    southeast: false,
    south: false,
    southwest: false,
    west: false,
    northwest: false,
    up: false,
    down: false,
  },
};

const defaultProps = {
  room: defaultRoom,
  handleControlRoomValue: vi.fn(),
  handleControlRoomToggle: vi.fn(),
  onExitToggle: vi.fn(),
  onExitColorChange: vi.fn(),
  selectedCells: new Set(),
  onNudge: vi.fn(),
  textInputRef: { current: null },
  isQuillMode: false,
  onNavigate: vi.fn(),
  theme: {},
};

test('renders the exits grid with 9 buttons total', () => {
  render(<RoomSectionContent {...defaultProps} />);
  const grid = screen.getByTestId('exits-grid');
  const buttons = grid.querySelectorAll('button');
  expect(buttons).toHaveLength(9);
});

test('clicking north exit button calls onExitToggle with north direction', async () => {
  const user = userEvent.setup();
  const onExitToggle = vi.fn();
  render(<RoomSectionContent {...defaultProps} onExitToggle={onExitToggle} />);
  const grid = screen.getByTestId('exits-grid');
  const northButton = grid.querySelector('button[aria-label="↑"]');
  await user.click(northButton);
  expect(onExitToggle).toHaveBeenCalledWith('north');
});

test('clicking center cell toggles room enabled', async () => {
  const user = userEvent.setup();
  const handleControlRoomToggle = vi.fn();
  render(<RoomSectionContent {...defaultProps} handleControlRoomToggle={handleControlRoomToggle} />);
  const grid = screen.getByTestId('exits-grid');
  // Center cell is the one without an aria-label in the grid
  const buttons = grid.querySelectorAll('button');
  // In DIRECTION_GRID, null (center) is index 4, so 5th button
  const centerButton = buttons[4];
  await user.click(centerButton);
  expect(handleControlRoomToggle).toHaveBeenCalledWith('enabled');
});

test('renders up and down exit buttons', () => {
  render(<RoomSectionContent {...defaultProps} />);
  expect(screen.getByRole('button', { name: 'Up exit' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Down exit' })).toBeInTheDocument();
});

test('renders room label input with correct value', () => {
  render(<RoomSectionContent {...defaultProps} />);
  expect(screen.getByDisplayValue('Test Room')).toBeInTheDocument();
});

test('changing room label calls handleControlRoomValue with text field and new value', async () => {
  const user = userEvent.setup();
  const handleControlRoomValue = vi.fn();
  render(<RoomSectionContent {...defaultProps} handleControlRoomValue={handleControlRoomValue} />);
  const input = screen.getByDisplayValue('Test Room');
  await user.type(input, 'A');
  expect(handleControlRoomValue).toHaveBeenCalledWith('text', expect.stringContaining('A'));
});

test('renders fill color picker with correct value', () => {
  const { container } = render(<RoomSectionContent {...defaultProps} />);
  const fillPill = [...container.querySelectorAll('[data-color]')].find(i => i.dataset.color === '#aabbcc');
  expect(fillPill).toBeInTheDocument();
});

test('renders room size slider with correct value', () => {
  render(<RoomSectionContent {...defaultProps} />);
  const sliders = screen.getAllByRole('slider');
  const roomSizeSlider = sliders.find(s => s.value === '25');
  expect(roomSizeSlider).toBeInTheDocument();
});

test('nudge grid has 8 buttons', () => {
  render(<RoomSectionContent {...defaultProps} />);
  const nudgeGrid = screen.getByTestId('nudge-grid');
  const buttons = nudgeGrid.querySelectorAll('button');
  expect(buttons).toHaveLength(8);
});

test('clicking north nudge button calls onNudge with north direction', async () => {
  const user = userEvent.setup();
  const onNudge = vi.fn();
  render(<RoomSectionContent {...defaultProps} onNudge={onNudge} />);
  const nudgeGrid = screen.getByTestId('nudge-grid');
  const northButton = nudgeGrid.querySelector('button[aria-label="↑"]');
  await user.click(northButton);
  expect(onNudge).toHaveBeenCalledWith('north');
});

test('renders border width and border radius sliders', () => {
  render(<RoomSectionContent {...defaultProps} />);
  const sliders = screen.getAllByRole('slider');
  const borderWidthSlider = sliders.find(s => s.value === '4');
  const borderRadiusSlider = sliders.find(s => s.value === '50');
  expect(borderWidthSlider).toBeInTheDocument();
  expect(borderRadiusSlider).toBeInTheDocument();
});

test('border width slider allows 0', () => {
  render(<RoomSectionContent {...defaultProps} />);
  const borderWidthSlider = screen.getAllByRole('slider').find(s => s.value === '4');
  expect(borderWidthSlider).toHaveAttribute('min', '0');
});

const borderColorInput = (container) =>
  [...container.querySelectorAll('[data-color]')].find(i => i.dataset.color === '#334455');

test('border color picker is enabled at a non-zero border width', () => {
  const { container } = render(<RoomSectionContent {...defaultProps} />);
  expect(borderColorInput(container)).toHaveAttribute('aria-disabled', 'false');
});

test('border color picker is disabled when border width is 0', () => {
  const room = { ...defaultRoom, borderWidth: 0 };
  const { container } = render(<RoomSectionContent {...defaultProps} room={room} />);
  expect(borderColorInput(container)).toHaveAttribute('aria-disabled', 'true');
});

test('exit swatch color input shows default grey when no exitColors set', () => {
  render(<RoomSectionContent {...defaultProps} />);
  const northInput = screen.getByTestId('north-exit-color');
  expect(northInput).toHaveAttribute('data-color', '#666666');
});

test('exit swatch color input shows custom color from exitColors', () => {
  const room = { ...defaultRoom, exitColors: { north: '#ff0000' } };
  render(<RoomSectionContent {...defaultProps} room={room} />);
  const northInput = screen.getByTestId('north-exit-color');
  expect(northInput).toHaveAttribute('data-color', '#ff0000');
});

test('picking a swatch in the popover calls onExitColorChange with dir and color', async () => {
  const user = userEvent.setup();
  const onExitColorChange = vi.fn();
  const room = { ...defaultRoom, exits: { north: true } };
  render(<RoomSectionContent {...defaultProps} room={room} onExitColorChange={onExitColorChange} />);
  await user.click(screen.getByTestId('north-exit-color'));  // open popover
  await user.click(screen.getByRole('button', { name: '#ff0000' }));  // preset swatch
  expect(onExitColorChange).toHaveBeenCalledWith('north', '#ff0000');
});

test('clicking swatch on disabled exit calls onExitToggle with that direction', async () => {
  const user = userEvent.setup();
  const onExitToggle = vi.fn();
  render(<RoomSectionContent {...defaultProps} onExitToggle={onExitToggle} />);
  const northInput = screen.getByTestId('north-exit-color');
  await user.click(northInput);
  expect(onExitToggle).toHaveBeenCalledWith('north');
});

test('clicking swatch on enabled exit does not call onExitToggle', async () => {
  const user = userEvent.setup();
  const onExitToggle = vi.fn();
  const room = { ...defaultRoom, exits: { north: true } };
  render(<RoomSectionContent {...defaultProps} room={room} onExitToggle={onExitToggle} />);
  const northInput = screen.getByTestId('north-exit-color');
  await user.click(northInput);
  expect(onExitToggle).not.toHaveBeenCalled();
});

test('up exit has a color swatch input', () => {
  render(<RoomSectionContent {...defaultProps} />);
  expect(screen.getByTestId('up-exit-color')).toBeInTheDocument();
});

test('down exit has a color swatch input', () => {
  render(<RoomSectionContent {...defaultProps} />);
  expect(screen.getByTestId('down-exit-color')).toBeInTheDocument();
});

test('exit swatches are not rendered in quill mode', () => {
  render(<RoomSectionContent {...defaultProps} isQuillMode={true} />);
  expect(screen.queryByTestId('north-exit-color')).not.toBeInTheDocument();
  expect(screen.queryByTestId('up-exit-color')).not.toBeInTheDocument();
  expect(screen.queryByTestId('down-exit-color')).not.toBeInTheDocument();
});
