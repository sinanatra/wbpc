<script>
  import { createEventDispatcher } from "svelte";
  import PageInfo from "./PageInfo.svelte";

  export let communities = [];
  export let selectedItem = null;
  const dispatch = createEventDispatcher();

  // dispatch a 'select' event instead of dotClick
  function handleClick(community) {
    dispatch("select", community);
  }

  function handleClose() {
    dispatch("close");
  }
</script>

<article>
  {#each communities as community}
    <div class="community" on:click={() => handleClick(community)}>
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
