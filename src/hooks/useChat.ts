'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Chat, ChatMeta, ChatNode } from '@/lib/storage/types';

export function useChat(initialChatId?: string | null) {
  const router = useRouter();
  const [chats, setChats] = useState<ChatMeta[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(
    initialChatId ?? null
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewChatMode, setIsNewChatMode] = useState(!initialChatId);
  const skipNextLoadRef = useRef(false);

  // Wrapper: update local state AND push URL
  const setActiveChatId = useCallback(
    (id: string | null) => {
      setActiveChatIdState(id);
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
        const res = await fetch('/api/chats');
        if (!res.ok) throw new Error('Failed to load chats list');
        const data = await res.json();
        setChats(data.chats);

        // Handle auto-selecting active chat
        if (selectLatestId) {
          setActiveChatIdState(selectLatestId);
        } else if (data.chats.length > 0 && !activeChatId && !isNewChatMode) {
          setActiveChatId(data.chats[0].id);
        } else if (data.chats.length === 0) {
          setIsNewChatMode(true);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [activeChatId, isNewChatMode, setActiveChatId]
  );

  // Load details for single chat
  const loadChat = useCallback(async (id: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/chats/${id}`);
      if (!res.ok) throw new Error('Failed to load chat details');
      const data = await res.json();
      setActiveChat(data.chat);
      setSelectedNodeId(data.chat.selectedNodeId);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  }, []);

  // Fetch initial chats list
  useEffect(() => {
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
      setActiveChat(null);
      setSelectedNodeId(null);
    }
  }, [activeChatId, loadChat]);

  // Select node in active chat
  const selectNode = useCallback(
    async (nodeId: string | null) => {
      setSelectedNodeId(nodeId);
      if (!activeChatId || isNewChatMode) return;

      // Persist selected node on server
      try {
        await fetch(`/api/chats/${activeChatId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedNodeId: nodeId }),
        });
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
    setActiveChatIdState(null);
    setActiveChat(null);
    setSelectedNodeId(null);
    setError(null);
    router.push('/');
  }, [router]);

  // Delete chat
  const deleteChat = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/chats/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete chat');

        if (activeChatId === id) {
          setActiveChatIdState(null);
          setActiveChat(null);
          setSelectedNodeId(null);
          router.push('/');
        }

        await loadChatsList();
      } catch (err: any) {
        console.error(err);
        setError(err.message);
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
          const res = await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newChat),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to create chat');
          }
          skipNextLoadRef.current = true;
          setIsNewChatMode(false);
          setActiveChatIdState(chatId);
          setActiveChat(newChat);
          // Navigate to the new chat's URL
          router.push(`/chat/${chatId}`);
        } catch (err: any) {
          setError(err.message);
          return;
        }
      }

      setStreaming(true);
      setStreamingText('');

      // Optimistically insert user message in local view
      const tempUserNodeId = window.crypto.randomUUID();
      const userNode: ChatNode = {
        id: tempUserNodeId,
        parentId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      setActiveChat((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          nodes: [...prev.nodes, userNode],
          selectedNodeId: tempUserNodeId,
        };
      });
      setSelectedNodeId(tempUserNodeId);

      try {
        const response = await fetch(`/api/chats/${chatId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, parentNodeId: parentId }),
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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setStreaming(false);
        setStreamingText('');
        if (chatId) {
          await loadChat(chatId);
          await loadChatsList(chatId);
        }
      }
    },
    [activeChatId, selectedNodeId, activeChat, isNewChatMode, loadChat, loadChatsList, router]
  );

  return {
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
  };
}
