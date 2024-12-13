<script lang="ts">
  import { untrack } from "svelte";
  import { writable } from "svelte/store";
  import {
    Background,
    ConnectionLineType,
    Controls,
    SvelteFlow,
    useSvelteFlow,
    type Edge,
    type Node,
  } from "@xyflow/svelte";

  import "@xyflow/svelte/dist/style.css";

  import { type Graph } from "../../lib/evaluator";
  import { convertGraphToFlowChartFormat, getLayoutedElements } from "../util";

  interface Props {
    graph: Graph;
    match: boolean;
    steps: string[][];
    currentStep: number;
  }

  const { fitView } = useSvelteFlow();

  const nodes = writable<Node[]>([]);
  const edges = writable<Edge[]>([]);

  let { graph, match, steps, currentStep }: Props = $props();

  $effect(() => {
    const { nodes: initialNodes, edges: initialEdges } =
      convertGraphToFlowChartFormat(graph);

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
    );

    untrack(() => {
      $nodes = layoutedNodes;
      $edges = layoutedEdges;
    });

    // HACK: calling `fitView` directly has no effect, but this seems to work
    setTimeout(fitView, 0);
  });

  $effect(() => {
    const activeItems = steps[currentStep];

    untrack(() => {
      for (const node of $nodes) {
        if (activeItems.includes(node.id)) {
          node.class = "highlight";

          if (currentStep === steps.length - 1) {
            // on the last step, check if the string matched and set the appropriate colour
            node.class += match ? " match" : " not-match";
          }
        } else {
          node.class = "";
        }
      }

      for (const edge of $edges) {
        if (activeItems.includes(edge.id)) {
          edge.labelStyle = "background-color: var(--default-highlight-colour)";
        } else {
          edge.labelStyle = "";
        }
      }

      $nodes = $nodes;
      $edges = $edges;
    });
  });
</script>

<div id="chart">
  <SvelteFlow
    {nodes}
    {edges}
    fitView
    minZoom={0.1}
    connectionLineType={ConnectionLineType.SmoothStep}
    defaultEdgeOptions={{
      type: ConnectionLineType.SmoothStep,
      animated: false,
    }}
  >
    <Controls />
    <Background bgColor="var(--background-colour)" />
  </SvelteFlow>
</div>

<style>
  #chart {
    width: 100%;
    height: 100%;
    color: var(--background-colour);
  }

  :global(.svelte-flow__node.highlight) {
    font-weight: bold;
    background-color: var(--default-highlight-colour);
  }

  :global(.svelte-flow__node.match) {
    background-color: var(--match-highlight-colour);
  }

  :global(.svelte-flow__node.not-match) {
    background-color: var(--not-match-highlight-colour);
  }
</style>
