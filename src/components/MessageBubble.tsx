'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className="grid grid-cols-12 gap-x-4 w-full mb-5">
      <div
        className={`col-span-12 ${
          isUser ? 'items-end' : 'items-start'
        } flex flex-col`}
      >
        <div className="flex items-start gap-2 w-full">
          <div
            className={
              isUser
                ? 'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs max-w-full bg-blue-600 text-white rounded-tr-xs ml-auto'
                : 'w-full text-sm leading-relaxed text-neutral-800 dark:text-neutral-100'
            }
          >
          {isUser ? (
            <div className="whitespace-pre-wrap select-text break-words font-sans">{content}</div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
