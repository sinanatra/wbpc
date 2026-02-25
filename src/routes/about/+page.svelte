<script>
  import { marked } from "marked";
  import Header from "@components/Header.svelte";
  import Legend from "@components/Legend.svelte";

  export let data;

  const LEGEND_PLACEHOLDER_REGEX =
    /<div\s+[^>]*class=(["'])[^"']*\blegend\b[^"']*\1[^>]*>\s*<\/div>/gi;

  function buildContentParts(text = "") {
    const html = marked(text || "");
    const parts = [];
    let cursor = 0;
    let match;

    while ((match = LEGEND_PLACEHOLDER_REGEX.exec(html)) !== null) {
      parts.push({ type: "html", content: html.slice(cursor, match.index) });
      parts.push({ type: "legend" });
      cursor = LEGEND_PLACEHOLDER_REGEX.lastIndex;
    }

    parts.push({ type: "html", content: html.slice(cursor) });
    return parts;
  }

  $: aboutParts = buildContentParts(data.about?.content?.text || "");
</script>

{#if data.about || true}
  <div class="layout-container">
    <div class="left-column">
      <Header title="About" />
    </div>

    <div class="right-column">
      <div class="text-content">
        {#if data.about}
          {#each aboutParts as part}
            {#if part.type === "legend"}
              <div class="legend-wrapper">
                <Legend riskArray={data.riskArray || []} />
              </div>
            {:else if part.content}
              {@html part.content}
            {/if}
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
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
    border-right: 1px solid var(--color-tertiary);
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
    /* line-height: 1.6; */
    padding: 16px;
    padding-top: 1em;
    max-width: 960px;
  }

  .legend-wrapper {
    margin: 1rem 0 2rem;
  }

  @media screen and (max-width: 767px) {
    .layout-container {
      flex-direction: column;
      height: auto;
      width: 100%;
    }

    .left-column {
      flex: 0 0 auto;
      max-width: 100%;
      border-right: none;
      border-bottom: 1px solid var(--color-tertiary);
      height: auto;
      order: 1;
    }

    .right-column {
      flex: 1;
      overflow: visible;
      order: 2;
    }

    .text-content {
      flex: none;
      overflow: visible;
      padding: 16px;
      padding-top: 1em;
    }
  }
</style>
