import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const THEME_STORAGE_KEY = 'ujaas-theme';
// Keep dark mode disabled in production for now. Set to true when theme toggle goes live.
const ENABLE_THEME_TOGGLE = false;

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (!ENABLE_THEME_TOGGLE) {
    return 'light';
  }

  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  const resolvedTheme: Theme = ENABLE_THEME_TOGGLE ? theme : 'light';

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-dark', resolvedTheme === 'dark');
    root.setAttribute('data-theme', resolvedTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
  }, [resolvedTheme]);

  const applyTheme = (nextTheme: Theme) => {
    setTheme(ENABLE_THEME_TOGGLE ? nextTheme : 'light');
  };

  const value = useMemo<ThemeContextValue>(() => ({
    theme: resolvedTheme,
    isDark: resolvedTheme === 'dark',
    toggleTheme: () => setTheme((current) => (ENABLE_THEME_TOGGLE ? (current === 'dark' ? 'light' : 'dark') : 'light')),
    setTheme: applyTheme,
  }), [resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
