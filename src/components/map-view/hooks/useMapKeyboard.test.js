import { renderHook } from '@testing-library/react';
import { vi, test, expect, beforeEach, afterEach } from 'vitest';
import { useMapKeyboard } from './useMapKeyboard';

let addSpy, removeSpy;

beforeEach(() => {
  addSpy = vi.spyOn(document, 'addEventListener');
  removeSpy = vi.spyOn(document, 'removeEventListener');
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('registers keydown listener on mount', () => {
  const handler = vi.fn();
  renderHook(() => useMapKeyboard(handler));
  expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
});

test('removes keydown listener on unmount', () => {
  const handler = vi.fn();
  const { unmount } = renderHook(() => useMapKeyboard(handler));
  unmount();
  expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
});

test('does not re-register listener when handler reference changes', () => {
  const handler = vi.fn();
  const { rerender } = renderHook(({ h }) => useMapKeyboard(h), {
    initialProps: { h: handler },
  });
  expect(addSpy).toHaveBeenCalledTimes(1);

  rerender({ h: vi.fn() });
  expect(addSpy).toHaveBeenCalledTimes(1);
  expect(removeSpy).not.toHaveBeenCalled();
});

test('calls the latest handler via ref', () => {
  const handler1 = vi.fn();
  const { rerender } = renderHook(({ h }) => useMapKeyboard(h), {
    initialProps: { h: handler1 },
  });

  const handler2 = vi.fn();
  rerender({ h: handler2 });

  const event = new KeyboardEvent('keydown', { key: 'a' });
  document.dispatchEvent(event);
  expect(handler1).not.toHaveBeenCalled();
  expect(handler2).toHaveBeenCalledWith(event);
});
