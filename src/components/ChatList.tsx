'use client';

import React from 'react';
import { ChatMeta } from '@/lib/storage/types';
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight, Settings } from 'lucide-react';

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
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`relative flex h-full flex-col border-r border-neutral-200 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-900/60 transition-all duration-300 ${
        isCollapsed ? 'w-[60px]' : 'w-[260px]'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex h-14 items-center justify-between px-3.5 border-b border-neutral-200/60 dark:border-neutral-800/60">
        {!isCollapsed && (
          <span className="text-sm font-bold tracking-wide text-neutral-800 dark:text-neutral-200 font-sans uppercase">
            Canopy
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className={`rounded-lg p-1 text-neutral-500 hover:bg-neutral-200/50 dark:text-neutral-400 dark:hover:bg-neutral-800/50 transition hidden md:block ${
            isCollapsed ? 'mx-auto' : ''
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4.5 w-4.5" />
          ) : (
            <ChevronLeft className="h-4.5 w-4.5" />
          )}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className={`flex items-center justify-center gap-2 rounded-xl bg-blue-600 font-medium text-white hover:bg-blue-500 shadow-md shadow-blue-500/5 hover:shadow-blue-500/15 transition-all duration-200 ${
            isCollapsed ? 'h-10 w-10 p-0' : 'w-full py-2.5 px-4 text-sm'
          }`}
          title="New Chat"
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Chats Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
        {chats.map((chat) => {
          const isActive = chat.id === activeChatId;
          return (
            <div
              key={chat.id}
              className={`group relative flex items-center rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-neutral-200/60 text-neutral-900 dark:bg-neutral-800/80 dark:text-neutral-50'
                  : 'text-neutral-600 hover:bg-neutral-200/30 dark:text-neutral-400 dark:hover:bg-neutral-800/40'
              }`}
            >
              <button
                onClick={() => onSelectChat(chat.id)}
                className={`flex flex-1 items-center gap-3 text-left overflow-hidden ${
                  isCollapsed ? 'justify-center p-3' : 'p-3 pr-10'
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate text-xs font-semibold leading-snug">
                      {chat.title || 'Untitled Chat'}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                      <span>{formatDate(chat.updatedAt)}</span>
                      <span>•</span>
                      <span>{chat.nodeCount} nodes</span>
                    </div>
                  </div>
                )}
              </button>

              {/* Delete button (hidden on collapse) */}
              {!isCollapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-300/40 hover:text-red-500 dark:hover:bg-neutral-700/50 dark:hover:text-red-400 transition"
                  title="Delete Chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="mt-auto border-t border-neutral-200/60 p-3 dark:border-neutral-800/60">
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-3 rounded-xl p-2.5 text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50 transition w-full ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Open Settings"
        >
          <Settings className="h-4.5 w-4.5 shrink-0" />
          {!isCollapsed && <span className="text-xs font-semibold">Settings</span>}
        </button>
      </div>
    </div>
  );
}
