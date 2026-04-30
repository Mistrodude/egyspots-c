import { createContext, useContext, useState } from 'react';
import { DARK, LIGHT } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('theme') !== 'light'; }
    catch { return true; }
  });
  const t = isDark ? DARK : LIGHT;
  const toggleTheme = () => setIsDark((d) => {
    const next = !d;
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
    return next;
  });
  return (
    <ThemeContext.Provider value={{ t, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
