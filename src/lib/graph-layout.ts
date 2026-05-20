import { ChatNode } from './storage/types';

export interface Position {
  x: number;
  y: number;
  angle: number; // in radians
  depth: number;
}

export type LayoutMap = Record<string, Position>;

export function computeRadialLayout(
  nodes: ChatNode[],
  ringSpacing: number,
  cx: number = 0,
  cy: number = 0
): LayoutMap {
  if (nodes.length === 0) {
    return {};
  }

  // 1. Build adjacency list: parentId -> children[]
  const childrenMap: Record<string, ChatNode[]> = {};
  const rootNodes: ChatNode[] = [];

  for (const node of nodes) {
    if (node.parentId === null) {
      rootNodes.push(node);
    } else {
      if (!childrenMap[node.parentId]) {
        childrenMap[node.parentId] = [];
      }
      childrenMap[node.parentId].push(node);
    }
  }

  // If no root node was found, fallback to the oldest node
  let root = rootNodes[0];
  if (!root && nodes.length > 0) {
    root = [...nodes].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
  }

  if (!root) {
    return {};
  }

  // Sort children by creation date to maintain consistent layouts
  for (const parentId in childrenMap) {
    childrenMap[parentId].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  // 2. BFS/DFS to compute subtree sizes
  const subtreeSizes: Record<string, number> = {};

  function calculateSubtreeSize(nodeId: string): number {
    let size = 1;
    const children = childrenMap[nodeId] || [];
    for (const child of children) {
      size += calculateSubtreeSize(child.id);
    }
    subtreeSizes[nodeId] = size;
    return size;
  }

  calculateSubtreeSize(root.id);

  // 3. Assign angles & positions
  const layout: LayoutMap = {};

  function assignLayout(nodeId: string, depth: number, startAngle: number, endAngle: number) {
    const angle = (startAngle + endAngle) / 2;
    const radius = depth * ringSpacing;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    layout[nodeId] = { x, y, angle, depth };

    const children = childrenMap[nodeId] || [];
    if (children.length === 0) return;

    let totalSubtreeSize = 0;
    for (const child of children) {
      totalSubtreeSize += subtreeSizes[child.id] || 0;
    }

    let currentStartAngle = startAngle;
    const sectorSize = endAngle - startAngle;

    for (const child of children) {
      const childSize = subtreeSizes[child.id] || 1;
      const childSectorSize = sectorSize * (childSize / totalSubtreeSize);
      const childEndAngle = currentStartAngle + childSectorSize;

      assignLayout(child.id, depth + 1, currentStartAngle, childEndAngle);

      currentStartAngle = childEndAngle;
    }
  }

  // Root starts at depth 0, gets the full 360 degrees (0 to 2*PI)
  assignLayout(root.id, 0, 0, 2 * Math.PI);

  return layout;
}
