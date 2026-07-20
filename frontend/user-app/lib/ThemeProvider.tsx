// frontend/user-app/lib/ThemeProvider.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import { useDesign } from './designSystem';

// Define shape of design tokens
export type DesignTokens = ReturnType<typeof useDesign>;

const ThemeContext = createContext<DesignTokens | undefined>(undefined);

/**
 * ThemeProvider makes design tokens (colors, fonts, spacing, etc.)
 * available via React context throughout the user-app.
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const design = useDesign();
  return (
    <ThemeContext.Provider value={design}>{children}</ThemeContext.Provider>
  );
};

/** Hook to access design tokens in any component */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
