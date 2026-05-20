'use client';

import { useEffect } from 'react';
import { useSettings } from './useSettings';

export function useTheme() {
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings) return;

    const root = window.document.documentElement;
    const theme = settings.theme;

    const applyTheme = (currentTheme: 'light' | 'dark') => {
      if (currentTheme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme);
    }
  }, [settings?.theme]);
}
