import dagre from "@dagrejs/dagre";
import { MarkerType, Position, type Edge, type Node } from "@xyflow/svelte";

import { type Graph } from "../lib/evaluator";

type LayoutDirection = "TB" | "LR";

const nodeSpacingFactor = 1.5;
const defaultNodeWidth = 60;
const defaultNodeHeight = 60;

function makeNode(id: string, label: string): Node {
  return {
    id,
    width: defaultNodeWidth,
    height: defaultNodeHeight,
    data: {
      label,
    },
    position: { x: 0, y: 0 },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  label: string,
): Edge {
  return {
    id,
    source,
    target,
    label,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  };
}

export function convertGraphToFlowChartFormat(graph: Graph): {
  nodes: Node[];
  edges: Edge[];
} {
  const { start, end, rules } = graph;

  const graphStartNodeId = start.id();
  const graphEndNodeId = end.id();

  const nodes = new Map<string, Node>();
  const edges = new Map<string, Edge>();

  nodes.set(graphStartNodeId, makeNode(graphStartNodeId, "START"));
  nodes.set(graphEndNodeId, makeNode(graphEndNodeId, "FINISH"));

  for (const rule of rules) {
    const startNodeLabel = rule.start.toString();
    const endNodeLabel = rule.end.toString();
    const startNodeId = rule.start.id();
    const endNodeId = rule.end.id();

    const edgeId = rule.id();
    const edge = makeEdge(edgeId, startNodeId, endNodeId, rule.toString());

    edges.set(edgeId, edge);

    if (startNodeId !== graphStartNodeId) {
      nodes.set(startNodeId, makeNode(startNodeId, startNodeLabel));
    }
    if (endNodeId !== graphEndNodeId) {
      nodes.set(endNodeId, makeNode(endNodeId, endNodeLabel));
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = "LR",
) {
  const isHorizontal = direction === "LR";

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  for (const node of nodes) {
    dagreGraph.setNode(node.id, {
      width: defaultNodeWidth * nodeSpacingFactor,
      height: defaultNodeHeight * nodeSpacingFactor,
    });
  }

  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  dagre.layout(dagreGraph);

  for (const node of nodes) {
    const positionedNode = dagreGraph.node(node.id);

    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;

    // shift the dagre node position to the top left so it matches the SvelteFlow node anchor point
    node.position = {
      x: positionedNode.x - defaultNodeWidth / 2,
      y: positionedNode.y - defaultNodeHeight / 2,
    };
  }

  return { nodes, edges };
}
