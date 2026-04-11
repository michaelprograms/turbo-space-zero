import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import QuillDock from './QuillDock';

const defaultProps = {
  isQuillMode: true,
  onNavigate: vi.fn(),
  onToggleQuillMode: vi.fn(),
  theme: {},
};

test('renders when isQuillMode is true', () => {
  render(<QuillDock {...defaultProps} />);
  expect(screen.getByRole('button', { name: '↑' })).toBeInTheDocument();
});

test('does not render when isQuillMode is false', () => {
  render(<QuillDock {...defaultProps} isQuillMode={false} />);
  expect(screen.queryByRole('button', { name: '↑' })).not.toBeInTheDocument();
});

test('clicking north button calls onNavigate with "north"', async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn();
  render(<QuillDock {...defaultProps} onNavigate={onNavigate} />);

  await user.click(screen.getByRole('button', { name: '↑' }));

  expect(onNavigate).toHaveBeenCalledWith('north');
});

test('clicking southwest button calls onNavigate with "southwest"', async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn();
  render(<QuillDock {...defaultProps} onNavigate={onNavigate} />);

  await user.click(screen.getByRole('button', { name: '↙' }));

  expect(onNavigate).toHaveBeenCalledWith('southwest');
});

test('clicking exit button calls onToggleQuillMode', async () => {
  const user = userEvent.setup();
  const onToggleQuillMode = vi.fn();
  render(<QuillDock {...defaultProps} onToggleQuillMode={onToggleQuillMode} />);

  await user.click(screen.getByRole('button', { name: /exit quill/i }));

  expect(onToggleQuillMode).toHaveBeenCalled();
});
