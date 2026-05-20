'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Chat, ChatNode } from '@/lib/storage/types';
import MessageBubble from './MessageBubble';
import { useSettings } from '@/hooks/useSettings';
import { Send, GitFork, AlertCircle, Settings, HelpCircle, Menu, Network, Bot } from 'lucide-react';

interface ChatThreadProps {
  activeChat: Chat | null;
  selectedNodeId: string | null;
  streaming: boolean;
  streamingText: string;
  isNewChatMode: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onOpenSettings: () => void;
  onOpenSidebarMobile: () => void;
  onOpenGraphMobile: () => void;
  error: string | null;
  setError: (err: string | null) => void;
}

export default function ChatThread({
  activeChat,
  selectedNodeId,
  streaming,
  streamingText,
  isNewChatMode,
  onSendMessage,
  onOpenSettings,
  onOpenSidebarMobile,
  onOpenGraphMobile,
  error,
  setError,
}: ChatThreadProps) {
  const { hasKey } = useSettings();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute children counts to identify branch points
  const childrenCounts = React.useMemo(() => {
    if (!activeChat) return {};
    const counts: Record<string, number> = {};
    activeChat.nodes.forEach((node) => {
      if (node.parentId !== null) {
        counts[node.parentId] = (counts[node.parentId] || 0) + 1;
      }
    });
    return counts;
  }, [activeChat]);

  // Compute Selected Path: Root -> ... -> SelectedNode (+ its assistant reply when it exists)
  const pathNodes = React.useMemo(() => {
    if (!activeChat || !selectedNodeId) return [];
    const nodesMap = new Map(activeChat.nodes.map((n) => [n.id, n]));

    const selectedNode = nodesMap.get(selectedNodeId);
    if (!selectedNode) return [];

    // Walk ancestor chain from the selected node up to root
    const path: ChatNode[] = [];
    let currentId: string | null = selectedNodeId;
    while (currentId !== null) {
      const node = nodesMap.get(currentId);
      if (!node) break;
      path.unshift(node);
      currentId = node.parentId;
    }

    // If the selected node is a user message, also show its assistant reply (if present)
    if (selectedNode.role === 'user') {
      const assistantReply = activeChat.nodes.find(
        (n) => n.parentId === selectedNode.id && n.role === 'assistant'
      );
      if (assistantReply) {
        path.push(assistantReply);
      }
    }

    return path;
  }, [activeChat, selectedNodeId]);

  // Check if selectedNode is the latest leaf
  const isLatestLeaf = React.useMemo(() => {
    if (!activeChat || !selectedNodeId) return true;
    // If it has children, it's not a leaf
    if ((childrenCounts[selectedNodeId] || 0) > 0) return false;
    // Check if it's the newest node overall
    const sorted = [...activeChat.nodes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0]?.id === selectedNodeId;
  }, [activeChat, selectedNodeId, childrenCounts]);

  // Selected node snippet for branching notice
  const selectedNodeSnippet = React.useMemo(() => {
    if (!activeChat || !selectedNodeId) return '';
    const node = activeChat.nodes.find((n) => n.id === selectedNodeId);
    if (!node) return '';
    const text = node.content;
    return text.length > 50 ? `${text.substring(0, 47)}...` : text;
  }, [activeChat, selectedNodeId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [pathNodes, streamingText, streaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || streaming || !hasKey) return;

    setSending(true);
    const content = input;
    setInput('');
    try {
      await onSendMessage(content);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Missing API Key View
  if (!hasKey) {
    return (
      <div className="flex h-full flex-col bg-white dark:bg-neutral-950">
        {/* Mobile Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-neutral-200/60 dark:border-neutral-800/60 md:hidden shrink-0">
          <button
            onClick={onOpenSidebarMobile}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Canopy</span>
          <button
            onClick={onOpenSettings}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-5">
          <div className="rounded-full bg-red-50 p-4 text-red-500 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-10 w-10 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-sans">
            Anthropic API Key Required
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
            Canopy relies on Anthropic Claude to generate responses. Please set the{' '}
            <code className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono text-xs">
              ANTHROPIC_API_KEY
            </code>{' '}
            variable in your{' '}
            <code className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono text-xs">
              .env.local
            </code>{' '}
            file, or click the button below to provide a key override.
          </p>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-500/10 transition"
          >
            <Settings className="h-4.5 w-4.5" />
            <span>Open Settings</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-950">
      {/* Header bar */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-neutral-200/60 dark:border-neutral-800/60 shrink-0 select-none bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          {/* Mobile Sidebar Hamburger */}
          <button
            onClick={onOpenSidebarMobile}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition md:hidden"
            title="Open Conversations"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100 font-sans truncate">
            {isNewChatMode ? 'New Conversation' : activeChat?.title || 'Loading Chat...'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mobile Graph View Toggle */}
          <button
            onClick={onOpenGraphMobile}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition md:hidden"
            title="View Graph"
          >
            <Network className="h-5 w-5" />
          </button>

          <button
            onClick={onOpenSettings}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition"
            title="Open Settings"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Message feed scroll container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800"
      >
        {isNewChatMode || pathNodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8 space-y-4 select-none">
            <div className="rounded-full bg-blue-50/80 dark:bg-blue-950/20 p-4 text-blue-500">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 font-sans">
              Welcome to Canopy
            </h2>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 max-w-sm font-sans leading-relaxed">
              Start chatting below. You can click on any message or node in the radial graph on the
              right to branch out and create parallel lines of conversation.
            </p>
          </div>
        ) : (
          <>
            {pathNodes.map((node) => (
              <MessageBubble
                key={node.id}
                role={node.role}
                content={node.content}
              />
            ))}

            {/* AI Streaming Response bubble */}
            {streaming && streamingText && (
              <MessageBubble role="assistant" content={streamingText} />
            )}

            {/* AI Loading Bubble (if stream hasn't output text yet) */}
            {streaming && !streamingText && (
              <div className="flex w-full flex-col items-start mb-4">
                <div className="flex items-center gap-1 mb-1">
                  <div className="rounded-full p-0.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <Bot className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-sans">
                    Assistant
                  </span>
                </div>
                <div className="rounded-2xl bg-white border border-neutral-100 px-4.5 py-3 text-sm dark:bg-neutral-800 dark:border-neutral-700/60 rounded-tl-xs shadow-xs">
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.2s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Message input panel */}
      <div className="border-t border-neutral-200/60 p-4 dark:border-neutral-800/60 bg-white dark:bg-neutral-950">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-2">
          {/* Branch notice indicator */}
          {!isNewChatMode && !isLatestLeaf && selectedNodeSnippet && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-400 transition-all font-sans font-medium">
              <GitFork className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Branching from:{' '}
                <strong className="font-semibold italic">"{selectedNodeSnippet}"</strong>
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-red-50 border border-red-200/80 p-3 text-xs text-red-800 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400 font-sans font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                <span className="leading-normal">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400 shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="relative flex items-center">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Send a message..."
              disabled={sending || streaming}
              className="w-full resize-none rounded-2xl border border-neutral-200 bg-white py-3.5 pl-4 pr-12 text-sm text-neutral-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:focus:border-blue-500 max-h-36 font-sans"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending || streaming}
              className="absolute right-2 rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-500 disabled:bg-neutral-100 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600 transition shadow-xs"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
