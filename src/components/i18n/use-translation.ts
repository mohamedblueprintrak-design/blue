'use client';

import { useMemo } from 'react';
import { useI18nStore, type Locale } from '@/lib/i18n-store';
import { translations, t, getTranslations, hasTranslation, getOppositeLocale } from '@/lib/i18n';

/**
 * useTranslation hook - provides translation function and locale utilities
 *
 * @example
 * ```tsx
 * const { t, locale, dir, setLocale, toggleLocale, isRTL } = useTranslation();
 *
 * return <h1>{t('dashboard_title')}</h1>;
 *
 * // With parameters:
 * return <p>{t('welcome_message', { name: 'Ahmed' })}</p>;
 * ```
 */
export function useTranslation() {
  const { locale, dir, setLocale, toggleLocale } = useI18nStore();

  const translate = useMemo(
    () =>
      (key: string, params?: Record<string, string | number>): string => {
        return t(key, locale, params);
      },
    [locale]
  );

  const allTranslations = useMemo(() => getTranslations(locale), [locale]);

  const isRTL = locale === 'ar';

  const oppositeLocale = getOppositeLocale(locale);

  const exists = useMemo(
    () => (key: string): boolean => hasTranslation(key, locale),
    [locale]
  );

  return {
    /** Translate a key with optional parameters */
    t: translate,
    /** Current locale ('ar' or 'en') */
    locale: locale as Locale,
    /** Text direction ('rtl' or 'ltr') */
    dir,
    /** Whether the current locale is RTL */
    isRTL,
    /** Set a specific locale */
    setLocale,
    /** Toggle between Arabic and English */
    toggleLocale,
    /** All translations for the current locale */
    translations: allTranslations,
    /** Check if a translation key exists */
    exists,
    /** Get the opposite locale */
    oppositeLocale,
  };
}

/**
 * Simple hook that just returns the translation function
 * Use this for performance-critical components
 */
export function useT() {
  const locale = useI18nStore((s) => s.locale);
  return useMemo(() => (key: string, params?: Record<string, string | number>) => t(key, locale, params), [locale]);
}

/**
 * Hook to get the current direction without subscribing to locale changes
 * Useful for CSS-in-JS or conditional classes
 */
export function useDirection() {
  return useI18nStore((s) => s.dir);
}

/**
 * Hook to check if current locale is RTL
 */
export function useIsRTL() {
  const locale = useI18nStore((s) => s.locale);
  return locale === 'ar';
}

export type { Locale };
export { translations };
