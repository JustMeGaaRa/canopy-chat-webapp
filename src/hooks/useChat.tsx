'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Chat, ChatMeta, ChatNode } from '@/lib/storage/types';
import { BrowserOPFSChatRepository } from '@/lib/storage/opfs-repository';
import { useSettings } from '@/hooks/useSettings';

const chatRepo = new BrowserOPFSChatRepository();

interface ChatContextType {
  chats: ChatMeta[];
  activeChat: Chat | null;
  activeChatId: string | null;
  selectedNodeId: string | null;
  streaming: boolean;
  streamingText: string;
  loading: boolean;
  error: string | null;
  isNewChatMode: boolean;
  selectNode: (nodeId: string | null) => Promise<void>;
  startNewChat: () => void;
  deleteChat: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveChatId: (id: string | null) => void;
  toggleBookmark: (nodeId: string) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const activeChatId = (params?.id as string) || null;

  const { settings } = useSettings();
  const [chats, setChats] = useState<ChatMeta[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewChatMode, setIsNewChatMode] = useState(!activeChatId);
  const skipNextLoadRef = useRef(false);

  // Keep refs of state to prevent re-creating loadChatsList callback
  const activeChatIdRef = useRef<string | null>(activeChatId);
  const isNewChatModeRef = useRef(isNewChatMode);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    isNewChatModeRef.current = isNewChatMode;
  }, [isNewChatMode]);

  // Wrapper: push URL
  const setActiveChatId = useCallback(
    (id: string | null) => {
      if (id) {
        router.push(`/chat/${id}`);
      } else {
        router.push('/');
      }
    },
    [router]
  );

  // Load chat index listing
  const loadChatsList = useCallback(
    async (selectLatestId?: string) => {
      try {
        let opfsChats = await chatRepo.listChats();

        // One-time automatic migration of chats from local server files to browser OPFS
        if (opfsChats.length === 0) {
          try {
            const res = await fetch('/api/chats');
            if (res.ok) {
              const data = await res.json();
              const serverChats = data.chats as ChatMeta[];
              if (serverChats && serverChats.length > 0) {
                console.log(`Migrating ${serverChats.length} chats from local server to OPFS...`);
                for (const meta of serverChats) {
                  const chatRes = await fetch(`/api/chats/${meta.id}`);
                  if (chatRes.ok) {
                    const chatData = await chatRes.json();
                    if (chatData.chat) {
                      await chatRepo.createChat(chatData.chat);
                    }
                  }
                }
                // Reload after migration
                opfsChats = await chatRepo.listChats();
              }
            }
          } catch (migrateErr) {
            console.error('Automatic chats migration failed:', migrateErr);
          }
        }

        setChats(opfsChats);

        // Handle auto-selecting active chat
        if (selectLatestId) {
          setActiveChatId(selectLatestId);
        } else if (opfsChats.length > 0 && !activeChatIdRef.current && !isNewChatModeRef.current) {
          setActiveChatId(opfsChats[0].id);
        } else if (opfsChats.length === 0) {
          setIsNewChatMode(true);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [setActiveChatId]
  );

  // Load details for single chat
  const loadChat = useCallback(async (id: string) => {
    try {
      setError(null);
      const chat = await chatRepo.getChat(id);
      if (!chat) throw new Error('Failed to load chat details');
      setActiveChat(chat);
      setSelectedNodeId(chat.selectedNodeId);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  // Fetch initial chats list
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChatsList();
  }, [loadChatsList]);

  // Reload chat details when activeChatId changes
  useEffect(() => {
    if (activeChatId) {
      if (skipNextLoadRef.current) {
        skipNextLoadRef.current = false;
        return;
      }
      loadChat(activeChatId);
      setIsNewChatMode(false);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveChat(null);
      setSelectedNodeId(null);
      setIsNewChatMode(true);
    }
  }, [activeChatId, loadChat]);

  // Select node in active chat
  const selectNode = useCallback(
    async (nodeId: string | null) => {
      setSelectedNodeId(nodeId);
      if (!activeChatId || isNewChatMode) return;

      try {
        await chatRepo.updateChat(activeChatId, { selectedNodeId: nodeId });
        setActiveChat((prev) => (prev ? { ...prev, selectedNodeId: nodeId } : null));
      } catch (err) {
        console.error('Failed to persist node selection:', err);
      }
    },
    [activeChatId, isNewChatMode]
  );

  // Trigger New Chat state
  const startNewChat = useCallback(() => {
    setIsNewChatMode(true);
    setActiveChat(null);
    setSelectedNodeId(null);
    setError(null);
    router.push('/');
  }, [router]);

  // Delete chat
  const deleteChat = useCallback(
    async (id: string) => {
      try {
        await chatRepo.deleteChat(id);

        if (activeChatId === id) {
          setActiveChat(null);
          setSelectedNodeId(null);
          router.push('/');
        }

        await loadChatsList();
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [activeChatId, loadChatsList, router]
  );

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      setError(null);

      let chatId = activeChatId;
      let parentId = selectedNodeId;

      if (parentId && activeChat) {
        const selectedNode = activeChat.nodes.find((n) => n.id === parentId);
        if (selectedNode && selectedNode.role === 'user') {
          const assistantReply = activeChat.nodes.find(
            (n) => n.parentId === selectedNode.id && n.role === 'assistant'
          );
          if (assistantReply) {
            parentId = assistantReply.id;
          }
        }
      }

      if (isNewChatMode || !chatId) {
        chatId = window.crypto.randomUUID();
        parentId = null;

        const newChat: Chat = {
          id: chatId,
          title: content.length > 60 ? `${content.substring(0, 57)}...` : content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: [],
          selectedNodeId: null,
        };

        try {
          await chatRepo.createChat(newChat);
          skipNextLoadRef.current = true;
          setIsNewChatMode(false);
          setActiveChat(newChat);
          router.push(`/chat/${chatId}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
          return;
        }
      }

      setStreaming(true);
      setStreamingText('');

      // Create and save user message node in OPFS
      const userNodeId = window.crypto.randomUUID();
      const userNode: ChatNode = {
        id: userNodeId,
        parentId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      const currentChat = activeChat || (await chatRepo.getChat(chatId));
      if (!currentChat) {
        setError('Chat not found');
        setStreaming(false);
        return;
      }

      const updatedNodes = [...currentChat.nodes, userNode];
      let initialTitle = currentChat.title;
      if (currentChat.nodes.length === 0) {
        initialTitle = content.length > 60 ? `${content.substring(0, 57)}...` : content;
      }

      try {
        await chatRepo.updateChat(chatId, {
          nodes: updatedNodes,
          selectedNodeId: userNodeId,
          title: initialTitle,
        });

        // Optimistically update local view
        setActiveChat({
          ...currentChat,
          nodes: updatedNodes,
          selectedNodeId: userNodeId,
          title: initialTitle,
        });
        setSelectedNodeId(userNodeId);
      } catch (err) {
        console.error('Failed to save user message:', err);
        setError('Failed to save message');
        setStreaming(false);
        return;
      }

      // Build conversation history by walking the parent chain
      const history: { role: 'user' | 'assistant'; content: string }[] = [];
      let currentId: string | null = userNodeId;
      while (currentId !== null) {
        const node = updatedNodes.find((n) => n.id === currentId);
        if (!node) break;
        history.unshift({ role: node.role, content: node.content });
        currentId = node.parentId;
      }

      try {
        const activeProviderId = settings?.providerId || 'claude';
        const response = await fetch(`/api/chats/${chatId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history,
            providerId: activeProviderId,
            modelId: settings?.modelId,
            providerApiKey: settings?.providerKeys?.[activeProviderId] || settings?.providerApiKey,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to send message');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response stream not readable');

        const decoder = new TextDecoder();
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulatedText += decoder.decode(value, { stream: true });
          setStreamingText(accumulatedText);
        }

        // Save assistant node in OPFS
        const assistantNodeId = window.crypto.randomUUID();
        const assistantNode: ChatNode = {
          id: assistantNodeId,
          parentId: userNodeId,
          role: 'assistant',
          content: accumulatedText,
          createdAt: new Date().toISOString(),
        };

        const latestChat = await chatRepo.getChat(chatId);
        const latestNodes = latestChat ? latestChat.nodes : updatedNodes;

        await chatRepo.updateChat(chatId, {
          nodes: [...latestNodes, assistantNode],
          selectedNodeId: assistantNodeId,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setStreaming(false);
        setStreamingText('');
        if (chatId) {
          await loadChat(chatId);
          await loadChatsList(chatId);
        }
      }
    },
    [
      activeChatId,
      selectedNodeId,
      activeChat,
      isNewChatMode,
      loadChat,
      loadChatsList,
      router,
      settings,
    ]
  );

  // Toggle bookmark status on a specific node
  const toggleBookmark = useCallback(
    async (nodeId: string) => {
      if (!activeChatId || !activeChat) return;

      const updatedNodes = activeChat.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            isBookmarked: !node.isBookmarked,
          };
        }
        return node;
      });

      try {
        await chatRepo.updateChat(activeChatId, { nodes: updatedNodes });

        setActiveChat((prev) =>
          prev
            ? {
                ...prev,
                nodes: updatedNodes,
              }
            : null
        );
      } catch (err) {
        console.error('Failed to toggle bookmark:', err);
        setError('Failed to update bookmark');
      }
    },
    [activeChatId, activeChat]
  );

  // Delete a specific node and all of its descendants
  const deleteNode = useCallback(
    async (nodeId: string) => {
      if (!activeChatId || !activeChat) return;

      // Find all descendants of nodeId
      const descendants = new Set<string>();
      const queue = [nodeId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        descendants.add(current);
        activeChat.nodes.forEach((n) => {
          if (n.parentId === current) {
            queue.push(n.id);
          }
        });
      }

      // Filter nodes
      const remainingNodes = activeChat.nodes.filter((n) => !descendants.has(n.id));

      // Calculate new selectedNodeId if the current one was deleted
      let newSelectedNodeId = selectedNodeId;
      if (selectedNodeId && descendants.has(selectedNodeId)) {
        const nodeToDelete = activeChat.nodes.find((n) => n.id === nodeId);
        newSelectedNodeId = nodeToDelete ? nodeToDelete.parentId : null;
      }

      try {
        await chatRepo.updateChat(activeChatId, {
          nodes: remainingNodes,
          selectedNodeId: newSelectedNodeId,
        });

        setActiveChat((prev) =>
          prev
            ? {
                ...prev,
                nodes: remainingNodes,
                selectedNodeId: newSelectedNodeId,
              }
            : null
        );
        setSelectedNodeId(newSelectedNodeId);
      } catch (err) {
        console.error('Failed to delete node:', err);
        setError('Failed to delete message');
      }
    },
    [activeChatId, activeChat, selectedNodeId]
  );

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        activeChatId,
        selectedNodeId,
        streaming,
        streamingText,
        loading,
        error,
        isNewChatMode,
        selectNode,
        startNewChat,
        deleteChat,
        sendMessage,
        setError,
        setActiveChatId,
        toggleBookmark,
        deleteNode,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
