import { useEffect, useState } from 'react';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

const STORAGE_KEY = 'pixelboard-theme';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function isValidTheme(value: string | null): value is Theme {
  return value === Theme.LIGHT || value === Theme.DARK;
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isValidTheme(stored)) return stored;

  return window.matchMedia(DARK_SCHEME_QUERY).matches ? Theme.DARK : Theme.LIGHT;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(Theme.DARK, theme === Theme.DARK);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === Theme.DARK ? Theme.LIGHT : Theme.DARK));

  const isDark = theme === Theme.DARK;

  return { theme, isDark, setTheme, toggleTheme };
}
