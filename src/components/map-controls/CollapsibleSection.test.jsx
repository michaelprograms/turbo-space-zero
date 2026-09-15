import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach } from 'vitest';
import CollapsibleSection from './CollapsibleSection';

vi.mock('../../data/index.js', () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}));

beforeEach(async () => {
  const { getSetting, setSetting } = await import('../../data/index.js');
  getSetting.mockResolvedValue(undefined);
  setSetting.mockResolvedValue(undefined);
});

test('renders the title in the header button', () => {
  render(
    <CollapsibleSection title="Map" defaultOpen={false} storageKey="sidebar.map">
      <span>content</span>
    </CollapsibleSection>
  );
  expect(screen.getByRole('button', { name: /map/i })).toBeInTheDocument();
});

test('renders children when defaultOpen is true', () => {
  render(
    <CollapsibleSection title="Map" defaultOpen={true} storageKey="sidebar.map">
      <span>content</span>
    </CollapsibleSection>
  );
  expect(screen.getByText('content')).toBeInTheDocument();
});

test('does not render children when defaultOpen is false', () => {
  render(
    <CollapsibleSection title="Map" defaultOpen={false} storageKey="sidebar.map">
      <span>content</span>
    </CollapsibleSection>
  );
  expect(screen.queryByText('content')).not.toBeInTheDocument();
});

test('clicking the header reveals children when closed', async () => {
  const user = userEvent.setup();
  render(
    <CollapsibleSection title="Map" defaultOpen={false} storageKey="sidebar.map">
      <span>content</span>
    </CollapsibleSection>
  );
  expect(screen.queryByText('content')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /map/i }));
  expect(screen.getByText('content')).toBeInTheDocument();
});

test('clicking the header hides children when open', async () => {
  const user = userEvent.setup();
  render(
    <CollapsibleSection title="Map" defaultOpen={true} storageKey="sidebar.map">
      <span>content</span>
    </CollapsibleSection>
  );
  expect(screen.getByText('content')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /map/i }));
  expect(screen.queryByText('content')).not.toBeInTheDocument();
});

test('uses persisted value over defaultOpen when record exists', async () => {
  const { getSetting } = await import('../../data/index.js');
  getSetting.mockResolvedValue(true);

  render(
    <CollapsibleSection title="Map" defaultOpen={false} storageKey="sidebar.map">
      <span>content</span>
    </CollapsibleSection>
  );

  await waitFor(() => {
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});

test('writes updated state via setSetting on toggle', async () => {
  const user = userEvent.setup();
  const { setSetting } = await import('../../data/index.js');

  render(
    <CollapsibleSection title="Map" defaultOpen={false} storageKey="sidebar.map">
      <span>content</span>
    </CollapsibleSection>
  );

  await user.click(screen.getByRole('button', { name: /map/i }));
  expect(setSetting).toHaveBeenCalledWith('sidebar.map', true);
});

test('header button has aria-expanded reflecting open state', async () => {
  const user = userEvent.setup();
  render(
    <CollapsibleSection title="Map" defaultOpen={false} storageKey="sidebar.map">
      <span>content</span>
    </CollapsibleSection>
  );
  expect(screen.getByRole('button', { name: /map/i })).toHaveAttribute('aria-expanded', 'false');
  await user.click(screen.getByRole('button', { name: /map/i }));
  expect(screen.getByRole('button', { name: /map/i })).toHaveAttribute('aria-expanded', 'true');
});
