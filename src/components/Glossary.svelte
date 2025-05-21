<script>
  import { createEventDispatcher, afterUpdate } from "svelte";
  import PageInfo from "./PageInfo.svelte";

  export let communities = [];
  export let selectedItem = null;
  const dispatch = createEventDispatcher();

  let communityRefs = [];

  function registerRef(node, index) {
    communityRefs[index] = node;
    return {
      destroy() {
        communityRefs[index] = null;
      },
    };
  }

  function handleClick(community) {
    dispatch("select", community);
  }
  function handleClose() {
    dispatch("close");
  }

  afterUpdate(() => {
    if (selectedItem) {
      const idx = communities.findIndex((c) => c.id === selectedItem.id);
      const el = communityRefs[idx];
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }
  });
</script>

<article>
  {#each communities as community, i}
    <div
      class="community"
      on:click={() => handleClick(community)}
      use:registerRef={i}
    >
      <h2 class="title">{community.title}</h2>
      <h2 class="alternative">{community.alternativeTitle}</h2>
    </div>

    {#if selectedItem?.id === community.id}
      <div class="info-inline">
        <PageInfo community={selectedItem} on:close={handleClose} />
      </div>
    {/if}
  {/each}
</article>

<style>
  article {
    min-height: 500px;
  }

  .community {
    display: flex;
    border-bottom: 1px dashed var(--color-primary);
    padding: 5px 10px;
    cursor: pointer;
  }

  h2 {
    margin: 0;
    padding: 0 1px;
    font-size: 1.2em;
  }

  .alternative {
    color: var(--color-primary);
    font-family: Arial, Helvetica, sans-serif;
    font-weight: 100;
    margin-left: 10px;
    line-height: 16px;
  }
</style>
