'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Chat, ChatNode } from '@/lib/storage/types';
import MessageBubble from './MessageBubble';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Send,
  GitFork,
  AlertCircle,
  Settings,
  HelpCircle,
  Menu,
  Network,
  Plus,
  Mic,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';

interface ChatThreadProps {
  activeChat: Chat | null;
  selectedNodeId: string | null;
  streaming: boolean;
  streamingText: string;
  isNewChatMode: boolean;
  onSendMessage: (content: string, overrideParentId?: string | null) => Promise<void>;
  onOpenSettings: () => void;
  onOpenSidebarMobile: () => void;
  onOpenGraphMobile: () => void;
  error: string | null;
  setError: (err: string | null) => void;
  isGraphCollapsed?: boolean;
  onToggleGraph?: () => void;
  onToggleBookmark?: (id: string) => Promise<void>;
  onDeleteNode?: (id: string) => Promise<void>;
}

interface TimelinePointProps {
  node: ChatNode;
  isBookmarked: boolean;
  topPercent: number;
  onScrollToMessage: (id: string) => void;
}

function TimelinePoint({ node, isBookmarked, topPercent, onScrollToMessage }: TimelinePointProps) {
  const [hovered, setHovered] = useState(false);
  const { t } = useTranslation();

  const previewText = React.useMemo(() => {
    const text = node.content;
    return text.length > 60 ? `${text.substring(0, 57)}...` : text;
  }, [node.content]);

  return (
    <div
      style={{ top: `${topPercent}%` }}
      className="absolute right-0 w-8 -translate-y-1/2 cursor-pointer h-5 z-30"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onScrollToMessage(node.id)}
    >
      <div
        className={`absolute top-1/2 -translate-y-1/2 transition-all duration-150 ${
          isBookmarked
            ? 'w-3.5 h-[3px] bg-amber-500 dark:bg-amber-400 rounded-l-sm right-0 shadow-xs z-10'
            : 'w-2 h-[1.5px] bg-neutral-300 dark:bg-neutral-700 rounded-full opacity-35 right-[1px] group-hover/timeline:opacity-70 hover:!opacity-100 hover:w-2.5 hover:h-[2.5px] hover:right-0 hover:bg-blue-500 dark:hover:bg-blue-400'
        }`}
      />

      {hovered && (
        <div className="absolute right-7 top-1/2 -translate-y-1/2 bg-neutral-900/90 dark:bg-neutral-800/95 text-white dark:text-neutral-100 text-xs px-3 py-1.5 rounded-lg shadow-lg border border-neutral-700/50 backdrop-blur-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px] pointer-events-none z-50 animate-in fade-in slide-in-from-right-1 duration-150">
          <div className="font-semibold text-[9px] uppercase tracking-wider text-neutral-400 mb-0.5">
            {node.role === 'user' ? t('user') : t('assistant')}
          </div>
          <div className="truncate font-sans">{previewText}</div>
        </div>
      )}
    </div>
  );
}

const MODEL_LABEL_MAP: Record<string, string> = {
  'claude-opus-4-7': 'Claude 4.7 Opus',
  'claude-sonnet-4-6': 'Claude 4.6 Sonnet',
  'claude-haiku-4-5': 'Claude 4.5 Haiku',
  'gpt-5.5': 'GPT-5.5',
  'gpt-5.5-pro': 'GPT-5.5 Pro',
  'gpt-5.4-mini': 'GPT-5.4 Mini',
  'gpt-5.4-nano': 'GPT-5.4 Nano',
  'gemini-3.5-flash': 'Gemini 3.5 Flash',
  'gemini-3.1-pro': 'Gemini 3.1 Pro',
  'gemini-3.1-flash-lite': 'Gemini 3.1 Flash-Lite',
  'gemini-omni-flash': 'Gemini Omni Flash',
};

const formatModelName = (modelId: string) => {
  if (MODEL_LABEL_MAP[modelId]) return MODEL_LABEL_MAP[modelId];
  return modelId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function getMessageIdFromSelection(selection: Selection): string | null {
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  let node: Node | null = range.commonAncestorContainer;
  
  while (node) {
    if (node instanceof HTMLElement) {
      const idAttr = node.getAttribute('id');
      if (idAttr && idAttr.startsWith('msg-')) {
        return idAttr.replace('msg-', '');
      }
    }
    node = node.parentNode;
  }
  return null;
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
  isGraphCollapsed = true,
  onToggleGraph,
  onToggleBookmark,
  onDeleteNode,
}: ChatThreadProps) {
  const { settings, updateSettings, hasKey, envKeys } = useSettings();
  const { t, lang } = useTranslation();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Text selection state for floating "Ask about this" button
  const [selectionState, setSelectionState] = useState<{
    text: string;
    messageId: string;
    rect: {
      top: number;
      bottom: number;
      left: number;
      width: number;
      height: number;
    };
  } | null>(null);

  // Listen to text selection and scrolling
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionState(null);
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setSelectionState(null);
        return;
      }

      const messageId = getMessageIdFromSelection(selection);
      if (!messageId) {
        setSelectionState(null);
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
          setSelectionState(null);
          return;
        }

        // Verify that the selection is visible in the scroll container
        const containerEl = scrollRef.current;
        if (containerEl) {
          const containerRect = containerEl.getBoundingClientRect();
          const isVisible = rect.bottom > containerRect.top && rect.top < containerRect.bottom;
          if (!isVisible) {
            setSelectionState(null);
            return;
          }
        }

        setSelectionState({
          text,
          messageId,
          rect: {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
        });
      } catch (err) {
        console.error('Error getting selection rect:', err);
        setSelectionState(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('resize', handleSelectionChange);

    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleSelectionChange);
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('resize', handleSelectionChange);
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleSelectionChange);
      }
    };
  }, []);

  const handleAskAboutThis = async () => {
    if (!selectionState || !hasKey) return;
    const { text, messageId } = selectionState;
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setSelectionState(null);

    const promptText = lang === 'uk'
      ? `Розкажи більше про ${text}`
      : `Tell me more about ${text}`;

    setSending(true);
    try {
      await onSendMessage(promptText, messageId);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const floatingButtonPosition = React.useMemo(() => {
    if (!selectionState) return null;
    const { rect } = selectionState;
    const buttonWidth = 40; // 38px + border/padding
    const buttonHeight = 40;

    let top = rect.top - buttonHeight - 8;
    if (top < 8) {
      top = rect.bottom + 8;
    }

    let left = rect.left + rect.width / 2 - buttonWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - buttonWidth - 8));

    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  }, [selectionState]);

  const isProviderEnabled = (providerId: string) => {
    if (!settings) return false;
    const hasSavedKey = !!(settings.providerKeys?.[providerId] || '').trim();
    const hasEnvKey = !!envKeys?.[providerId];
    if (providerId === 'claude' && !hasSavedKey && !hasEnvKey) {
      return !!(settings.providerApiKey || '').trim();
    }
    return hasSavedKey || hasEnvKey;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

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

  const [positions, setPositions] = useState<Record<string, number>>({});

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [pathNodes, streamingText, streaming]);

  // Calculate message positions relative to scroll container height
  useEffect(() => {
    const calculatePositions = () => {
      if (!scrollRef.current) return;
      const container = scrollRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerHeight = container.scrollHeight;
      if (containerHeight === 0) return;

      const newPositions: Record<string, number> = {};
      pathNodes.forEach((node) => {
        const el = document.getElementById(`msg-${node.id}`);
        if (el) {
          const elRect = el.getBoundingClientRect();
          const relativeOffsetTop = elRect.top - containerRect.top + container.scrollTop;
          const percent = (relativeOffsetTop / containerHeight) * 100;
          newPositions[node.id] = percent;
        }
      });
      setPositions(newPositions);
    };

    calculatePositions();

    const resizeObserver = new ResizeObserver(() => {
      calculatePositions();
    });

    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
      const chatContainer = scrollRef.current.firstElementChild;
      if (chatContainer) {
        resizeObserver.observe(chatContainer);
      }
    }

    const timer = setTimeout(calculatePositions, 500);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [pathNodes, streaming, streamingText]);

  const handleScrollToMessage = (nodeId: string) => {
    const element = document.getElementById(`msg-${nodeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('animate-pulse-highlight');
      setTimeout(() => {
        element.classList.remove('animate-pulse-highlight');
      }, 2000);
    }
  };

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
  if (!hasKey && settings) {
    const activeProvider = settings.providerId || 'claude';
    const providerLabel =
      activeProvider === 'claude'
        ? 'Anthropic Claude'
        : activeProvider === 'openai'
          ? 'OpenAI'
          : 'Google Gemini';
    const envVarName =
      activeProvider === 'claude'
        ? 'ANTHROPIC_API_KEY'
        : activeProvider === 'openai'
          ? 'OPENAI_API_KEY'
          : 'GEMINI_API_KEY';

    return (
      <div className="flex h-full flex-col bg-white dark:bg-[#131314]">
        {/* Mobile Header */}
        <div className="flex h-14 items-center justify-start gap-2 px-4 border-b border-neutral-200/60 dark:border-neutral-800/60 md:hidden shrink-0">
          <button
            onClick={onOpenSidebarMobile}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Canopy</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-5">
          <div className="rounded-full bg-red-50 p-4 text-red-500 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-10 w-10 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-sans">
            {t('apiKeyRequired', { provider: providerLabel })}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
            {t('apiKeyRequiredDesc', { provider: providerLabel, envVar: envVarName })
              .split(envVarName)
              .map((part, index, arr) => (
                <React.Fragment key={index}>
                  {part}
                  {index < arr.length - 1 && (
                    <code className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono text-xs">
                      {envVarName}
                    </code>
                  )}
                </React.Fragment>
              ))}
          </p>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-500/10 transition"
          >
            <Settings className="h-4.5 w-4.5" />
            <span>{t('openSettings')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#131314]">
      {/* Header bar */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-neutral-200/60 dark:border-neutral-800/60 shrink-0 select-none bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
          {/* Mobile Sidebar Hamburger */}
          <button
            onClick={onOpenSidebarMobile}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition md:hidden shrink-0"
            title={t('openConversations')}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100 font-sans truncate">
            {isNewChatMode ? t('newConversation') : activeChat?.title || t('loadingChat')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile Graph View Toggle */}
          <button
            onClick={onOpenGraphMobile}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition md:hidden"
            title={t('viewGraph')}
          >
            <Network className="h-5 w-5" />
          </button>

          {/* Desktop Graph View Toggle (Open) */}
          {onToggleGraph && isGraphCollapsed && (
            <button
              onClick={onToggleGraph}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition cursor-pointer"
              title={t('openSidebar')}
            >
              <GitFork className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Message feed scroll container wrapper */}
      <div className="relative flex-1 min-h-0 flex">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 md:pr-12 space-y-4 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800"
        >
          {isNewChatMode || pathNodes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-8 space-y-4 select-none">
              <div className="rounded-full bg-blue-50/80 dark:bg-blue-950/20 p-4 text-blue-500">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 font-sans">
                {t('welcomeTitle')}
              </h2>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 max-w-sm font-sans leading-relaxed">
                {t('welcomeDesc')}
              </p>
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto flex flex-col">
              {pathNodes.map((node) => (
                <MessageBubble
                  key={node.id}
                  id={node.id}
                  role={node.role}
                  content={node.content}
                  createdAt={node.createdAt}
                  isBookmarked={node.isBookmarked}
                  onToggleBookmark={onToggleBookmark}
                  onDelete={onDeleteNode}
                />
              ))}

              {/* AI Streaming Response bubble */}
              {streaming && streamingText && (
                <MessageBubble role="assistant" content={streamingText} />
              )}

              {/* AI Loading Bubble (if stream hasn't output text yet) */}
              {streaming && !streamingText && (
                <div className="grid grid-cols-12 gap-x-4 w-full mb-5">
                  <div className="col-span-12 flex flex-col items-start">
                    <div className="w-full text-sm py-1.5 mr-auto">
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.2s]"></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating vertical timeline on the right */}
        {!isNewChatMode && pathNodes.length > 0 && (
          <div className="absolute right-[6px] top-1 bottom-1 w-2.5 rounded-sm border-l border-neutral-200/10 dark:border-neutral-800/10 bg-neutral-50/5 dark:bg-neutral-950/5 flex flex-col items-center z-20 group/timeline select-none hover:bg-neutral-100/10 dark:hover:bg-neutral-950/15 transition-all duration-200">
            {/* Inner relative container to hold points, with vertical inset padding */}
            <div className="absolute inset-y-4 left-0 right-0">
              {pathNodes.map((node, index) => {
                const isBookmarked = !!node.isBookmarked;
                const positionPercent =
                  positions[node.id] !== undefined
                    ? positions[node.id]
                    : pathNodes.length > 1
                      ? (index / (pathNodes.length - 1)) * 100
                      : 50;

                return (
                  <TimelinePoint
                    key={node.id}
                    node={node}
                    isBookmarked={isBookmarked}
                    topPercent={positionPercent}
                    onScrollToMessage={handleScrollToMessage}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Message input panel */}
      <div className="border-t border-neutral-200/60 p-4 dark:border-neutral-800/60 bg-white dark:bg-[#131314]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-2">
          {/* Branch notice indicator */}
          {!isNewChatMode && !isLatestLeaf && selectedNodeSnippet && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-400 transition-all font-sans font-medium">
              <GitFork className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {t('branchingFrom')}{' '}
                <strong className="font-semibold italic">&quot;{selectedNodeSnippet}&quot;</strong>
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
                {t('dismiss')}
              </button>
            </div>
          )}

          <div className="relative flex flex-col w-full rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 p-2 focus-within:border-neutral-300 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-neutral-900/80 transition-all duration-200 shadow-xs">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={t('textareaPlaceholder')}
              disabled={sending || streaming}
              className="w-full resize-none bg-transparent border-0 outline-hidden focus:ring-0 focus:outline-hidden text-sm text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 max-h-36 overflow-y-auto scrollbar-thin font-sans px-3 pt-2 pb-2.5"
            />

            <div className="flex items-center justify-between border-t border-neutral-100/50 dark:border-neutral-800/30 pt-2 px-1 select-none">
              <div className="flex items-center gap-1.5">
                {/* Plus Button */}
                {/* TODO: Add context functionality is currently not supported */}
                <button
                  type="button"
                  className="hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title={t('addContext')}
                >
                  <Plus className="h-4.5 w-4.5" />
                </button>

                {/* Model Selection Dropdown Trigger */}
                {settings && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-950/40 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-all cursor-pointer select-none"
                    >
                      <span>{formatModelName(settings.modelId)}</span>
                      <ChevronDown
                        className={`h-3 w-3 transition-transform duration-200 ${
                          showDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showDropdown && (
                      <div className="absolute left-0 bottom-full mb-2 w-72 rounded-2xl border border-neutral-200/80 bg-white p-2.5 shadow-xl dark:border-neutral-800/80 dark:bg-neutral-900 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 max-h-[280px] overflow-y-auto scrollbar-thin">
                        {Object.entries(settings.providerModels || {}).map(([provId, models]) => {
                          // Filter out models from providers that do not have an API key
                          if (!isProviderEnabled(provId)) return null;

                          const providerLabel =
                            provId === 'claude'
                              ? 'Anthropic'
                              : provId === 'openai'
                                ? 'OpenAI'
                                : 'Google Gemini';

                          return (
                            <div key={provId} className="space-y-1 py-1">
                              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                {providerLabel}
                              </div>
                              {models.map((mId) => (
                                <button
                                  key={mId}
                                  type="button"
                                  onClick={() => {
                                    updateSettings({
                                      providerId: provId,
                                      modelId: mId,
                                    });
                                    setShowDropdown(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition ${
                                    settings.modelId === mId
                                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                                      : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60'
                                  }`}
                                >
                                  <span>{formatModelName(mId)}</span>
                                  {settings.modelId === mId && <Check className="h-3.5 w-3.5" />}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right-aligned Microphone or Send Button */}
              <div>
                {input.trim() ? (
                  <button
                    type="submit"
                    disabled={sending || streaming}
                    className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-500 disabled:bg-neutral-100 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600 transition shadow-sm cursor-pointer"
                    title={t('sendMessage')}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                ) : (
                  /* TODO: Voice input functionality is currently not supported */
                  <button
                    type="button"
                    className="hidden rounded-full bg-neutral-200/60 p-2 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-300/60 dark:hover:bg-neutral-700 transition cursor-pointer"
                    onClick={() => {
                      alert(t('speechAlert'));
                    }}
                    title={t('voiceInput')}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Floating selection "Ask about this" button */}
      {selectionState && floatingButtonPosition && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={handleAskAboutThis}
          style={floatingButtonPosition}
          className="fixed z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 border border-neutral-200 dark:border-neutral-700 shadow-xl hover:bg-blue-50 dark:hover:bg-neutral-700/80 active:scale-95 transition-all duration-150 cursor-pointer animate-in fade-in zoom-in-95 duration-100"
          title={lang === 'uk' ? 'Запитати про це' : 'Ask about this'}
        >
          <Sparkles className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 fill-current" />
        </button>
      )}
    </div>
  );
}
