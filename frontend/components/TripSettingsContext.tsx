import React, { createContext, useContext, useState } from 'react';

export interface TripSettings {
  startDate: Date;
  days: number;
}

interface TripSettingsContextType {
  settings: TripSettings;
  update: (s: Partial<TripSettings>) => void;
}

const defaultSettings: TripSettings = {
  startDate: new Date(),
  days: 4,
};

const TripSettingsContext = createContext<TripSettingsContextType | undefined>(undefined);

export const TripSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<TripSettings>(defaultSettings);

  const update = (s: Partial<TripSettings>) => setSettings(prev => ({ ...prev, ...s }));

  return (
    <TripSettingsContext.Provider value={{ settings, update }}>
      {children}
    </TripSettingsContext.Provider>
  );
};

export const useTripSettings = () => {
  const ctx = useContext(TripSettingsContext);
  if (!ctx) throw new Error('useTripSettings must be inside provider');
  return ctx;
};
