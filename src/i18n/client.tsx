"use client";

import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";

import { normalizeLocale, type AppLocale } from "@/i18n/config";
import { translate } from "@/i18n/translate";

const LOCALE_STORAGE_KEY = "wrm_locale";

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (nextLocale: AppLocale) => void;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps extends PropsWithChildren {
  initialLocale: string;
}

export function I18nProvider({ initialLocale, children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(normalizeLocale(initialLocale));

  const setLocale = useCallback((nextLocale: AppLocale) => {
    const normalized = normalizeLocale(nextLocale);
    setLocaleState(normalized);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
      document.cookie = `wrm_locale=${normalized}; path=/; max-age=7776000; samesite=lax`;
    }
  }, []);

  const t = useCallback<I18nContextValue["t"]>(
    (key, fallback, values) => translate(locale, key, fallback, values),
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }
  return context;
}

