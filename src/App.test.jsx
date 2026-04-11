import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./context', () => ({
  AppProvider: ({ children }) => children,
  useAppContext: () => ({ isReady: true }),
}));

vi.mock('./components/map-view', () => ({
  default: () => <div data-testid="map-view" />,
}));

test('renders MapView when context is ready', () => {
  render(<App />);
  expect(screen.getByTestId('map-view')).toBeInTheDocument();
});
