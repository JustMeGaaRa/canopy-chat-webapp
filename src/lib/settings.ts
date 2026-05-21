import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface AppSettings {
  providerId: string;
  modelId: string;
  providerApiKey?: string;
  providerKeys: Record<string, string>;
  providerModels: Record<string, string[]>;
  theme: 'light' | 'dark' | 'system';
  graphRingSpacing: number;
}

const SETTINGS_FILE = path.join(os.homedir(), '.canopy', 'settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  providerId: 'claude',
  modelId: 'claude-3-5-sonnet-latest',
  providerApiKey: '',
  providerKeys: {
    claude: '',
    openai: '',
    gemini: '',
  },
  providerModels: {
    claude: [
      'claude-3-7-sonnet-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
      'claude-3-opus-latest',
    ],
    openai: [
      'gpt-4o',
      'gpt-4o-mini',
      'o1',
      'o3-mini',
    ],
    gemini: [
      'gemini-3.5-flash-medium',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
  },
  theme: 'system',
  graphRingSpacing: 90,
};

export async function getSettings(): Promise<AppSettings> {
  try {
    await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(data) as AppSettings;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      providerKeys: { ...DEFAULT_SETTINGS.providerKeys, ...parsed?.providerKeys },
      providerModels: { ...DEFAULT_SETTINGS.providerModels, ...parsed?.providerModels },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}
