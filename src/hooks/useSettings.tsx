'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '@/lib/settings';

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  hasKey: boolean;
  envKeys: Record<string, boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);
  const [envKeys, setEnvKeys] = useState<Record<string, boolean>>({
    claude: false,
    openai: false,
    gemini: false,
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setHasKey(data.hasKey);
        if (data.envKeys) {
          setEnvKeys(data.envKeys);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!settings) return;
    const merged = { ...settings, ...newSettings };

    // Optimistic update
    setSettings(merged);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setHasKey(data.hasKey);
        if (data.envKeys) {
          setEnvKeys(data.envKeys);
        }
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, hasKey, envKeys }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
