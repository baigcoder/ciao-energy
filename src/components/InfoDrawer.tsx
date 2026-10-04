import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

interface InfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Generic slide-in dialog (focus trapped, Escape and scrim close, focus restored). */
export const InfoDrawer: React.FC<InfoDrawerProps> = ({ isOpen, onClose, title, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('.drawer__close')?.focus();
    document.documentElement.classList.add('is-locked');
    const background = Array.from(document.querySelectorAll<HTMLElement>('#main, .site-header, .site-footer, .skip-link'));
    background.forEach((element) => element.setAttribute('inert', ''));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.documentElement.classList.remove('is-locked');
      background.forEach((element) => element.removeAttribute('inert'));
      opener?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;
  // Portalled to <body> so the rest of the page can be made inert behind it.
  return createPortal(
    <div className="drawer is-open">
      <div className="drawer__scrim" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="drawer__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
        </button>
        <h2 id={titleId} className="bag__title display">{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
};
