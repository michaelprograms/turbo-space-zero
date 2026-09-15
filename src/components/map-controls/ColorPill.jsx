import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import {
  ColorPillWrapper,
  ColorPillHex,
  ColorPillButton,
  ColorPopover,
  SwatchGrid,
  Swatch,
  PopoverLabel,
} from './style.js';
import { COLOR_PRESETS } from './colorPresets.js';
import { getRecents, subscribe, addRecent } from './colorRecents.js';

// ponytail: react-colorful (and our swatches) always emit #rrggbb, so no 3-digit/alpha parsing.
export function readableTextColor(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000' : '#fff';
}

function useRecents() {
  const [r, setR] = useState(getRecents());
  useEffect(() => subscribe(setR), []);
  return r;
}

function ColorPill({
  value,
  onChange,
  onPick,
  theme,
  showHex = false,
  size = 'full',
  disabled = false,
  'aria-label': ariaLabel,
  'data-testid': testId,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const popRef = useRef(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const recents = useRecents();

  // Commit the final color to the recents list when the popover closes.
  const close = useCallback(() => {
    setOpen(false);
    addRecent(valueRef.current);
  }, []);

  // Clamp the popover to the viewport so it never opens off-screen.
  useLayoutEffect(() => {
    if (!open || !ref.current || !popRef.current) return;
    const anchor = ref.current.getBoundingClientRect();
    const pop = popRef.current.getBoundingClientRect();
    const margin = 8;
    let top = anchor.bottom + 6;
    if (top + pop.height > window.innerHeight - margin) {
      top = Math.max(margin, anchor.top - 6 - pop.height); // flip above
    }
    let left = anchor.right - pop.width; // right-aligned to the pill
    left = Math.min(Math.max(margin, left), window.innerWidth - pop.width - margin);
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <ColorPillWrapper
      ref={ref}
      $size={size}
      $color={value}
      $disabled={disabled}
      onClick={(e) => e.stopPropagation()}
    >
      {showHex && (
        <ColorPillHex style={{ color: readableTextColor(value) }}>
          {value.toUpperCase()}
        </ColorPillHex>
      )}
      <ColorPillButton
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={ariaLabel}
        data-testid={testId}
        data-color={value}
        $disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          onPick?.();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
          e.preventDefault();
          onPick?.();
          setOpen((o) => !o);
        }}
      />
      {open && (
        <ColorPopover
          ref={popRef}
          $theme={theme}
          style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
          <HexColorPicker color={value} onChange={onChange} />
          <HexColorInput color={value} onChange={onChange} prefixed />
          <SwatchGrid>
            {COLOR_PRESETS.map((c) => (
              <Swatch key={c} $color={c} $theme={theme} title={c} aria-label={c}
                onClick={() => onChange?.(c)} />
            ))}
          </SwatchGrid>
          {recents.length > 0 && (
            <>
              <PopoverLabel>Recent</PopoverLabel>
              <SwatchGrid>
                {recents.map((c) => (
                  <Swatch key={c} $color={c} $theme={theme} title={c} aria-label={c}
                    onClick={() => onChange?.(c)} />
                ))}
              </SwatchGrid>
            </>
          )}
        </ColorPopover>
      )}
    </ColorPillWrapper>
  );
}

export default ColorPill;
