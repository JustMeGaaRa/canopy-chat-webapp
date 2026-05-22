'use client';

import React from 'react';
import { SettingsProvider } from '@/hooks/useSettings';
import { ChatProvider } from '@/hooks/useChat';
import { useTheme } from '@/hooks/useTheme';

function AppThemeInitializer({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <ChatProvider>
        <AppThemeInitializer>{children}</AppThemeInitializer>
      </ChatProvider>
    </SettingsProvider>
  );
}
