'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark', // CryptoTrader는 기본적으로 다크 테마
  storageKey = 'crypto-trader-theme',
}) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // 로컬 스토리지에서 테마 불러오기
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as Theme;
      if (stored && ['dark', 'light', 'system'].includes(stored)) {
        setThemeState(stored);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    const updateResolvedTheme = () => {
      let resolved: 'dark' | 'light' = 'dark';
      
      if (theme === 'system') {
        // 시스템 테마 감지
        if (typeof window !== 'undefined') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
      } else {
        resolved = theme;
      }

      setResolvedTheme(resolved);

      // HTML 요소에 클래스 적용
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolved);
        root.setAttribute('data-theme', resolved);
      }
    };

    updateResolvedTheme();

    // 시스템 테마 변경 감지
    if (theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateResolvedTheme);
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // 로컬 스토리지에 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newTheme);
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 