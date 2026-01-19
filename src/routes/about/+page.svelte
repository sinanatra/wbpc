<script>
  import { marked } from "marked";
  import Header from "@components/Header.svelte";

  export let data;
</script>

{#if data.about || true}
  <div class="layout-container">
    <div class="left-column">
      <Header title="About" />
    </div>

    <div class="right-column">
      <div class="text-content">
        {#if data.about}
          <div>{@html marked(data.about.content.text)}</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .error {
    color: var(--color-primary);
    padding: 10px;
    text-align: center;
  }

  .layout-container {
    display: flex;
    height: 100vh;
    width: 100%;
  }

  .left-column {
    flex: 0 0 45%;
    max-width: 450px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #ddd;
    overflow-y: auto;
    background: #f9f9f9;
    position: relative;
  }

  .right-column {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .text-content {
    flex: 1;
    overflow-y: auto;
    font-size: 1.3rem;
    line-height: 1.6;
    padding: 16px;
    padding-top: 1em;
    max-width: 960px;
  }

  .text-content :global(h1),
  .text-content :global(h2),
  .text-content :global(h3) {
    color: var(--color-primary);
  }
</style>
