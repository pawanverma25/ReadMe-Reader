import React, { createContext, useContext, useEffect, useState } from 'react';
import { ReaderSettings } from '../types';
import { INITIAL_SETTINGS } from '../utils/sampleData';
import { getStoredSettings, saveStoredSettings } from '../utils/storage';

interface ReaderContextType {
  settings: ReaderSettings;
  updateSettings: (newSettings: Partial<ReaderSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export const ReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<ReaderSettings>(INITIAL_SETTINGS);

  useEffect(() => {
    getStoredSettings().then((s) => setSettingsState(s));
  }, []);

  const updateSettings = async (newSettings: Partial<ReaderSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    await saveStoredSettings(updated);
  };

  const resetSettings = async () => {
    setSettingsState(INITIAL_SETTINGS);
    await saveStoredSettings(INITIAL_SETTINGS);
  };

  return (
    <ReaderContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ReaderContext.Provider>
  );
};

export const useReaderSettings = () => {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error('useReaderSettings must be used within a ReaderProvider');
  }
  return context;
};
