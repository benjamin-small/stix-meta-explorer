import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { StixObjectType } from '../types/stix';
import { CATEGORY_COLORS } from '../types/stix';
import { useForceGraph, type GraphNode } from '../hooks/useForceGraph';

interface RelationshipGraphProps {
  object: StixObjectType;
}

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}

interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  relationshipType: string;
}

const NODE_RADIUS = 28;
const WIDTH = 900;
const HEIGHT = 500;

export default function RelationshipGraph({ object }: RelationshipGraphProps) {
  const totalRelationships =
    object.relationships.outgoing.length + object.relationships.incoming.length;

  if (totalRelationships === 0) {
    return (
      <p className="text-sm text-cti-muted italic">
        No spec-defined relationships. Custom relationships may be defined via extensions.
      </p>
    );
  }

  return <ForceGraph object={object} />;
}

function ForceGraph({ object }: { object: StixObjectType }) {
  const { nodes, edges, expandedNodes, expandNode, focusNode, reset } = useForceGraph(object);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimEdge> | null>(null);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simEdges, setSimEdges] = useState<SimEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);

  // Build simulation whenever graph data changes
  useEffect(() => {
    const simNodeData: SimNode[] = nodes.map((n) => ({
      ...n,
      x: n.side === 'left' ? WIDTH * 0.25 : n.side === 'right' ? WIDTH * 0.75 : WIDTH / 2,
      y: HEIGHT / 2 + (Math.random() - 0.5) * 100,
    }));

    const nodeById = new Map(simNodeData.map((n) => [n.id, n]));

    const simEdgeData: SimEdge[] = edges
      .filter((e) => nodeById.has(e.source) && nodeById.has(e.target))
      .map((e) => ({
        ...e,
        source: e.source,
        target: e.target,
      }));

    // Stop previous simulation
    simulationRef.current?.stop();

    const simulation = d3
      .forceSimulation<SimNode, SimEdge>(simNodeData)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimEdge>(simEdgeData)
          .id((d) => d.id)
          .distance(120),
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        'x',
        d3.forceX<SimNode>((d) =>
          d.side === 'left' ? WIDTH * 0.2 : d.side === 'right' ? WIDTH * 0.8 : WIDTH / 2,
        ).strength(0.3),
      )
      .force(
        'y',
        d3.forceY(HEIGHT / 2).strength(0.1),
      )
      .force('collision', d3.forceCollide(NODE_RADIUS + 10))
      .alphaDecay(0.03);

    simulation.on('tick', () => {
      setSimNodes([...simNodeData]);
      setSimEdges([...simEdgeData]);
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]);

  // D3 zoom
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  const getSourceTarget = useCallback(
    (edge: SimEdge) => {
      const source = typeof edge.source === 'object' ? (edge.source as SimNode) : null;
      const target = typeof edge.target === 'object' ? (edge.target as SimNode) : null;
      return { source, target };
    },
    [],
  );

  const isEdgeConnected = useCallback(
    (edge: SimEdge, nodeId: string) => {
      const { source, target } = getSourceTarget(edge);
      return source?.id === nodeId || target?.id === nodeId;
    },
    [getSourceTarget],
  );

  return (
    <div className="relative">
      <div className="flex gap-2 mb-2">
        <button
          onClick={reset}
          className="px-3 py-1 text-xs rounded border border-cti-border text-cti-muted hover:text-cti-text hover:border-cti-text transition-colors"
        >
          Reset
        </button>
        {expandedNodes.length > 0 && (
          <span className="text-xs text-cti-muted self-center">
            {expandedNodes.length} node(s) expanded
          </span>
        )}
        <span className="text-xs text-cti-muted self-center ml-auto">
          Click to expand, double-click to focus, scroll to zoom
        </span>
      </div>

      <div className="bg-cti-bg border border-cti-border rounded-lg overflow-hidden relative">
        <svg
          ref={svgRef}
          width="100%"
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="select-none"
        >
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth="8"
              markerHeight="6"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#8b949e" />
            </marker>
            <marker
              id="arrowhead-highlight"
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth="8"
              markerHeight="6"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#e6edf3" />
            </marker>
          </defs>
          <g ref={gRef}>
            {/* Edges */}
            {simEdges.map((edge) => {
              const { source, target } = getSourceTarget(edge);
              if (!source || !target) return null;
              const sx = source.x ?? 0;
              const sy = source.y ?? 0;
              const tx = target.x ?? 0;
              const ty = target.y ?? 0;

              // Shorten line to stop at node radius
              const dx = tx - sx;
              const dy = ty - sy;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const offsetX = (dx / dist) * NODE_RADIUS;
              const offsetY = (dy / dist) * NODE_RADIUS;

              const highlighted =
                hoveredNode !== null && isEdgeConnected(edge, hoveredNode);

              return (
                <g key={edge.id}>
                  <line
                    x1={sx + offsetX}
                    y1={sy + offsetY}
                    x2={tx - offsetX}
                    y2={ty - offsetY}
                    stroke={highlighted ? '#e6edf3' : '#30363d'}
                    strokeWidth={highlighted ? 2 : 1}
                    markerEnd={
                      highlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'
                    }
                  />
                  <text
                    x={(sx + tx) / 2}
                    y={(sy + ty) / 2 - 6}
                    textAnchor="middle"
                    fill={highlighted ? '#e6edf3' : '#8b949e'}
                    fontSize={9}
                    fontFamily="sans-serif"
                    pointerEvents="none"
                  >
                    {edge.relationshipType}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {simNodes.map((node) => {
              const x = node.x ?? 0;
              const y = node.y ?? 0;
              const color = CATEGORY_COLORS[node.category];
              const isHovered = hoveredNode === node.id;
              const isExpanded = expandedNodes.includes(node.id);

              return (
                <g
                  key={node.id}
                  transform={`translate(${x}, ${y})`}
                  cursor="pointer"
                  onClick={() => {
                    if (!node.isCenter) expandNode(node.id);
                  }}
                  onDoubleClick={() => {
                    if (!node.isCenter) focusNode(node.id);
                  }}
                  onMouseEnter={() => {
                    setHoveredNode(node.id);
                    setTooltip({ x, y, node });
                  }}
                  onMouseLeave={() => {
                    setHoveredNode(null);
                    setTooltip(null);
                  }}
                >
                  <circle
                    r={node.isCenter ? NODE_RADIUS + 4 : NODE_RADIUS}
                    fill={node.isCenter ? color : `${color}22`}
                    stroke={color}
                    strokeWidth={isHovered || isExpanded ? 3 : node.isCenter ? 2.5 : 1.5}
                    strokeDasharray={isExpanded && !node.isCenter ? '4 2' : undefined}
                  />
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    fill={node.isCenter ? '#0d1117' : '#e6edf3'}
                    fontSize={node.type.length > 12 ? 7 : 9}
                    fontFamily="sans-serif"
                    fontWeight={node.isCenter ? 'bold' : 'normal'}
                    pointerEvents="none"
                  >
                    {node.name.length > 16
                      ? node.name.slice(0, 14) + '...'
                      : node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-cti-surface border border-cti-border rounded px-2 py-1 text-xs text-cti-text shadow-lg z-10"
            style={{
              left: `${((tooltip.x / WIDTH) * 100).toFixed(1)}%`,
              top: `${((tooltip.y / HEIGHT) * 100 - 12).toFixed(1)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="font-semibold">{tooltip.node.name}</span>
            <span className="text-cti-muted ml-1">({tooltip.node.type})</span>
          </div>
        )}
      </div>
    </div>
  );
}
