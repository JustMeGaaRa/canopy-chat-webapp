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

const DEPRECATED_MODELS = new Set([
  'claude-3-7-sonnet-latest',
  'claude-3-5-sonnet-latest',
  'claude-3-5-haiku-latest',
  'claude-3-opus-latest',
  'claude-sonnet-4-0',
  'claude-opus-4-0',
  'gpt-4o',
  'gpt-4o-mini',
  'o1',
  'o3-mini',
  'o1-2024-12-17',
  'o1-pro-2025-03-19',
  'o3-mini-2025-01-31',
  'gemini-3.5-flash-medium',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
]);

const DEFAULT_MODELS_FOR_PROVIDER: Record<string, string> = {
  claude: 'claude-sonnet-4-6',
  openai: 'gpt-5.5',
  gemini: 'gemini-3.5-flash',
};

const DEFAULT_SETTINGS: AppSettings = {
  providerId: 'claude',
  modelId: 'claude-sonnet-4-6',
  providerApiKey: '',
  providerKeys: {
    claude: '',
    openai: '',
    gemini: '',
  },
  providerModels: {
    claude: [
      'claude-opus-4-7',
      'claude-sonnet-4-6',
      'claude-haiku-4-5',
    ],
    openai: [
      'gpt-5.5',
      'gpt-5.5-pro',
      'gpt-5.4-mini',
      'gpt-5.4-nano',
    ],
    gemini: [
      'gemini-3.5-flash',
      'gemini-3.1-pro',
      'gemini-3.1-flash-lite',
      'gemini-omni-flash',
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

    // Filter out deprecated models from user's custom lists
    const cleanProviderModels: Record<string, string[]> = {};
    const defaultProvModels = DEFAULT_SETTINGS.providerModels;

    for (const key of ['claude', 'openai', 'gemini']) {
      const parsedModels = parsed?.providerModels?.[key] || [];
      const cleaned = parsedModels.filter((m) => !DEPRECATED_MODELS.has(m));
      const defaults = defaultProvModels[key as keyof typeof defaultProvModels];
      // Merge defaults with user's remaining custom models
      cleanProviderModels[key] = Array.from(new Set([...defaults, ...cleaned]));
    }

    let finalModelId = parsed?.modelId || DEFAULT_SETTINGS.modelId;
    const finalProviderId = parsed?.providerId || DEFAULT_SETTINGS.providerId;

    if (DEPRECATED_MODELS.has(finalModelId)) {
      finalModelId = DEFAULT_MODELS_FOR_PROVIDER[finalProviderId] || DEFAULT_SETTINGS.modelId;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      modelId: finalModelId,
      providerKeys: { ...DEFAULT_SETTINGS.providerKeys, ...parsed?.providerKeys },
      providerModels: cleanProviderModels,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}
