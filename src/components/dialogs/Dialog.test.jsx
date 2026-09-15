import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Dialog from './Dialog';

test('renders children', () => {
  render(<Dialog title="Test" onClose={vi.fn()} theme={null}><p>hello</p></Dialog>);
  expect(screen.getByText('hello')).toBeInTheDocument();
});

test('renders the title', () => {
  render(<Dialog title="My Dialog" onClose={vi.fn()} theme={null}><p>x</p></Dialog>);
  expect(screen.getByText('My Dialog')).toBeInTheDocument();
});

test('calls onClose when backdrop is clicked', async () => {
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(<Dialog title="T" onClose={onClose} theme={null}><p>content</p></Dialog>);
  await user.click(document.querySelector('[data-testid="dialog-backdrop"]'));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('does not call onClose when content area is clicked', async () => {
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(<Dialog title="T" onClose={onClose} theme={null}><p>content</p></Dialog>);
  await user.click(screen.getByText('content'));
  expect(onClose).not.toHaveBeenCalled();
});

test('calls onClose when Escape is pressed', async () => {
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(<Dialog title="T" onClose={onClose} theme={null}><p>x</p></Dialog>);
  await user.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('calls onClose when close button is clicked', async () => {
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(<Dialog title="T" onClose={onClose} theme={null}><p>x</p></Dialog>);
  await user.click(screen.getByLabelText('Close'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
