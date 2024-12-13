<script lang="ts">
  const { message } = $props();
</script>

<div class="error">
  <span>{message}</span>
</div>

<style>
  .error {
    position: relative;
    top: 50%;
    left: 0;
    right: 0;
    margin: 0 auto;
    width: fit-content;
    color: var(--error-colour);
    border: 0.2em solid var(--error-colour);
    border-radius: var(--border-radius);
    padding: 0.5em;
    font-size: 1.5em;
    font-weight: bold;
  }
</style>
