import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import TutorialCanvas from './TutorialCanvas';
import { ROOM_DEFAULTS } from '../../constants/room.js';

const FOCUS_FILL = '#D4E8F5'; // theme.focusHighlight default
const ROOM_FILL = ROOM_DEFAULTS.fillColor;

vi.mock('react-konva', () => ({
  Stage: ({ children, width, height }) => (
    <div data-testid="konva-stage" data-width={width} data-height={height}>{children}</div>
  ),
  Layer: ({ children }) => <>{children}</>,
  Rect: ({ x, y, fill, stroke }) => (
    <div data-testid="konva-rect" data-x={x} data-y={y} data-fill={fill} data-stroke={stroke} />
  ),
  Line: () => <div data-testid="konva-line" />,
  Text: () => <div data-testid="konva-text" />,
}));

const simpleScript = {
  type: 'canvas',
  frames: [
    { delay: 0,   focus: [0, 0], cells: {}, mode: 'normal', hint: null },
    { delay: 500, focus: [1, 0], cells: { '1,0': { exits: {} } }, mode: 'normal', hint: null },
    { delay: 500, focus: [1, 1], cells: { '1,0': { exits: {} }, '1,1': { exits: {} } }, mode: 'normal', hint: null },
  ],
};

test('renders a Konva stage', () => {
  render(<TutorialCanvas script={simpleScript} theme={null} />);
  expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
});

test('renders the focus highlight rect on frame 0', () => {
  render(<TutorialCanvas script={simpleScript} theme={null} />);
  const rects = screen.getAllByTestId('konva-rect');
  const focusRect = rects.find(r => r.dataset.fill === FOCUS_FILL);
  expect(focusRect).toBeTruthy();
});

test('advances to next frame after delay', () => {
  vi.useFakeTimers();
  render(<TutorialCanvas script={simpleScript} theme={null} />);
  // Frame 0: focus [0,0] — only the focus highlight, no room rects
  const initialRects = screen.getAllByTestId('konva-rect');
  const initialCellRects = initialRects.filter(r => r.dataset.fill === ROOM_FILL);
  expect(initialCellRects).toHaveLength(0);

  // After 500ms, frame 1: room '1,0' appears
  act(() => vi.advanceTimersByTime(500));
  const afterRects = screen.getAllByTestId('konva-rect');
  const cellRects = afterRects.filter(r => r.dataset.fill === ROOM_FILL);
  expect(cellRects).toHaveLength(1);

  vi.useRealTimers();
});

test('loops back to frame 0 after last frame + 1200ms pause', () => {
  vi.useFakeTimers();
  render(<TutorialCanvas script={simpleScript} theme={null} />);

  // Advance through all frames
  act(() => vi.advanceTimersByTime(500)); // frame 1
  act(() => vi.advanceTimersByTime(500)); // frame 2
  // After last frame, loop resets after 1200ms
  act(() => vi.advanceTimersByTime(1200));
  // Back to frame 0: no room rects
  const rects = screen.getAllByTestId('konva-rect');
  const cellRects = rects.filter(r => r.dataset.fill === ROOM_FILL);
  expect(cellRects).toHaveLength(0);

  vi.useRealTimers();
});

test('renders nothing when script is null', () => {
  render(<TutorialCanvas script={null} theme={null} />);
  expect(screen.queryByTestId('konva-stage')).not.toBeInTheDocument();
});
