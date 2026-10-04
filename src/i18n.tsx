import React, { useCallback, useEffect, useState } from 'react';
import { LocaleContext, LOCALE_STORAGE_KEY, STRINGS, initialLocale, type Locale, type StringKey } from './locale';

/** Provides the UI language and sets lang/dir on the document (Urdu is right-to-left). */
export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ur' ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // language still switches for this visit
    }
  }, []);

  const t = useCallback((key: StringKey) => STRINGS[key][locale], [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
};

