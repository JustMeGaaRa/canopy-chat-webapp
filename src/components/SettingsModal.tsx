import React, { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/hooks/useTranslation';
import { X, Moon, Sun, Monitor, Shield, Settings2, Trash2, Languages } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, envKeys } = useSettings();
  const { t } = useTranslation();
  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [localSpacing, setLocalSpacing] = useState(90);
  const [localLanguage, setLocalLanguage] = useState<'en' | 'uk'>('en');

  // New fields
  const [localProviderId, setLocalProviderId] = useState('claude');
  const [localModelId, setLocalModelId] = useState('');
  const [localProviderKeys, setLocalProviderKeys] = useState<Record<string, string>>({
    claude: '',
    openai: '',
    gemini: '',
  });
  const [localProviderModels, setLocalProviderModels] = useState<Record<string, string[]>>({
    claude: [],
    openai: [],
    gemini: [],
  });

  // UI helper states
  const [modelConfigProvider, setModelConfigProvider] = useState('claude');
  const [newModelName, setNewModelName] = useState('');

  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalTheme(settings.theme);
      setLocalSpacing(settings.graphRingSpacing);
      setLocalLanguage(settings.language || 'en');
      setLocalProviderId(settings.providerId || 'claude');
      setLocalModelId(settings.modelId || '');

      setLocalProviderKeys({
        claude: settings.providerKeys?.claude || settings.providerApiKey || '',
        openai: settings.providerKeys?.openai || '',
        gemini: settings.providerKeys?.gemini || '',
      });

      setLocalProviderModels({
        claude: settings.providerModels?.claude || [],
        openai: settings.providerModels?.openai || [],
        gemini: settings.providerModels?.gemini || [],
      });
    }
  }, [settings, isOpen]);

  if (!isOpen || !settings) return null;

  const handleSave = async () => {
    let finalModelId = localModelId;
    if (!finalModelId) {
      const models = localProviderModels[localProviderId] || [];
      if (models.length > 0) {
        finalModelId = models[0];
      }
    }

    await updateSettings({
      theme: localTheme,
      providerId: localProviderId,
      modelId: finalModelId,
      providerKeys: localProviderKeys,
      providerModels: localProviderModels,
      providerApiKey: localProviderKeys.claude, // Legacy safety
      graphRingSpacing: localSpacing,
      language: localLanguage,
    });
    onClose();
  };

  const getProviderLabel = (provId: string) => {
    if (provId === 'claude') return 'Anthropic Claude';
    if (provId === 'openai') return 'OpenAI';
    return 'Google Gemini';
  };

  const getApiKeyLabel = (provId: string) => {
    if (provId === 'claude') return t('anthropicApiKeyLabel');
    if (provId === 'openai') return t('openaiApiKeyLabel');
    return t('geminiApiKeyLabel');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl transition-all dark:border-neutral-800 dark:bg-neutral-900 mx-4 sm:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 pt-6 pb-4 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 font-sans">
              {t('settingsTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
          {/* Section 1: Appearance */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t('appearanceLabel')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as const).map((tValue) => {
                const getLabel = () => {
                  if (tValue === 'light') return t('themeLight');
                  if (tValue === 'dark') return t('themeDark');
                  return t('themeSystem');
                };
                return (
                  <button
                    key={tValue}
                    onClick={() => setLocalTheme(tValue)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium capitalize transition-all ${
                      localTheme === tValue
                        ? 'border-blue-500 bg-blue-50/50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    {tValue === 'light' && <Sun className="h-4 w-4" />}
                    {tValue === 'dark' && <Moon className="h-4 w-4" />}
                    {tValue === 'system' && <Monitor className="h-4 w-4" />}
                    {getLabel()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Language */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t('languageLabel')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['en', 'uk'] as const).map((lValue) => {
                const getLabel = () => {
                  if (lValue === 'en') return t('langEn');
                  return t('langUk');
                };
                return (
                  <button
                    key={lValue}
                    onClick={() => setLocalLanguage(lValue)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium capitalize transition-all ${
                      localLanguage === lValue
                        ? 'border-blue-500 bg-blue-50/50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <Languages className="h-4 w-4" />
                    {getLabel()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: AI Provider */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t('aiProviderLabel')}
            </label>
            <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('activeProviderLabel')}
                </label>
                <select
                  value={localProviderId}
                  onChange={(e) => {
                    const nextProv = e.target.value;
                    setLocalProviderId(nextProv);
                    const provModels = localProviderModels[nextProv] || [];
                    if (provModels.length > 0) {
                      setLocalModelId(provModels[0]);
                    }
                  }}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 cursor-pointer"
                >
                  <option value="claude">Anthropic Claude</option>
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-neutral-400" />
                    {getApiKeyLabel(localProviderId)}
                  </label>
                  {envKeys?.[localProviderId] && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold">
                      {t('keyLoadedFromEnv')}
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder={t('apiKeyOverridePlaceholder', { provider: getProviderLabel(localProviderId) })}
                  value={localProviderKeys[localProviderId] || ''}
                  onChange={(e) => {
                    setLocalProviderKeys({
                      ...localProviderKeys,
                      [localProviderId]: e.target.value,
                    });
                  }}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                />
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal">
                  {t('localSaveNotice')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Model Names Management */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t('modelsManagementLabel')}
            </label>
            <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
              <div className="flex gap-2 items-center">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                  {t('configureProviderLabel')}
                </span>
                <select
                  value={modelConfigProvider}
                  onChange={(e) => setModelConfigProvider(e.target.value)}
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 cursor-pointer"
                >
                  <option value="claude">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>

              {/* Models List */}
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 border border-neutral-200/40 dark:border-neutral-800/40 rounded-xl p-2 bg-white dark:bg-neutral-950/20 scrollbar-thin">
                {(localProviderModels[modelConfigProvider] || []).length === 0 ? (
                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center py-4">
                    {t('noModelsRegistered')}
                  </div>
                ) : (
                  (localProviderModels[modelConfigProvider] || []).map((mId) => (
                    <div
                      key={mId}
                      className="flex items-center justify-between px-2 py-1 bg-neutral-100/50 dark:bg-neutral-800/30 rounded-lg text-xs"
                    >
                      <span
                        className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 truncate max-w-[200px]"
                        title={mId}
                      >
                        {mId}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentModels = localProviderModels[modelConfigProvider] || [];
                          const updatedModels = currentModels.filter((m) => m !== mId);

                          setLocalProviderModels({
                            ...localProviderModels,
                            [modelConfigProvider]: updatedModels,
                          });

                          if (localModelId === mId) {
                            setLocalModelId(updatedModels[0] || '');
                          }
                        }}
                        className="text-red-500 hover:text-red-600 dark:hover:text-red-400 font-semibold cursor-pointer px-1"
                        title={t('removeModelTitle')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Model Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('enterModelPlaceholder')}
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 focus:border-blue-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = newModelName.trim();
                      if (trimmed) {
                        const current = localProviderModels[modelConfigProvider] || [];
                        if (!current.includes(trimmed)) {
                          setLocalProviderModels({
                            ...localProviderModels,
                            [modelConfigProvider]: [...current, trimmed],
                          });
                          setNewModelName('');
                        }
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = newModelName.trim();
                    if (trimmed) {
                      const current = localProviderModels[modelConfigProvider] || [];
                      if (!current.includes(trimmed)) {
                        setLocalProviderModels({
                          ...localProviderModels,
                          [modelConfigProvider]: [...current, trimmed],
                        });
                        setNewModelName('');
                      }
                    }
                  }}
                  className="rounded-xl bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                >
                  {t('addBtn')}
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Graph Spacing */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {t('graphRingSpacingLabel')}
              </label>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {localSpacing}px
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400">60px</span>
              <input
                type="range"
                min="60"
                max="150"
                value={localSpacing}
                onChange={(e) => setLocalSpacing(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 dark:bg-neutral-800 accent-blue-500"
              />
              <span className="text-xs text-neutral-400">150px</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-neutral-100 px-6 pb-6 pt-4 dark:border-neutral-800 shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50 transition"
          >
            {t('cancelBtn')}
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-blue-600 px-4.5 py-2 text-sm font-medium text-white hover:bg-blue-500 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition"
          >
            {t('saveBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
