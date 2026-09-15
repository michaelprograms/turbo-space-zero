import { useEffect, useRef } from 'react';
import { ModalBackdrop, ModalContent, ModalTitle, ModalCloseButton } from './Dialog.style.js';

function Dialog({ title, onClose, theme, wide = false, children }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ModalBackdrop data-testid="dialog-backdrop" onClick={onClose}>
      <ModalContent
        $theme={theme}
        $wide={wide}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
        tabIndex={-1}
        autoFocus
      >
        <ModalCloseButton type="button" $theme={theme} aria-label="Close" onClick={onClose}>
          &times;
        </ModalCloseButton>
        {title && <ModalTitle $theme={theme} $wide={wide}>{title}</ModalTitle>}
        {children}
      </ModalContent>
    </ModalBackdrop>
  );
}

export default Dialog;
