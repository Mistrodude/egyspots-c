import { createContext, useContext, useState } from 'react';
import { DARK, LIGHT } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const t = isDark ? DARK : LIGHT;
  const toggleTheme = () => setIsDark((d) => !d);
  return (
    <ThemeContext.Provider value={{ t, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
