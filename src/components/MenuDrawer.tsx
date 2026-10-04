import React, { useEffect, useRef } from 'react';
import { useLocale, type StringKey } from '../locale';

export interface MenuItem {
  key: StringKey;
  href: string;
  onSelect: () => void;
}

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
}

/**
 * Compact translucent panel under the MENU button (as on the live reference),
 * plus the language switch. Escape or a click outside closes it; focus moves in
 * on open and returns on close.
 */
export const MenuDrawer: React.FC<MenuDrawerProps> = ({ isOpen, onClose, items }) => {
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { t, locale, setLocale } = useLocale();

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.('.menu-toggle')) return;
      onCloseRef.current();
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (panelRef.current?.contains(target) || target.closest?.('.menu-toggle')) return;
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      opener?.focus?.();
    };
  }, [isOpen]);

  return (
    <nav id="site-menu" ref={panelRef} className={`site-menu ${isOpen ? 'is-open' : ''}`} aria-label="Main navigation" hidden={!isOpen}>
      <ul className="site-menu__list">
        {items.map((item, index) => (
          <li key={item.key} style={{ '--i': index } as React.CSSProperties}>
            <a
              className="site-menu__link"
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                onClose();
                item.onSelect();
              }}
            >
              {t(item.key)}
            </a>
          </li>
        ))}
        <li className="site-menu__item--compact" style={{ '--i': items.length } as React.CSSProperties}>
          <a className="site-menu__link" href="#site-footer" onClick={onClose}>{t('contact')}</a>
        </li>
      </ul>
      <button
        type="button"
        className="site-menu__lang"
        lang={locale === 'en' ? 'ur' : 'en'}
        aria-label={t('languageLabel')}
        onClick={() => setLocale(locale === 'en' ? 'ur' : 'en')}
      >
        {t('language')}
      </button>
    </nav>
  );
};
