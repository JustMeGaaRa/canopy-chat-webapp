'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Copy, Check, MoreHorizontal, Bookmark, Trash2 } from 'lucide-react';

interface MessageBubbleProps {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function MessageBubble({
  id,
  role,
  content,
  createdAt,
  isBookmarked,
  onToggleBookmark,
  onDelete,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formattedTime, setFormattedTime] = useState('');

  useEffect(() => {
    if (createdAt) {
      try {
        const date = new Date(createdAt);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormattedTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error(err);
      }
    }
  }, [createdAt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  return (
    <div
      id={id ? `msg-${id}` : undefined}
      className="group relative grid grid-cols-12 gap-x-4 w-full mb-5 px-3 py-2 hover:bg-neutral-50/40 dark:hover:bg-neutral-900/10 rounded-2xl transition-all duration-200"
    >
      <div className={`col-span-12 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-start gap-2 w-full">
          {isUser ? (
            <div className="flex flex-col items-end max-w-[85%] ml-auto relative">
              {/* User Message Bubble */}
              <div className="relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs max-w-full bg-blue-600 text-white rounded-tr-xs ml-auto">
                <div className="whitespace-pre-wrap select-text break-words font-sans">
                  {content}
                </div>

                {/* Floating Bookmark Badge on top-left corner of the bubble */}
                {isBookmarked && (
                  <div
                    className="absolute -left-2 -top-2 bg-amber-500 text-white dark:bg-amber-400 dark:text-neutral-900 rounded-full p-1 shadow-md z-10 flex items-center justify-center border border-white dark:border-[#131314]"
                    title={t('bookmarkedMsg')}
                  >
                    <Bookmark className="h-3 w-3 fill-current" />
                  </div>
                )}
              </div>

              {/* Message Actions & Sent Time - Always at the bottom (Visible on Hover) */}
              <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 mt-1.5 shrink-0 select-none">
                {formattedTime && (
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono px-1.5 select-none">
                    {formattedTime}
                  </span>
                )}

                <button
                  onClick={handleCopy}
                  className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
                  title={t('copyToClipboard')}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>

                {id && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
                      title={t('moreActions')}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </button>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 mt-1 w-36 rounded-xl border border-neutral-200/80 bg-white p-1 shadow-lg dark:border-neutral-800/80 dark:bg-neutral-950 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                          <button
                            onClick={() => {
                              onToggleBookmark?.(id);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
                          >
                            <Bookmark
                              className={`h-3.5 w-3.5 ${
                                isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-neutral-400'
                              }`}
                            />
                            <span>{isBookmarked ? t('unbookmark') : t('bookmark')}</span>
                          </button>
                          <button
                            onClick={() => {
                              onDelete?.(id);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{t('delete')}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full relative">
              {/* Floating Bookmark Badge on top-left of the assistant message box */}
              {isBookmarked && (
                <div
                  className="absolute -left-2 -top-2 bg-amber-500 text-white dark:bg-amber-400 dark:text-neutral-900 rounded-full p-1 shadow-md z-10 flex items-center justify-center border border-white dark:border-[#131314]"
                  title={t('bookmarkedMsg')}
                >
                  <Bookmark className="h-3 w-3 fill-current" />
                </div>
              )}

              {/* Assistant Message Bubble (Markdown) */}
              <div className="w-full text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">
                <div className="prose prose-sm dark:prose-invert select-text break-words font-sans max-w-none prose-p:my-1.5 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5 prose-li:my-0.5 prose-pre:my-2 prose-pre:p-0 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none prose-code:bg-neutral-100 prose-code:dark:bg-neutral-700/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-blockquote:border-l-2 prose-blockquote:border-emerald-400 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-neutral-500 prose-table:text-xs prose-th:font-semibold">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      pre({ children }) {
                        return (
                          <pre className="rounded-xl overflow-x-auto bg-neutral-900 dark:bg-neutral-950 border border-neutral-700/60 text-xs my-2">
                            {children}
                          </pre>
                        );
                      },
                      code({ className, children, ...props }) {
                        const isBlock = className?.startsWith('language-');
                        if (isBlock) {
                          return (
                            <code className={`${className} block p-3`} {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <code
                            className="bg-neutral-100 dark:bg-neutral-700/60 px-1 py-0.5 rounded text-xs font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      a({ href, children }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2"
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Assistant Message Actions & Sent Time - Always at the bottom (Visible on Hover) */}
              <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 mt-1.5 self-start shrink-0 select-none">
                {formattedTime && (
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono px-1.5 select-none">
                    {formattedTime}
                  </span>
                )}

                <button
                  onClick={handleCopy}
                  className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
                  title={t('copyToClipboard')}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
