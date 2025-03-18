<script>
  import { createEventDispatcher } from "svelte";
  export let community;
  const dispatch = createEventDispatcher();

  let selectedTab = "Key Facts";
</script>

<div class="pageinfo">
  <h2>{community.title}</h2>
  {#if community.alternativeNames && community.alternativeNames.length}
    <p>
      <strong>Alternative Names:</strong>
      {community.alternativeNames.join(", ")}
    </p>
  {/if}

  <div class="tab-content">
    {#if selectedTab === "Key Facts"}
      <div class="tab-panel">
        {#if community.keyfacts && community.keyfacts.length}
          {#each community.keyfacts as keyfact}
            <div class="alert-item">
              <p>{keyfact.keyinfodescription}</p>
            </div>
          {/each}
        {:else}
          <p>No keyfacts available.</p>
        {/if}
        {#if community.tags && community.tags.length}
          <p><strong>Tags:</strong> {community.tags.join(", ")}</p>
        {/if}
      </div>
    {:else if selectedTab === "History"}
      <div class="tab-panel">
        <p>{community.history}</p>
      </div>
    {:else if selectedTab === "Alerts"}
      <div class="tab-panel">
        {#if community.alerts && community.alerts.length}
          {#each community.alerts as alert}
            <div class="alert-item">
              <strong>{alert.alertdate}:</strong>
              {@html alert.alertdescription}
            </div>
          {/each}
        {:else}
          <p>No alerts available.</p>
        {/if}
      </div>
    {:else if selectedTab === "Standards"}
      <div class="tab-panel">
        <p>{community.standardOfLiving}</p>
      </div>
    {:else if selectedTab === "Images"}
      <div class="tab-panel images-panel">
        {#if community.images && community.images.length}
          {#each community.images as image}
            <img
              src={image.url}
              alt={image.alt || community.title}
              class="community-image"
            />
          {/each}
        {:else}
          <p>No images available.</p>
        {/if}
      </div>
    {:else if selectedTab === "Grants"}
      <div class="tab-panel">
        <p>
          <strong>Government Grants:</strong>
          {community.governmentMoneySpent} €
        </p>
      </div>
    {/if}
  </div>
</div>

<div class="side-tabs">
  <button
    class:selected={selectedTab === "Key Facts"}
    on:click={() => (selectedTab = "Key Facts")}
  >
    Key Facts
  </button>
  <button
    class:selected={selectedTab === "History"}
    on:click={() => (selectedTab = "History")}
  >
    History
  </button>
  <button
    class:selected={selectedTab === "Alerts"}
    on:click={() => (selectedTab = "Alerts")}
  >
    Alerts
  </button>
  <button
    class:selected={selectedTab === "Standards"}
    on:click={() => (selectedTab = "Standards")}
  >
    Standards of Living
  </button>
  <button
    class:selected={selectedTab === "Images"}
    on:click={() => (selectedTab = "Images")}
  >
    Images
  </button>
  <button
    class:selected={selectedTab === "Grants"}
    on:click={() => (selectedTab = "Grants")}
  >
    Government Grants
  </button>
</div>

<style>
  .pageinfo {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 360px;
    background-color: white;
    padding: 10px;
    /* border-radius: 10px; */

    z-index: 2;
    font-family: sans-serif;
    font-size: 14px;
  }

  h1,
  h2,
  p {
    margin: 0;
    padding: 0 10px 0 0;
  }

  .tab-content {
    margin-top: 10px;
    min-height: 500px;
    max-height: 80vh;
    overflow: scroll;
  }

  .tab-panel {
    margin-bottom: 10px;
  }

  .alert-item {
    padding: 4px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-bottom: 6px;
  }
  .images-panel img {
    width: 100%;
    margin-bottom: 6px;
    border-radius: 4px;
  }

  .side-tabs {
    position: absolute;
    top: 10px;
    right: 390px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .side-tabs button {
    writing-mode: sideways-lr;
    background: white;
    text-orientation: mixed;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 4px;
  }
  .side-tabs button.selected {
    font-weight: bold;
  }
</style>
