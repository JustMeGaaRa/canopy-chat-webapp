'use client';

import React from 'react';
import { ChatMeta } from '@/lib/storage/types';
import { Plus, Trash2, Settings, Menu } from 'lucide-react';

interface ChatListProps {
  chats: ChatMeta[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
}

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
    <defs>
      <linearGradient id="gemini-sparkle" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="9%" stopColor="#4285F4" />
        <stop offset="48%" stopColor="#9B72CB" />
        <stop offset="78%" stopColor="#D96570" />
        <stop offset="100%" stopColor="#F3AF3D" />
      </linearGradient>
    </defs>
    <path fill="url(#gemini-sparkle)" d="M12 2Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2" />
  </svg>
);

const CollapseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 fill-none stroke-current"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <path d="M16 15l-3-3 3-3" />
  </svg>
);

const ExpandIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 fill-none stroke-current"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <path d="M13 9l3 3-3 3" />
  </svg>
);

export default function ChatList({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
}: ChatListProps) {
  return (
    <div
      className={`relative flex h-full flex-col transition-all duration-300 ease-in-out select-none ${
        isCollapsed
          ? 'w-[68px] bg-white dark:bg-[#131314]'
          : 'w-[280px] bg-[#f0f4f9] dark:bg-[#1e1f20]'
      }`}
    >
      {/* Sidebar Header */}
      {isCollapsed ? (
        <div className="flex flex-col items-center pt-3 pb-2 shrink-0">
          <button
            onClick={onToggleCollapse}
            className="group flex h-12 w-12 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-[#2c2d30]/60 dark:hover:text-neutral-100 transition cursor-pointer"
            title="Відкрити бічну панель"
          >
            <div className="group-hover:hidden">
              <SparkleIcon />
            </div>
            <div className="hidden group-hover:block">
              <ExpandIcon />
            </div>
          </button>
        </div>
      ) : (
        <div className="flex h-14 items-center justify-between px-4.5 shrink-0">
          <div className="flex items-center gap-2 font-sans font-semibold text-lg text-neutral-800 dark:text-neutral-200 tracking-tight">
            <SparkleIcon />
            <span>Canopy</span>
          </div>
          <button
            onClick={onToggleCollapse}
            className="hidden md:block rounded-full p-2 text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-[#2c2d30]/60 dark:hover:text-neutral-100 transition cursor-pointer"
            title="Закрити бічну панель"
          >
            <CollapseIcon />
          </button>
        </div>
      )}

      {/* Top Action Items */}
      {isCollapsed ? (
        <div className="flex flex-col items-center py-2 shrink-0">
          <button
            onClick={onNewChat}
            className="flex h-12 w-12 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-[#2c2d30]/60 dark:hover:text-neutral-100 transition cursor-pointer"
            title="Новий чат"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="px-4.5 py-2 shrink-0">
          <div className="py-1">
            <button
              onClick={onNewChat}
              className="inline-flex items-center gap-3 rounded-full bg-neutral-200/30 hover:bg-neutral-200/60 dark:bg-neutral-800/20 dark:hover:bg-neutral-800/55 py-2 px-4.5 text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 transition-all duration-200 cursor-pointer"
              title="Новий чат"
            >
              <Plus className="h-4.5 w-4.5 shrink-0 text-neutral-500 dark:text-neutral-400" />
              <span>Новий чат</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Chats Scroll Area (Only shown when expanded) */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto mt-4 scrollbar-thin">
          <div className="px-7.5 mb-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider select-none">
            Нещодавні
          </div>
          <div className="space-y-0.5 px-3">
            {chats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <div
                  key={chat.id}
                  className={`group relative flex items-center rounded-full transition-all duration-150 ${
                    isActive
                      ? 'bg-neutral-200/80 dark:bg-[#2c2d30] text-neutral-900 dark:text-neutral-50'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-[#2c2d30]/60'
                  }`}
                >
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className="flex flex-1 items-center text-left overflow-hidden py-2 px-4 pr-10 rounded-full cursor-pointer"
                  >
                    <span className="truncate text-[13px] font-medium leading-snug">
                      {chat.title || 'Untitled Chat'}
                    </span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="absolute right-2.5 opacity-0 group-hover:opacity-100 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-300/40 hover:text-red-500 dark:hover:bg-neutral-700/50 dark:hover:text-red-400 transition cursor-pointer"
                    title="Delete Chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sidebar Footer */}
      {isCollapsed ? (
        <div className="mt-auto flex flex-col items-center py-4 shrink-0">
          <button
            onClick={onOpenSettings}
            className="flex h-12 w-12 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-[#2c2d30]/60 dark:hover:text-neutral-100 transition cursor-pointer"
            title="Налаштування"
          >
            <Settings className="h-5 w-5 shrink-0" />
          </button>
        </div>
      ) : (
        <div className="mt-auto p-3 shrink-0">
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center gap-3 rounded-full px-4.5 py-2.5 text-[13px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-[#2c2d30]/60 transition cursor-pointer"
            title="Налаштування"
          >
            <Settings className="h-4.5 w-4.5 shrink-0 text-neutral-500 dark:text-neutral-400" />
            <span>Налаштування</span>
          </button>
        </div>
      )}
    </div>
  );
}
