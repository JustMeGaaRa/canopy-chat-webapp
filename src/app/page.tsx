'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import ChatList from '@/components/ChatList';
import ChatThread from '@/components/ChatThread';
import GraphView from '@/components/GraphView';
import SettingsModal from '@/components/SettingsModal';

export default function Home() {
  const {
    chats,
    activeChat,
    activeChatId,
    selectedNodeId,
    streaming,
    streamingText,
    isNewChatMode,
    selectNode,
    startNewChat,
    deleteChat,
    sendMessage,
    error,
    setError,
    setActiveChatId,
    toggleBookmark,
    deleteNode,
  } = useChat();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLeftMobileOpen, setIsLeftMobileOpen] = useState(false);
  const [isRightMobileOpen, setIsRightMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Resizing and collapsing states for Graph View panel
  const [graphWidth, setGraphWidth] = useState(400);
  const [isGraphCollapsed, setIsGraphCollapsed] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const hasResizedRef = useRef(false);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const maxWidth = window.innerWidth * 0.5;
      if (newWidth >= 280 && newWidth <= maxWidth) {
        setGraphWidth(newWidth);
        hasResizedRef.current = true;
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle auto-collapsing sidebar on medium screens (768px - 1024px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
        setIsSidebarCollapsed(true);
      } else if (window.innerWidth > 1024) {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update graphWidth based on layout (sidebar and mobile states)
  useEffect(() => {
    const updateGraphWidth = () => {
      const sidebarWidth = isMobile ? 0 : isSidebarCollapsed ? 68 : 280;
      const defaultWidth = (window.innerWidth - sidebarWidth) / 2;

      setGraphWidth((prev) => {
        const maxWidth = window.innerWidth * 0.5;
        if (hasResizedRef.current) {
          return Math.min(prev, maxWidth);
        } else {
          return defaultWidth;
        }
      });
    };

    updateGraphWidth();
    window.addEventListener('resize', updateGraphWidth);
    return () => window.removeEventListener('resize', updateGraphWidth);
  }, [isSidebarCollapsed, isMobile]);

  return (
    <main className="flex h-dvh w-screen overflow-hidden bg-white text-neutral-900 dark:bg-[#131314] dark:text-neutral-50 transition-colors duration-200">
      {/* Mobile Left Drawer Backdrop */}
      {isLeftMobileOpen && (
        <div
          onClick={() => setIsLeftMobileOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Mobile Right Bottom Sheet Backdrop */}
      {isRightMobileOpen && (
        <div
          onClick={() => setIsRightMobileOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Left Sidebar Panel (Chat List) */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 md:static md:translate-x-0 shrink-0 ${
          isLeftMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={(id) => {
            setActiveChatId(id);
            setIsLeftMobileOpen(false);
          }}
          onNewChat={() => {
            startNewChat();
            setIsLeftMobileOpen(false);
          }}
          onDeleteChat={deleteChat}
          isCollapsed={isMobile ? false : isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Main Split Layout: Middle & Right Panels */}
      <div className="relative flex-1 flex overflow-hidden">

        {/* Middle Panel: Active Conversation Thread */}
        <div className="flex-1 h-full min-w-0 md:w-1/2 lg:flex-1">
          <ChatThread
            activeChat={activeChat}
            selectedNodeId={selectedNodeId}
            streaming={streaming}
            streamingText={streamingText}
            isNewChatMode={isNewChatMode}
            onSendMessage={sendMessage}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenSidebarMobile={() => setIsLeftMobileOpen(true)}
            onOpenGraphMobile={() => setIsRightMobileOpen(true)}
            error={error}
            setError={setError}
            isGraphCollapsed={isGraphCollapsed}
            onToggleGraph={() => {
              if (isGraphCollapsed) {
                hasResizedRef.current = false;
              }
              setIsGraphCollapsed(!isGraphCollapsed);
            }}
            onToggleBookmark={toggleBookmark}
            onDeleteNode={deleteNode}
          />
        </div>

        {/* Resizing Handle Bar (Desktop only, when graph not collapsed) */}
        {!isGraphCollapsed && (
          <div
            onMouseDown={startResize}
            className="hidden lg:block w-1 hover:w-1.5 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/80 dark:hover:bg-blue-500/85 active:bg-blue-600 transition-all duration-150 z-20"
          />
        )}

        {/* Right Panel: Radial Tree Graph Map */}
        <div
          style={{ width: isMobile ? '100%' : isGraphCollapsed ? '0px' : `${graphWidth}px` }}
          className={`fixed inset-x-0 bottom-0 h-[50dvh] z-30 bg-white dark:bg-[#131314] border-t border-neutral-200 dark:border-neutral-800 transition-transform duration-300 md:static md:h-full md:translate-y-0 md:border-t-0 lg:shrink-0 overflow-hidden ${
            isRightMobileOpen ? 'translate-y-0' : 'translate-y-full'
          } ${isResizing ? '' : 'transition-all duration-300'}`}
        >
          <GraphView
            activeChat={activeChat}
            selectedNodeId={selectedNodeId}
            onSelectNode={selectNode}
            onCloseMobile={() => setIsRightMobileOpen(false)}
            isCollapsed={isMobile ? !isRightMobileOpen : isGraphCollapsed}
            onToggleCollapse={() => {
              if (isGraphCollapsed) {
                hasResizedRef.current = false;
              }
              setIsGraphCollapsed(!isGraphCollapsed);
            }}
          />
        </div>
      </div>

      {/* Global Settings Modal Overlay */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </main>
  );
}
