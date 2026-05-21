'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { zoom, zoomIdentity } from 'd3-zoom';
import type { ZoomBehavior } from 'd3-zoom';
import { select } from 'd3-selection';
import { Chat, ChatNode } from '@/lib/storage/types';
import { useSettings } from '@/hooks/useSettings';
import { computeRadialLayout } from '@/lib/graph-layout';
import { GitFork, ZoomIn, ZoomOut, Target } from 'lucide-react';

const CollapseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="15" y1="3" x2="15" y2="21" />
    <path d="M8 9l3 3-3 3" />
  </svg>
);



interface GraphViewProps {
  activeChat: Chat | null;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function GraphView({
  activeChat,
  selectedNodeId,
  onSelectNode,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: GraphViewProps) {
  const { settings } = useSettings();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const ringSpacing = settings?.graphRingSpacing || 90;

  // --- Build a virtual tree of user-only nodes ---
  // Each user node's parentId is remapped to the nearest ancestor user node,
  // skipping over any assistant nodes in between.
  const userNodes = useMemo((): ChatNode[] => {
    if (!activeChat) return [];
    const allNodes = activeChat.nodes;
    const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

    return allNodes
      .filter((n) => n.role === 'user')
      .map((node) => {
        // Walk up the parent chain to find the nearest user ancestor
        let virtualParentId: string | null = null;
        let cur = node.parentId;
        while (cur !== null) {
          const parent = nodeMap.get(cur);
          if (!parent) break;
          if (parent.role === 'user') {
            virtualParentId = parent.id;
            break;
          }
          cur = parent.parentId;
        }
        return { ...node, parentId: virtualParentId };
      });
  }, [activeChat]);

  // The "selected user node" — if the user selects an assistant node (by
  // loading a chat whose selectedNodeId points to one), map it back to its
  // parent user node so the correct circle is highlighted.
  const selectedUserNodeId = useMemo((): string | null => {
    if (!selectedNodeId || !activeChat) return null;
    const node = activeChat.nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    if (node.role === 'user') return node.id;
    // assistant → parent is the user node
    return node.parentId;
  }, [selectedNodeId, activeChat]);

  // Radial layout over the virtual user-only tree
  const layout = useMemo(
    () => computeRadialLayout(userNodes, ringSpacing, 0, 0),
    [userNodes, ringSpacing]
  );

  // Active path: set of user node IDs from root to currently selected user node
  const activePathSet = useMemo(() => {
    const active = new Set<string>();
    if (!selectedUserNodeId) return active;
    const nodeMap = new Map(userNodes.map((n) => [n.id, n]));
    let cur: string | null = selectedUserNodeId;
    while (cur !== null) {
      active.add(cur);
      const node = nodeMap.get(cur);
      cur = node ? node.parentId : null;
    }
    return active;
  }, [userNodes, selectedUserNodeId]);

  // How many user-node children each user node has (for branch-point indicator)
  const childrenCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    userNodes.forEach((n) => {
      if (n.parentId !== null) {
        counts[n.parentId] = (counts[n.parentId] || 0) + 1;
      }
    });
    return counts;
  }, [userNodes]);

  // Maximum depth for concentric rings
  const maxDepth = useMemo(() => {
    let max = 0;
    Object.values(layout).forEach((p) => {
      if (p.depth > max) max = p.depth;
    });
    return max;
  }, [layout]);

  // D3 zoom + pan setup
  useEffect(() => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on('zoom', (event) => {
        select(g).attr('transform', event.transform.toString());
      });

    zoomBehaviorRef.current = zoomBehavior;
    const d3Svg = select(svg);
    d3Svg.call(zoomBehavior);

    const centerGraph = () => {
      const container = containerRef.current;
      if (!container) return;
      const width = container.clientWidth || 400;
      const height = container.clientHeight || 500;
      const initialTransform = zoomIdentity.translate(width / 2, height / 2).scale(1.0);
      d3Svg.call(zoomBehavior.transform, initialTransform);
    };

    centerGraph();
    const timer = setTimeout(centerGraph, 350); // Wait for transition animation to end (300ms)

    const resizeObserver = new ResizeObserver(() => {
      const container = containerRef.current;
      if (container && container.clientWidth > 0 && container.clientHeight > 0) {
        centerGraph();
      }
    });

    const container = containerRef.current;
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [activeChat?.id, isCollapsed]);

  const handleZoomIn = () => {
    const svg = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svg || !zb) return;
    select(svg).call(zb.scaleBy, 1.25);
  };

  const handleZoomOut = () => {
    const svg = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svg || !zb) return;
    select(svg).call(zb.scaleBy, 0.8);
  };

  const handleCenter = () => {
    const svg = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svg || !zb) return;
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 500;
    select(svg).call(zb.transform, zoomIdentity.translate(width / 2, height / 2).scale(1.0));
  };

  // ── Collapsed rail ──────────────────────────────────────────────────────────
  if (isCollapsed) {
    return null;
  }

  // ── Concentric rings ────────────────────────────────────────────────────────
  const ringCount = Math.max(maxDepth, 3);
  const ringElements = Array.from({ length: ringCount }, (_, i) => i + 1).map((d) => (
    <circle
      key={`ring-${d}`}
      cx={0}
      cy={0}
      r={d * ringSpacing}
      fill="none"
      stroke="currentColor"
      className="text-neutral-200/50 dark:text-neutral-800/40"
      strokeDasharray="4 4"
      strokeWidth={1}
    />
  ));

  // Truncate node label to first 4 words
  const getLabel = (content: string) => {
    const words = content.trim().split(/\s+/);
    return words.length <= 4 ? content : words.slice(0, 4).join(' ') + '…';
  };

  // ── Main render ─────────────────────────────────────────────────────────────
  const isEmpty = !activeChat || userNodes.length === 0;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-neutral-50/30 dark:bg-neutral-950/20 select-none">
      {/* Dot-grid background — behind everything */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none z-0" />

      {isEmpty ? (
        <div className="absolute inset-0 z-20 flex h-full items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/30 p-6 text-center select-none">
          <div className="max-w-xs space-y-2">
            <GitFork className="mx-auto h-8 w-8 text-neutral-300 dark:text-neutral-700" />
            <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 font-sans">
              No active tree. Start typing in the chat to generate a radial conversation layout.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Collapse button — z-20 to sit above SVG */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="absolute top-3 left-3 z-20 hidden lg:flex items-center justify-center rounded-full p-2 text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-[#2c2d30]/60 dark:hover:text-neutral-100 transition cursor-pointer"
              title="Закрити бічну панель"
            >
              <CollapseIcon />
            </button>
          )}

          {/* Zoom / centre controls — z-20 */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col sm:flex-row gap-2 pointer-events-auto">
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="rounded-xl bg-white border border-neutral-200/60 px-3 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 transition shadow-sm md:hidden"
                title="Back to Chat"
              >
                Close Graph
              </button>
            )}

            <div className="flex bg-white border border-neutral-200/60 dark:bg-neutral-900 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm divide-x divide-neutral-200/60 dark:divide-neutral-800">
              <button
                onClick={handleZoomIn}
                className="p-2 text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={handleCenter}
                className="p-2 text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="Centre & Reset Zoom"
              >
                <Target className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* SVG — z-10, sits above dot grid but below buttons */}
      <svg
        ref={svgRef}
        className="absolute inset-0 z-10 h-full w-full cursor-grab active:cursor-grabbing outline-none"
      >
        <g ref={gRef}>
          {/* Concentric rings */}
          {ringElements}

          {/* Edges — user node to parent user node */}
          {userNodes.map((node) => {
            if (!node.parentId) return null;
            const posC = layout[node.id];
            const posP = layout[node.parentId];
            if (!posC || !posP) return null;

            const isActive = activePathSet.has(node.id) && activePathSet.has(node.parentId);
            // Bezier control point at parent-ring radius along the child angle
            const parentRad = posP.depth * ringSpacing;
            const xm = parentRad * Math.cos(posC.angle);
            const ym = parentRad * Math.sin(posC.angle);

            return (
              <path
                key={`edge-${node.id}`}
                d={`M ${posP.x} ${posP.y} Q ${xm} ${ym} ${posC.x} ${posC.y}`}
                fill="none"
                stroke="currentColor"
                className={
                  isActive
                    ? 'text-blue-500 opacity-100 transition-all duration-300'
                    : 'text-neutral-300 dark:text-neutral-700 opacity-50 transition-all duration-300'
                }
                strokeWidth={isActive ? 2.5 : 1.5}
              />
            );
          })}

          {/* User-message nodes */}
          {userNodes.map((node) => {
            const pos = layout[node.id];
            if (!pos) return null;

            const isSelected = node.id === selectedUserNodeId;
            const isActivePath = activePathSet.has(node.id);
            const isBranchPoint = (childrenCounts[node.id] || 0) > 1;

            const nodeFill = isSelected
              ? 'fill-amber-500'
              : isActivePath
                ? 'fill-blue-500'
                : 'fill-blue-300 dark:fill-blue-800/50';

            const nodeStroke = isSelected
              ? 'stroke-amber-600 dark:stroke-amber-400'
              : isActivePath
                ? 'stroke-blue-600 dark:stroke-blue-400'
                : 'stroke-blue-200 dark:stroke-blue-800/40';

            const offsetDist = 14;
            const textX = pos.x + offsetDist * Math.cos(pos.angle);
            const textY = pos.y + offsetDist * Math.sin(pos.angle);
            const textAnchor = Math.cos(pos.angle) < 0 ? 'end' : 'start';

            return (
              <g
                key={`node-${node.id}`}
                className="group cursor-pointer select-none"
                onClick={() => onSelectNode(node.id)}
              >
                {/* Larger transparent hit area */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={18}
                  fill="transparent"
                  className="hover:fill-blue-500/5 transition-all"
                />

                {/* Main node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? 7 : 5.5}
                  className={`transition-all duration-200 ${nodeFill} ${nodeStroke}`}
                  strokeWidth={isSelected ? 3 : isActivePath ? 2 : 1}
                />

                {/* Branch dot indicator (white inner dot) */}
                {isBranchPoint && !isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={2}
                    fill="white"
                    className="pointer-events-none"
                  />
                )}

                {/* Label */}
                <text
                  x={textX}
                  y={textY}
                  dy="0.31em"
                  textAnchor={textAnchor}
                  className={`text-[9px] font-medium font-mono pointer-events-none select-none transition-all duration-200 ${
                    isSelected
                      ? 'fill-amber-600 dark:fill-amber-400 font-bold'
                      : isActivePath
                        ? 'fill-neutral-800 dark:fill-neutral-200'
                        : 'fill-neutral-400/80 dark:fill-neutral-600 group-hover:fill-neutral-600 dark:group-hover:fill-neutral-400'
                  }`}
                >
                  {getLabel(node.content)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
