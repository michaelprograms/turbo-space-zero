import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ColorPill, { readableTextColor } from './ColorPill';

describe('readableTextColor', () => {
  test('returns white text on a dark background', () => {
    expect(readableTextColor('#000000')).toBe('#fff');
    expect(readableTextColor('#334455')).toBe('#fff');
  });

  test('returns black text on a light background', () => {
    expect(readableTextColor('#ffffff')).toBe('#000');
    expect(readableTextColor('#f0c040')).toBe('#000');
  });
});

describe('ColorPill', () => {
  test('renders a trigger carrying value, testid, and aria-label', () => {
    render(
      <ColorPill value="#aabbcc" data-testid="x-color" aria-label="X color" onChange={() => {}} />
    );
    const trigger = screen.getByTestId('x-color');
    expect(trigger).toHaveAttribute('role', 'button');
    expect(trigger).toHaveAttribute('data-color', '#aabbcc');
    expect(trigger).toHaveAttribute('aria-label', 'X color');
  });

  test('showHex renders the uppercased hex label', () => {
    render(<ColorPill value="#aabbcc" showHex onChange={() => {}} />);
    expect(screen.getByText('#AABBCC')).toBeInTheDocument();
  });

  test('without showHex there is no hex label', () => {
    render(<ColorPill value="#aabbcc" data-testid="x-color" onChange={() => {}} />);
    expect(screen.queryByText('#AABBCC')).not.toBeInTheDocument();
  });

  test('picking a preset swatch fires onChange with that color', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPill value="#aabbcc" data-testid="x-color" onChange={onChange} />);
    await user.click(screen.getByTestId('x-color'));  // open popover
    await user.click(screen.getByRole('button', { name: '#ff0000' }));
    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });

  test('onPick fires on click and click does not bubble to a parent handler', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const onParentClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <ColorPill value="#aabbcc" data-testid="x-color" onChange={() => {}} onPick={onPick} />
      </div>
    );
    await user.click(screen.getByTestId('x-color'));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onParentClick).not.toHaveBeenCalled();
  });

  test('disabled marks the trigger aria-disabled', () => {
    render(<ColorPill value="#aabbcc" data-testid="x-color" onChange={() => {}} disabled />);
    expect(screen.getByTestId('x-color')).toHaveAttribute('aria-disabled', 'true');
  });
});
