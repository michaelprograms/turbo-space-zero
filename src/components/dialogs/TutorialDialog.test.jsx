import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TutorialDialog from './TutorialDialog';

vi.mock('./TutorialCanvas', () => ({
  default: ({ script }) => <div data-testid="tutorial-canvas" data-script-id={script?.id} />,
}));

test('renders all category labels in the sidebar', () => {
  render(<TutorialDialog onClose={vi.fn()} theme={null} />);
  expect(screen.getByText('Navigation')).toBeInTheDocument();
  expect(screen.getByText('Editing')).toBeInTheDocument();
  expect(screen.getByText('Clipboard')).toBeInTheDocument();
  expect(screen.getByText('File')).toBeInTheDocument();
  expect(screen.getByText('Advanced')).toBeInTheDocument();
});

test('first demo is selected by default', () => {
  render(<TutorialDialog onClose={vi.fn()} theme={null} />);
  expect(screen.getAllByText('Moving Around').length).toBeGreaterThan(0);
  expect(screen.getByTestId('tutorial-canvas')).toHaveAttribute('data-script-id', 'moving-around');
});

test('clicking a different demo updates the canvas script', async () => {
  const user = userEvent.setup();
  render(<TutorialDialog onClose={vi.fn()} theme={null} />);
  await user.click(screen.getByRole('button', { name: '✦ Quill Mode' }));
  expect(screen.getByTestId('tutorial-canvas')).toHaveAttribute('data-script-id', 'quill-mode');
});

test('Next button advances to the next demo', async () => {
  const user = userEvent.setup();
  render(<TutorialDialog onClose={vi.fn()} theme={null} />);
  await user.click(screen.getByRole('button', { name: /next/i }));
  expect(screen.getByTestId('tutorial-canvas')).toHaveAttribute('data-script-id', 'quill-mode');
});

test('Prev button is disabled on the first demo', () => {
  render(<TutorialDialog onClose={vi.fn()} theme={null} />);
  expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
});

test('Next button is disabled on the last demo', async () => {
  const user = userEvent.setup();
  render(<TutorialDialog onClose={vi.fn()} theme={null} />);
  const { ALL_DEMOS } = await import('./tutorial-scripts.js');
  for (let i = 0; i < ALL_DEMOS.length - 1; i++) {
    await user.click(screen.getByRole('button', { name: /next/i }));
  }
  expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
});

test('type:ui demo renders the Component instead of TutorialCanvas', async () => {
  const user = userEvent.setup();
  render(<TutorialDialog onClose={vi.fn()} theme={null} />);
  await user.click(screen.getByRole('button', { name: 'New Map' }));
  expect(screen.queryByTestId('tutorial-canvas')).not.toBeInTheDocument();
});
