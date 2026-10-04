import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CartContents } from './CartContents';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Slide-in bag. Modal dialog: focus moves in and is trapped, Escape or the scrim
 * closes it, focus returns to the opener, and the page behind stops scrolling.
 */
export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  // Latest close handler without re-running the open/close effect on every parent render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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
      <div ref={panelRef} className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-bag-title">
        <button type="button" className="drawer__close" onClick={onClose} aria-label="Close bag">
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
        </button>
        <CartContents
          headingId="drawer-bag-title"
          onNavigate={(url) => {
            onClose();
            onNavigate(url);
          }}
        />
      </div>
    </div>,
    document.body
  );
};
