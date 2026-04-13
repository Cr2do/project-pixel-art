import { useState } from 'react';

const STORAGE_KEY = 'pixelboard-theme';

function resolveTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const theme = resolveTheme();
    applyTheme(theme);
    return theme === 'dark';
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      const theme = next ? 'dark' : 'light';
      applyTheme(theme);
      localStorage.setItem(STORAGE_KEY, theme);
      return next;
    });
  };

  return { isDark, toggleTheme };
}
