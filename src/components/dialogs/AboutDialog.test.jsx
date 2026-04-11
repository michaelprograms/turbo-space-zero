import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import AboutDialog from './AboutDialog';

vi.mock('../../constants/app.js', () => ({ APP_NAME: 'Test App', APP_VERSION: '0.0.0' }));

test('renders the app name', () => {
  render(<AboutDialog onClose={vi.fn()} theme={null} />);
  expect(screen.getByText('Test App')).toBeInTheDocument();
});

test('renders the GitHub link', () => {
  render(<AboutDialog onClose={vi.fn()} theme={null} />);
  expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
});

test('renders tech stack chips', () => {
  render(<AboutDialog onClose={vi.fn()} theme={null} />);
  expect(screen.getByText('React 19')).toBeInTheDocument();
  expect(screen.getByText('idb-keyval (IndexedDB)')).toBeInTheDocument();
  expect(screen.getByText('Konva')).toBeInTheDocument();
});
