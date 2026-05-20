import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface AppSettings {
  providerId: string;
  providerApiKey?: string;
  theme: 'light' | 'dark' | 'system';
  graphRingSpacing: number;
}

const SETTINGS_FILE = path.join(os.homedir(), '.canopy', 'settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  providerId: 'claude',
  providerApiKey: '',
  theme: 'system',
  graphRingSpacing: 90,
};

export async function getSettings(): Promise<AppSettings> {
  try {
    await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(data) as AppSettings;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}
