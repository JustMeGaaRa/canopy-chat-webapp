'use client';

import React from 'react';
import { GitFork, Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'} mb-5`}>
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        <div
          className={`rounded-full p-0.5 ${
            isUser
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400'
          }`}
        >
          {isUser ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
        </div>
        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-sans">
          {isUser ? 'You' : 'Assistant'}
        </span>
      </div>

      <div className="flex items-start gap-2 max-w-[85%] md:max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-xs'
              : 'bg-white text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100 border border-neutral-200/60 dark:border-neutral-700/60 rounded-tl-xs'
          }`}
        >
          <div className="whitespace-pre-wrap select-text break-words font-sans">{content}</div>
        </div>
      </div>
    </div>
  );
}
