import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../../data/index.js';
import {
  CollapsibleHeader,
  CollapsibleArrow,
  CollapsibleTitle,
  CollapsibleBody,
} from './style.js';

function CollapsibleSection({ title, defaultOpen = false, storageKey, theme, children }) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    let cancelled = false;
    getSetting(storageKey).then(value => {
      if (!cancelled && value !== undefined) setOpen(value);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [storageKey]);

  const toggle = () => {
    setOpen(prev => {
      const next = !prev;
      setSetting(storageKey, next);
      return next;
    });
  };

  return (
    <>
      <CollapsibleHeader
        $theme={theme}
        type="button"
        aria-expanded={open}
        onClick={toggle}
      >
        <CollapsibleArrow $open={open} $theme={theme}>▶</CollapsibleArrow>
        <CollapsibleTitle $theme={theme}>{title}</CollapsibleTitle>
      </CollapsibleHeader>
      {open && <CollapsibleBody>{children}</CollapsibleBody>}
    </>
  );
}

export default CollapsibleSection;
