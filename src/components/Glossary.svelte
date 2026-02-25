<script>
  import { createEventDispatcher, onMount, tick } from "svelte";
  import PageInfo from "./PageInfo.svelte";
  import { selectedItem, setSelectedItem } from "$stores/uiStore.js";

  let { communities = [] } = $props();

  let communityRefs = new Map();
  const dispatch = createEventDispatcher();
  const selectedRowOffset = 180;

  function getCommunityKey(id) {
    return id == null ? "" : String(id);
  }

  function registerRef(node, communityId) {
    let currentId = getCommunityKey(communityId);
    communityRefs.set(currentId, node);

    return {
      update(nextId) {
        const nextKey = getCommunityKey(nextId);
        if (nextKey === currentId) return;
        communityRefs.delete(currentId);
        currentId = nextKey;
        communityRefs.set(currentId, node);
      },
      destroy() {
        communityRefs.delete(currentId);
      },
    };
  }

  function handleClick(community) {
    setSelectedItem(community);
    dispatch("select", community);
  }

  function scrollNodeToSelectionPosition(node) {
    const scrollContainer = node.closest(".sidebar");
    if (!scrollContainer) {
      node.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const rowOffset = isMobile ? 0 : selectedRowOffset;
    const containerRect = scrollContainer.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const targetTop =
      scrollContainer.scrollTop +
      (nodeRect.top - containerRect.top) -
      rowOffset;
    const maxTop = Math.max(
      0,
      scrollContainer.scrollHeight - scrollContainer.clientHeight,
    );
    const nextTop = Math.max(0, Math.min(maxTop, targetTop));
    scrollContainer.scrollTo({ top: nextTop, behavior: "auto" });
  }

  onMount(() => {
    return selectedItem.subscribe(async (item) => {
      if (item?.id == null) return;
      await tick();
      const node = communityRefs.get(getCommunityKey(item.id));
      if (!node) return;
      scrollNodeToSelectionPosition(node);
    });
  });
</script>

<article>
  {#each communities as community}
    <div class="community-row" use:registerRef={community.id}>
      {#if getCommunityKey($selectedItem?.id) !== getCommunityKey(community.id)}
        <div
          class="community"
          on:click={(e) => {
            e.stopPropagation();
            handleClick(community);
          }}
        >
          <h2 class="title">{community.title}</h2>
          <h2 class="alternative">{community.alternativeTitle}</h2>
        </div>
      {/if}

      {#if getCommunityKey($selectedItem?.id) === getCommunityKey(community.id)}
        <div class="info-inline" on:click|stopPropagation>
          <PageInfo community={$selectedItem} />
        </div>
      {/if}
    </div>
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
