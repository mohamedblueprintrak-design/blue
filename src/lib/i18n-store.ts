import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'ar' | 'en';

interface I18nStore {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useI18nStore = create<I18nStore>()(
  persist(
    (set, get) => ({
      locale: 'ar',
      dir: 'rtl' as const,
      setLocale: (locale) =>
        set({
          locale,
          dir: locale === 'ar' ? ('rtl' as const) : ('ltr' as const),
        }),
      toggleLocale: () => {
        const current = get().locale;
        const next: Locale = current === 'ar' ? 'en' : 'ar';
        set({
          locale: next,
          dir: next === 'ar' ? ('rtl' as const) : ('ltr' as const),
        });
      },
    }),
    {
      name: 'blueprint-i18n',
      // Only persist locale preference
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
