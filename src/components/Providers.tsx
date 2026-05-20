'use client';

import React from 'react';
import { SettingsProvider } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';

function AppThemeInitializer({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AppThemeInitializer>{children}</AppThemeInitializer>
    </SettingsProvider>
  );
}
