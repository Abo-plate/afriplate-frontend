"use client";
import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
const ThemeContext = createContext(null);
export const THEME_STORAGE_KEY = 'afriplate:theme';
const valid = value => ['light', 'dark', 'system'].includes(value);


export function ThemeProvider({children}) {
  const [preference, setPreference] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [canSave, setCanSave] = useState(true);
  const current = useRef('system');
  const apply = useCallback(next => {
    const choice = valid(next) ? next : 'system';
    current.current = choice;
    const dark = choice === 'dark' || (choice === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    const resolved = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    setPreference(choice); setResolvedTheme(resolved);
  }, []);
  useEffect(() => {
    let saved = 'system';
    try { saved = localStorage.getItem(THEME_STORAGE_KEY); } catch { setCanSave(false); }
    apply(saved);
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const systemChanged = () => { if (current.current === 'system') apply('system'); };
    const storageChanged = event => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) apply(event.newValue);
    };
    media?.addEventListener?.('change', systemChanged);
    window.addEventListener('storage', storageChanged);
    return () => {
      media?.removeEventListener?.('change', systemChanged);
      window.removeEventListener('storage', storageChanged);
    };
  }, [apply]);
  const chooseTheme = useCallback(next => {
    if (!valid(next)) return;
    try {
      if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
      setCanSave(true);
    } catch { setCanSave(false); }
    apply(next);
  }, [apply]);
  return <ThemeContext.Provider value={{preference, resolvedTheme, chooseTheme, canSave}}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw Error('ThemeProvider is required');
  return value;
}
