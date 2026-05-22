'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '@/lib/settings';
import { getOPFSSettings, saveOPFSSettings, DEFAULT_SETTINGS } from '@/lib/storage/opfs-settings';

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
      let opfsSettings: AppSettings | null = null;
      let hasOPFSSettings = false;

      // 1. Try to load from OPFS
      try {
        if (
          typeof window !== 'undefined' &&
          typeof navigator !== 'undefined' &&
          navigator.storage
        ) {
          const root = await navigator.storage.getDirectory();
          // Check if settings.json already exists
          try {
            await root.getFileHandle('settings.json');
            opfsSettings = await getOPFSSettings();
            hasOPFSSettings = true;
          } catch {
            // settings.json does not exist
          }
        }
      } catch (err) {
        console.error('Error checking OPFS settings:', err);
      }

      // 2. Fetch server-side settings/keys info
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();

        // If not found in OPFS, migrate server settings if they exist
        if (!hasOPFSSettings && data.settings) {
          opfsSettings = data.settings;
          await saveOPFSSettings(opfsSettings!);
        }

        const finalSettings = opfsSettings || DEFAULT_SETTINGS;
        setSettings(finalSettings);

        const serverEnvKeys = data.envKeys || { claude: false, openai: false, gemini: false };
        setEnvKeys(serverEnvKeys);

        const providerId = finalSettings.providerId || 'claude';
        const savedKey = (finalSettings.providerKeys?.[providerId] || '').trim();
        const hasKey = !!savedKey || !!serverEnvKeys[providerId as keyof typeof serverEnvKeys];
        setHasKey(hasKey);
      } else {
        // Fallback when API call fails (e.g. server is down or error)
        const finalSettings = opfsSettings || DEFAULT_SETTINGS;
        setSettings(finalSettings);
        const providerId = finalSettings.providerId || 'claude';
        const savedKey = (finalSettings.providerKeys?.[providerId] || '').trim();
        setHasKey(!!savedKey);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Absolute fallback
      const opfsSettings = await getOPFSSettings();
      setSettings(opfsSettings);
      const providerId = opfsSettings.providerId || 'claude';
      const savedKey = (opfsSettings.providerKeys?.[providerId] || '').trim();
      setHasKey(!!savedKey);
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
      // Save directly to browser OPFS
      await saveOPFSSettings(merged);

      // Re-calculate hasKey based on local changes + existing envKeys
      const providerId = merged.providerId || 'claude';
      const savedKey = (merged.providerKeys?.[providerId] || '').trim();
      const keyExists = !!savedKey || !!envKeys[providerId as keyof typeof envKeys];
      setHasKey(keyExists);
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
