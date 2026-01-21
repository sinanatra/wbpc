<script>
  import { createEventDispatcher, onMount } from "svelte";
  import PageInfo from "./PageInfo.svelte";
  import { selectedItem, setSelectedItem } from "$stores/uiStore.js";

  let { communities = [] } = $props();

  let communityRefs = [];
  let lastScrolledId = null;
  const dispatch = createEventDispatcher();

  function registerRef(node, index) {
    communityRefs[index] = node;
    return {
      destroy() {
        communityRefs[index] = null;
      },
    };
  }

  function handleClick(community) {
    setSelectedItem(community);
    dispatch("select", community);
  }

  onMount(() => {
    return selectedItem.subscribe((item) => {
      if (item?.id && item.id !== lastScrolledId) {
        lastScrolledId = item.id;
        const idx = communities.findIndex((c) => c.id === item.id);
        if (idx !== -1 && communityRefs[idx]) {
          setTimeout(() => {
            communityRefs[idx].scrollIntoView({ behavior: "smooth", block: "start" });
          }, 0);
        }
      }
    });
  });
</script>

<article>
  {#each communities as community, i}
    <div
      class="community"
      on:click={(e) => { e.stopPropagation(); handleClick(community); }}
      use:registerRef={i}
    >
      <h2 class="title">{community.title}</h2>
      <h2 class="alternative">{community.alternativeTitle}</h2>
    </div>

    {#if $selectedItem?.id === community.id}
      <div class="info-inline" on:click|stopPropagation>
        <PageInfo community={$selectedItem} />
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
    gap: 5px;
    border-bottom: 1px dashed var(--color-primary);
    padding: 5px 10px;
    cursor: pointer;
    scroll-margin-top: 200px;
    
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
    font-size: 0.8em;
    margin-top: 0.4em;
  }
</style>
