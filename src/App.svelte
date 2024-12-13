<script lang="ts">
  import { SvelteFlowProvider } from "@xyflow/svelte";

  import { Evaluator, Graph } from "../lib/evaluator";
  import { astToGraph } from "../lib/graph";
  import { parse } from "../lib/parser";

  import Chart from "./components/Chart.svelte";
  import Error from "./components/Error.svelte";

  let string = $state("haha!");
  let regex = $state("(ha)+.*!?");
  let currentStep = $state(0);

  const ast = $derived.by(() => {
    try {
      return parse(regex);
    } catch (e) {
      console.error(e);
      return null;
    }
  });

  const { graph, match, steps } = $derived.by(() => {
    if (ast === null) {
      return {};
    }

    let graph: Graph;

    try {
      graph = astToGraph(ast);
    } catch (error) {
      console.error(error);
      return {};
    }

    const evaluator = new Evaluator(graph);

    const match = evaluator.match(string);
    const steps = evaluator.steps;

    return {
      graph,
      match,
      steps,
    };
  });
</script>

<div class="text-bar">
  <input
    type="text"
    class="text text-box"
    placeholder="Type a RegEx here"
    bind:value={regex}
  />
  <span
    class="text match-flag"
    style:color={match
      ? "var(--match-highlight-colour)"
      : "var(--not-match-highlight-colour)"}>{match}</span
  >
  <input
    type="text"
    class="text text-box"
    placeholder="Type a string to test here"
    bind:value={string}
  />
</div>

{#if graph !== undefined}
  <SvelteFlowProvider>
    <Chart {graph} {match} {steps} {currentStep} />
  </SvelteFlowProvider>
{:else}
  <Error message="Error generating graph" />
{/if}

<div class="buttons">
  <button disabled={currentStep <= 0} onclick={() => currentStep--}
    >{"<"}
  </button>
  <button
    disabled={steps !== undefined && currentStep >= steps.length - 1}
    onclick={() => currentStep++}>{">"}</button
  >
</div>

<style>
  input,
  button {
    background: none;
    border: none;
    border-radius: var(--border-radius);
    outline: solid 0.1rem var(--outline-colour);
    text-align: center;
  }

  .text-bar {
    z-index: 1000;
    position: absolute;
    top: 5%;
    width: 100%;
    display: flex;
    justify-content: space-around;
  }

  .text-box {
    background-color: var(--background-colour);
  }

  .text {
    font-weight: bold;
    font-size: 2em;
  }

  .match-flag {
    width: 3em;
    text-align: center;
  }

  .buttons {
    position: absolute;
    bottom: 5%;
    left: 0;
    right: 0;
    margin: 0 auto;
    width: fit-content;
    display: flex;
    justify-content: center;
  }

  .buttons > * {
    margin: 0 0.5em;
    padding: 0 0.5em;
    font-size: 2em;
  }

  .buttons > *:hover:not(:disabled) {
    background-color: var(--outline-colour);
  }

  .buttons > *:active:not(:disabled) {
    background-color: var(--primary-colour);
    color: var(--background-color);
  }

  :global(.svelte-flow__attribution a) {
    /* override the default colour so it is readable on a dark background */
    color: var(--primary-colour);
  }
</style>
