import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ShortcutsDialog from './ShortcutsDialog';

test('renders all shortcut group headings', () => {
  render(<ShortcutsDialog onClose={vi.fn()} theme={null} />);
  expect(screen.getByText('Navigation')).toBeInTheDocument();
  expect(screen.getByText('Editing')).toBeInTheDocument();
  expect(screen.getByText('Exits')).toBeInTheDocument();
  expect(screen.getByText('Layers')).toBeInTheDocument();
  expect(screen.getByText('File')).toBeInTheDocument();
});

test('renders Mac and Win/Linux column headers', () => {
  render(<ShortcutsDialog onClose={vi.fn()} theme={null} />);
  expect(screen.getAllByText('Mac').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Win / Linux').length).toBeGreaterThan(0);
});

test('renders a known shortcut action', () => {
  render(<ShortcutsDialog onClose={vi.fn()} theme={null} />);
  expect(screen.getByText('Toggle quill mode')).toBeInTheDocument();
});

test('renders different Mac and Win/Linux values for Undo', () => {
  render(<ShortcutsDialog onClose={vi.fn()} theme={null} />);
  expect(screen.getByText('⌘ Z')).toBeInTheDocument();
  expect(screen.getByText('Ctrl Z')).toBeInTheDocument();
});
