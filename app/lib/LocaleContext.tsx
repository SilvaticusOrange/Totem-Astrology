import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_LOCALE, t as translate } from '../lib/i18n';

type LocaleContextValue = {
  locale: string;
  setLocale: (code: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, vars) => translate(key, DEFAULT_LOCALE, vars),
});

export function LocaleProvider({
  locale,
  setLocale,
  children,
}: {
  locale: string;
  setLocale: (code: string) => void;
  children: ReactNode;
}) {
  const value: LocaleContextValue = {
    locale,
    setLocale,
    t: (key, vars) => translate(key, locale, vars),
  };
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
