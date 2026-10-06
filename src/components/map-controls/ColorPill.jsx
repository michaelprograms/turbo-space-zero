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

// Each time a picker opens it gets a fresh key, so all of that session's live
// commits merge into one undo step.
let pickerSessions = 0;
const LIVE_COMMIT_MS = 100;

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
  empty = false, // unset value: render as NONE; `value` only seeds the picker
  'aria-label': ariaLabel,
  'data-testid': testId,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  // While open, picks update this draft at once (pill + picker stay smooth) and
  // reach the map at most every LIVE_COMMIT_MS, plus a final flush on close.
  // Committing every mouse move re-rendered the whole map each time.
  const [draft, setDraft] = useState(null); // null = untouched since opening
  const ref = useRef(null);
  const popRef = useRef(null);
  const latest = useRef();
  latest.current = { value, draft, empty, onChange };
  const sessionRef = useRef(null);
  const pendingRef = useRef(null); // newest pick not yet sent to onChange
  const timerRef = useRef(null);
  const recents = useRecents();
  const shown = draft ?? value;

  const flush = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    const c = pendingRef.current;
    pendingRef.current = null;
    const { value: v, empty: e, onChange: commit } = latest.current;
    // An empty pill's value is only a seed, so any pick counts as a change.
    if (c !== null && (c !== v || e)) commit?.(c, sessionRef.current);
  }, []);

  const pick = (c) => {
    setDraft(c);
    pendingRef.current = c;
    if (!timerRef.current) timerRef.current = setTimeout(flush, LIVE_COMMIT_MS);
  };

  useEffect(() => flush, [flush]); // unmounting mid-pick still saves it

  const openPicker = () => {
    sessionRef.current = ++pickerSessions;
    setDraft(null);
    setOpen(true);
  };

  // Save any pending pick and add the final color to the recents list.
  const close = useCallback(() => {
    const { value: v, draft: d } = latest.current;
    flush();
    setOpen(false);
    setDraft(null);
    addRecent(d ?? v);
  }, [flush]);

  const toggle = () => { if (open) close(); else openPicker(); };

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
      $color={shown}
      $empty={empty && draft === null}
      $theme={theme}
      $disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      // Keys inside an open picker (e.g. the gradient's arrow keys) must not
      // reach the map's document-level shortcuts and move the focused room.
      onKeyDown={(e) => {
        if (!open) return;
        e.stopPropagation();
        if (e.key === 'Escape') close();
      }}
      // Pills sit inside <label>s; a click on the gradient/pill would otherwise
      // also "click" the label's first button (e.g. Cell Background's Clear).
      onClickCapture={(e) => e.preventDefault()}
    >
      {showHex && (
        <ColorPillHex style={{ color: empty && draft === null ? (theme?.textColor || '#222') : readableTextColor(shown) }}>
          {empty && draft === null ? 'NONE' : shown.toUpperCase()}
        </ColorPillHex>
      )}
      <ColorPillButton
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={ariaLabel}
        data-testid={testId}
        data-color={empty && draft === null ? undefined : shown}
        $disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          onPick?.();
          toggle();
        }}
        onKeyDown={(e) => {
          if (disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
          e.preventDefault();
          onPick?.();
          toggle();
        }}
      />
      {open && (
        <ColorPopover
          ref={popRef}
          tabIndex={-1} // a click on its padding keeps focus inside (see onKeyDown above)
          $theme={theme}
          style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
          <HexColorPicker color={shown} onChange={pick} />
          <HexColorInput color={shown} onChange={pick} prefixed />
          <SwatchGrid>
            {COLOR_PRESETS.map((c) => (
              <Swatch key={c} $color={c} $theme={theme} title={c} aria-label={c}
                onClick={() => pick(c)} />
            ))}
          </SwatchGrid>
          {recents.length > 0 && (
            <>
              <PopoverLabel>Recent</PopoverLabel>
              <SwatchGrid>
                {recents.map((c) => (
                  <Swatch key={c} $color={c} $theme={theme} title={c} aria-label={c}
                    onClick={() => pick(c)} />
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
