import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ColorScheme, MihonThemes } from '../constants/theme';
import { ThemeMode, ThemePreset } from '../types';
import { getStoredThemePreferences, saveStoredThemePreferences } from '../utils/storage';

interface ThemeContextType {
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  pureBlackDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setThemePreset: (preset: ThemePreset) => void;
  setPureBlackDarkMode: (pureBlack: boolean) => void;
  colors: ColorScheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [themePreset, setThemePresetState] = useState<ThemePreset>('default');
  const [pureBlackDarkMode, setPureBlackState] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getStoredThemePreferences().then((prefs) => {
      setThemeModeState(prefs.mode);
      setThemePresetState(prefs.preset);
      setPureBlackState(prefs.pureBlack);
      setIsLoaded(true);
    });
  }, []);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const presetConfig = MihonThemes[themePreset] || MihonThemes.default;
  const rawColors = isDark ? presetConfig.dark : presetConfig.light;

  const colors: ColorScheme = {
    ...rawColors,
    background: isDark && pureBlackDarkMode ? '#000000' : rawColors.background,
    surface: isDark && pureBlackDarkMode ? '#0A0A0E' : rawColors.surface,
    card: isDark && pureBlackDarkMode ? '#121218' : rawColors.card,
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveStoredThemePreferences(mode, themePreset, pureBlackDarkMode);
  };

  const setThemePreset = (preset: ThemePreset) => {
    setThemePresetState(preset);
    saveStoredThemePreferences(themeMode, preset, pureBlackDarkMode);
  };

  const setPureBlackDarkMode = (pureBlack: boolean) => {
    setPureBlackState(pureBlack);
    saveStoredThemePreferences(themeMode, themePreset, pureBlack);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        themePreset,
        pureBlackDarkMode,
        setThemeMode,
        setThemePreset,
        setPureBlackDarkMode,
        colors,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
