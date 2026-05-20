'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { X, Moon, Sun, Monitor, Shield, Settings2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [localApiKey, setLocalApiKey] = useState('');
  const [localSpacing, setLocalSpacing] = useState(90);

  useEffect(() => {
    if (settings) {
      setLocalTheme(settings.theme);
      setLocalApiKey(settings.providerApiKey || '');
      setLocalSpacing(settings.graphRingSpacing);
    }
  }, [settings]);

  if (!isOpen || !settings) return null;

  const handleSave = async () => {
    await updateSettings({
      theme: localTheme,
      providerApiKey: localApiKey,
      graphRingSpacing: localSpacing,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl transition-all dark:border-neutral-800 dark:bg-neutral-900 mx-4 sm:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 font-sans">
              Settings
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
        <div className="flex-1 overflow-y-auto pr-1 my-6 space-y-6 scrollbar-thin">
          {/* Section 1: Appearance */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Appearance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLocalTheme(t)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium capitalize transition-all ${
                    localTheme === t
                      ? 'border-blue-500 bg-blue-50/50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  {t === 'light' && <Sun className="h-4 w-4" />}
                  {t === 'dark' && <Moon className="h-4 w-4" />}
                  {t === 'system' && <Monitor className="h-4 w-4" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: AI Provider */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              AI Provider Configuration
            </label>
            <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
              <div className="space-y-1">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Active Provider
                </span>
                <div className="text-sm font-semibold text-neutral-950 dark:text-neutral-50 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Anthropic Claude (claude-sonnet-4-5)
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <Shield className="h-3 w-3 text-neutral-400" />
                    Anthropic API Key
                  </label>
                  {process.env.NEXT_PUBLIC_HAS_ENV_KEY && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                      Loaded from environment
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="Enter your api key override..."
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-blue-500"
                />
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal">
                  Your key is saved locally in your user configuration file and is never uploaded
                  elsewhere.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Graph Spacing */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Graph Ring Spacing
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
        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800 shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-blue-600 px-4.5 py-2 text-sm font-medium text-white hover:bg-blue-500 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
