'use client';

import { useSettings } from './useSettings';

export const translations = {
  en: {
    // SettingsModal
    settingsTitle: 'Settings',
    appearanceLabel: 'Appearance',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    aiProviderLabel: 'AI Provider Configuration',
    activeProviderLabel: 'Active Provider',
    anthropicApiKeyLabel: 'Anthropic API Key',
    openaiApiKeyLabel: 'OpenAI API Key',
    geminiApiKeyLabel: 'Gemini API Key',
    apiKeyOverridePlaceholder: 'Enter API key override for {provider}...',
    keyLoadedFromEnv: 'Loaded from environment',
    localSaveNotice: 'Your key is saved locally in your user configuration file and is never uploaded elsewhere.',
    modelsManagementLabel: 'Models Management per Provider',
    configureProviderLabel: 'Configure Provider:',
    noModelsRegistered: 'No models registered. Add one below.',
    removeModelTitle: 'Remove model',
    enterModelPlaceholder: 'Enter new model ID...',
    addBtn: 'Add',
    graphRingSpacingLabel: 'Graph Ring Spacing',
    languageLabel: 'Language',
    languageSelectLabel: 'App Language',
    langEn: 'English',
    langUk: 'Ukrainian',
    cancelBtn: 'Cancel',
    saveBtn: 'Save Changes',

    // ChatList
    openSidebar: 'Open Sidebar',
    closeSidebar: 'Close Sidebar',
    newChat: 'New Chat',
    recent: 'Recent',
    untitledChat: 'Untitled Chat',
    deleteChat: 'Delete Chat',
    settings: 'Settings',

    // ChatThread
    user: 'User',
    assistant: 'Assistant',
    apiKeyRequired: '{provider} API Key Required',
    apiKeyRequiredDesc: 'Canopy relies on {provider} to generate responses. Please set the {envVar} variable in your .env.local file, or click the button below to provide a key override in settings.',
    openSettings: 'Open Settings',
    openConversations: 'Open Conversations',
    newConversation: 'New Conversation',
    loadingChat: 'Loading Chat...',
    viewGraph: 'View Graph',
    welcomeTitle: 'Welcome to Canopy',
    welcomeDesc: 'Start chatting below. You can click on any message or node in the radial graph on the right to branch out and create parallel lines of conversation.',
    branchingFrom: 'Branching from:',
    dismiss: 'Dismiss',
    textareaPlaceholder: 'Ask anything...',
    addContext: 'Add context',
    voiceInput: 'Voice input',
    speechAlert: 'Speech typing functionality is not configured.',
    sendMessage: 'Send message',

    // GraphView
    noActiveTree: 'No active tree. Start typing in the chat to generate a radial conversation layout.',
    closeGraph: 'Close Graph',
    backToChat: 'Back to Chat',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    centreReset: 'Centre & Reset Zoom',

    // MessageBubble
    copyToClipboard: 'Copy to clipboard',
    moreActions: 'More actions',
    bookmark: 'Bookmark',
    unbookmark: 'Unbookmark',
    delete: 'Delete',
    bookmarkedMsg: 'Bookmarked message',
  },
  uk: {
    // SettingsModal
    settingsTitle: 'Налаштування',
    appearanceLabel: 'Зовнішній вигляд',
    themeLight: 'Світла',
    themeDark: 'Темна',
    themeSystem: 'Системна',
    aiProviderLabel: 'Налаштування AI-провайдерів',
    activeProviderLabel: 'Активний провайдер',
    anthropicApiKeyLabel: 'API-ключ Anthropic',
    openaiApiKeyLabel: 'API-ключ OpenAI',
    geminiApiKeyLabel: 'API-ключ Gemini',
    apiKeyOverridePlaceholder: 'Введіть ключ для {provider}...',
    keyLoadedFromEnv: 'Завантажено з оточення',
    localSaveNotice: 'Ваш ключ зберігається локально у файлі конфігурації та нікуди не завантажується.',
    modelsManagementLabel: 'Управління моделями',
    configureProviderLabel: 'Налаштувати провайдера:',
    noModelsRegistered: 'Моделей не зареєстровано. Додайте нижче.',
    removeModelTitle: 'Видалити модель',
    enterModelPlaceholder: 'Введіть новий ID моделі...',
    addBtn: 'Додати',
    graphRingSpacingLabel: 'Відстань між кільцями графа',
    languageLabel: 'Мова',
    languageSelectLabel: 'Мова програми',
    langEn: 'Англійська',
    langUk: 'Українська',
    cancelBtn: 'Скасувати',
    saveBtn: 'Зберегти зміни',

    // ChatList
    openSidebar: 'Відкрити бічну панель',
    closeSidebar: 'Закрити бічну панель',
    newChat: 'Новий чат',
    recent: 'Нещодавні',
    untitledChat: 'Без назви',
    deleteChat: 'Видалити чат',
    settings: 'Налаштування',

    // ChatThread
    user: 'Користувач',
    assistant: 'Асистент',
    apiKeyRequired: 'Необхідно вказати API-ключ {provider}',
    apiKeyRequiredDesc: 'Canopy використовує {provider} для генерації відповідей. Будь ласка, встановіть змінну {envVar} у вашому файлі .env.local або натисніть кнопку нижче, щоб додати ключ у налаштуваннях.',
    openSettings: 'Відкрити налаштування',
    openConversations: 'Відкрити розмови',
    newConversation: 'Нова розмова',
    loadingChat: 'Завантаження чату...',
    viewGraph: 'Переглянути граф',
    welcomeTitle: 'Ласкаво просимо до Canopy',
    welcomeDesc: 'Почніть спілкування нижче. Ви можете натиснути на будь-яке повідомлення або вузол на радіальному графі праворуч, щоб створити нову гілку розмови.',
    branchingFrom: 'Гілка від:',
    dismiss: 'Приховати',
    textareaPlaceholder: 'Запитайте про що завгодно...',
    addContext: 'Додати контекст',
    voiceInput: 'Голосове введення',
    speechAlert: 'Функція голосового введення не налаштована.',
    sendMessage: 'Надіслати повідомлення',

    // GraphView
    noActiveTree: 'Немає активного дерева. Почніть писати в чаті, щоб згенерувати радіальну карту розмови.',
    closeGraph: 'Закрити граф',
    backToChat: 'Назад до чату',
    zoomIn: 'Збільшити',
    zoomOut: 'Зменшити',
    centreReset: 'Центрувати та скинути масштаб',

    // MessageBubble
    copyToClipboard: 'Копіювати в буфер',
    moreActions: 'Більше дій',
    bookmark: 'Зберегти',
    unbookmark: 'Вилучити зі збереженого',
    delete: 'Видалити',
    bookmarkedMsg: 'Збережене повідомлення',
  },
};

export function useTranslation() {
  const { settings } = useSettings();
  const lang = settings?.language || 'en';

  const t = (key: keyof typeof translations['en'], params?: Record<string, string>) => {
    let text = translations[lang]?.[key] || translations['en']?.[key] || (key as string);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), v);
      });
    }
    return text;
  };

  return { t, lang };
}
