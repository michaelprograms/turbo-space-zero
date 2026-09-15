import { useEffect, useRef } from 'react';

export function useMapKeyboard(handleKeyDown) {
  const handlerRef = useRef(handleKeyDown);
  handlerRef.current = handleKeyDown;

  useEffect(() => {
    const listener = (e) => handlerRef.current(e);
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);
}
