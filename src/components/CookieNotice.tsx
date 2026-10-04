import React, { useEffect, useState } from 'react';

const NOTICE_KEY = 'grizzly_notice_v1';

/**
 * Storage notice. The site only keeps essential data in this browser (bag, saved
 * items, language) and runs no tracking, so there is nothing to opt in to: this
 * says so plainly and remembers that it was read.
 */
export const CookieNotice: React.FC<{ isReady: boolean }> = ({ isReady }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(NOTICE_KEY) === '1';
    } catch {
      seen = false;
    }
    if (!seen) setVisible(true);
  }, [isReady]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(NOTICE_KEY, '1');
    } catch {
      // still hide it for this visit
    }
    setVisible(false);
  };

  return (
    <aside className="cookie-notice" aria-label="Storage notice">
      <p className="cookie-notice__text">
        We only store your bag, saved items and language in this browser. No tracking, no ad cookies.{' '}
        <a href="/privacy">Privacy policy</a>
      </p>
      <button type="button" className="button-outline" onClick={dismiss}>
        Got it
      </button>
    </aside>
  );
};
