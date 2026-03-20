import { useState, useMemo, useCallback } from 'react';
import type { StixCategory, StixObjectType } from '../types/stix';
import { getObjectByType } from '../data/index';

export interface GraphNode {
  id: string;
  type: string;
  name: string;
  category: StixCategory;
  side: 'left' | 'center' | 'right';
  isCenter: boolean;
  depth: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const MAX_EXPANDED = 2;

function formatName(type: string): string {
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getCategoryForType(type: string): StixCategory {
  const obj = getObjectByType(type);
  return obj?.category ?? 'sdo';
}

function buildGraph(
  rootObject: StixObjectType,
  expandedNodes: string[],
  focusType: string | null,
): GraphData {
  const effectiveRoot = focusType ? getObjectByType(focusType) ?? rootObject : rootObject;

  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  // Create center node
  const centerId = `node-${effectiveRoot.type}`;
  nodeMap.set(centerId, {
    id: centerId,
    type: effectiveRoot.type,
    name: effectiveRoot.name,
    category: effectiveRoot.category,
    side: 'center',
    isCenter: true,
    depth: 0,
  });

  // Add outgoing relationship nodes (side: 'right')
  for (const rel of effectiveRoot.relationships.outgoing) {
    for (const targetType of rel.objectTypes) {
      const nodeId = `node-${targetType}`;
      if (!nodeMap.has(nodeId)) {
        nodeMap.set(nodeId, {
          id: nodeId,
          type: targetType,
          name: formatName(targetType),
          category: getCategoryForType(targetType),
          side: 'right',
          isCenter: false,
          depth: 1,
        });
      }
      const edgeId = `edge-${effectiveRoot.type}-${rel.relationshipType}-${targetType}`;
      if (!edgeMap.has(edgeId)) {
        edgeMap.set(edgeId, {
          id: edgeId,
          source: centerId,
          target: nodeId,
          relationshipType: rel.relationshipType,
        });
      }
    }
  }

  // Add incoming relationship nodes (side: 'left')
  for (const rel of effectiveRoot.relationships.incoming) {
    for (const sourceType of rel.objectTypes) {
      const nodeId = `node-${sourceType}`;
      if (!nodeMap.has(nodeId)) {
        nodeMap.set(nodeId, {
          id: nodeId,
          type: sourceType,
          name: formatName(sourceType),
          category: getCategoryForType(sourceType),
          side: 'left',
          isCenter: false,
          depth: 1,
        });
      }
      const edgeId = `edge-${sourceType}-${rel.relationshipType}-${effectiveRoot.type}`;
      if (!edgeMap.has(edgeId)) {
        edgeMap.set(edgeId, {
          id: edgeId,
          source: nodeId,
          target: centerId,
          relationshipType: rel.relationshipType,
        });
      }
    }
  }

  // Expand nodes
  for (const expandedId of expandedNodes) {
    const expandedNode = nodeMap.get(expandedId);
    if (!expandedNode) continue;

    const expandedObj = getObjectByType(expandedNode.type);
    if (!expandedObj) continue;

    const parentDepth = expandedNode.depth;

    // Add outgoing from expanded node
    for (const rel of expandedObj.relationships.outgoing) {
      for (const targetType of rel.objectTypes) {
        const nodeId = `node-${targetType}`;
        if (!nodeMap.has(nodeId)) {
          nodeMap.set(nodeId, {
            id: nodeId,
            type: targetType,
            name: formatName(targetType),
            category: getCategoryForType(targetType),
            side: 'right',
            isCenter: false,
            depth: parentDepth + 1,
          });
        }
        const edgeId = `edge-${expandedNode.type}-${rel.relationshipType}-${targetType}`;
        if (!edgeMap.has(edgeId)) {
          edgeMap.set(edgeId, {
            id: edgeId,
            source: expandedId,
            target: nodeId,
            relationshipType: rel.relationshipType,
          });
        }
      }
    }

    // Add incoming to expanded node
    for (const rel of expandedObj.relationships.incoming) {
      for (const sourceType of rel.objectTypes) {
        const nodeId = `node-${sourceType}`;
        if (!nodeMap.has(nodeId)) {
          nodeMap.set(nodeId, {
            id: nodeId,
            type: sourceType,
            name: formatName(sourceType),
            category: getCategoryForType(sourceType),
            side: 'left',
            isCenter: false,
            depth: parentDepth + 1,
          });
        }
        const edgeId = `edge-${sourceType}-${rel.relationshipType}-${expandedNode.type}`;
        if (!edgeMap.has(edgeId)) {
          edgeMap.set(edgeId, {
            id: edgeId,
            source: nodeId,
            target: expandedId,
            relationshipType: rel.relationshipType,
          });
        }
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
  };
}

export function useForceGraph(rootObject: StixObjectType) {
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [focusType, setFocusType] = useState<string | null>(null);

  const { nodes, edges } = useMemo(
    () => buildGraph(rootObject, expandedNodes, focusType),
    [rootObject, expandedNodes, focusType],
  );

  const expandNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      if (prev.includes(nodeId)) return prev;
      // Enforce soft depth limit — auto-collapse oldest if over limit
      const next = [...prev, nodeId];
      while (next.length > MAX_EXPANDED) {
        next.shift();
      }
      return next;
    });
  }, []);

  const focusNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setFocusType(node.type);
        setExpandedNodes([]);
      }
    },
    [nodes],
  );

  const reset = useCallback(() => {
    setExpandedNodes([]);
    setFocusType(null);
  }, []);

  return {
    nodes,
    edges,
    expandedNodes,
    expandNode,
    focusNode,
    reset,
  };
}
