import { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
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

  // Parent that applies commits, like the real map does.
  function Live({ onChange, initial = '#aabbcc', empty = false }) {
    const [value, setValue] = useState(initial);
    const [isEmpty, setEmpty] = useState(empty);
    return (
      <ColorPill value={value} empty={isEmpty} data-testid="x-color"
        onChange={(c, key) => { setValue(c); setEmpty(false); onChange(c, key); }} />
    );
  }

  describe('throttled live commits', () => {
    beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
    afterEach(() => { vi.useRealTimers(); });
    const setup = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const swatch = (c) => screen.getAllByRole('button', { name: c })[0]; // [0] = preset; recents may repeat it

    test('picks preview instantly and reach the map at most every 100 ms', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Live onChange={onChange} />);
      await user.click(screen.getByTestId('x-color'));
      await user.click(swatch('#ff0000'));
      await user.click(swatch('#00ff00'));
      expect(screen.getByTestId('x-color')).toHaveAttribute('data-color', '#00ff00'); // pill is instant
      expect(onChange).not.toHaveBeenCalled();
      act(() => { vi.advanceTimersByTime(100); });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith('#00ff00', expect.anything()); // latest pick, not every pick
    });

    test('one picker session uses one merge key; reopening gets a new one', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Live onChange={onChange} />);
      await user.click(screen.getByTestId('x-color'));
      await user.click(swatch('#ff0000'));
      act(() => { vi.advanceTimersByTime(100); });
      await user.click(swatch('#00ff00'));
      act(() => { vi.advanceTimersByTime(100); });
      await user.keyboard('{Escape}');
      await user.click(screen.getByTestId('x-color'));
      await user.click(swatch('#0000ff'));
      act(() => { vi.advanceTimersByTime(100); });
      const keys = onChange.mock.calls.map(([, key]) => key);
      expect(keys).toHaveLength(3);
      expect(keys[0]).toBe(keys[1]);
      expect(keys[2]).not.toBe(keys[0]);
    });

    test('closing flushes a pending pick right away, without a duplicate later', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Live onChange={onChange} />);
      await user.click(screen.getByTestId('x-color'));
      await user.click(swatch('#ff0000'));
      await user.keyboard('{Escape}');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('#ff0000', expect.anything());
      act(() => { vi.advanceTimersByTime(500); });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  test.each([
    ['clicking outside', async (user) => user.click(document.body)],
    ['clicking the pill again', async (user) => user.click(screen.getByTestId('x-color'))],
  ])('%s closes the picker and commits', async (_name, closeIt) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPill value="#aabbcc" data-testid="x-color" onChange={onChange} />);
    await user.click(screen.getByTestId('x-color'));
    await user.click(screen.getAllByRole('button', { name: '#ff0000' })[0]); // [0] = preset; recents may repeat it
    await closeIt(user);
    expect(screen.queryByRole('button', { name: '#00ff00' })).not.toBeInTheDocument(); // popover gone
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('#ff0000', expect.anything());
  });

  test('typing a hex reaches onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPill value="#aabbcc" data-testid="x-color" onChange={onChange} />);
    await user.click(screen.getByTestId('x-color'));
    const hex = screen.getByDisplayValue('#aabbcc');
    await user.clear(hex);
    await user.type(hex, '123456');
    await user.keyboard('{Escape}');
    expect(onChange).toHaveBeenLastCalledWith('#123456', expect.anything());
  });

  test('closing without a change commits nothing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPill value="#aabbcc" data-testid="x-color" onChange={onChange} />);
    await user.click(screen.getByTestId('x-color'));
    await user.keyboard('{Escape}');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('an empty pill commits even when the pick equals the seed color', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPill value="#ff0000" empty data-testid="x-color" onChange={onChange} />);
    await user.click(screen.getByTestId('x-color'));
    await user.click(screen.getAllByRole('button', { name: '#ff0000' })[0]);
    await user.keyboard('{Escape}');
    expect(onChange).toHaveBeenCalledWith('#ff0000', expect.anything());
  });

  test('keys pressed inside an open picker do not reach map shortcuts', async () => {
    const user = userEvent.setup();
    const docListener = vi.fn();
    document.addEventListener('keydown', docListener);
    render(<ColorPill value="#aabbcc" data-testid="x-color" onChange={() => {}} />);
    await user.click(screen.getByTestId('x-color'));
    await user.keyboard('{ArrowLeft}');
    document.removeEventListener('keydown', docListener);
    expect(docListener).not.toHaveBeenCalled();
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
