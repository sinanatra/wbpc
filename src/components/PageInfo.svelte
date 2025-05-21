<script>
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  export let community;
  const dispatch = createEventDispatcher();

  let wrapper;
  function handleClickOutside(e) {
    if (wrapper && !wrapper.contains(e.target)) {
      dispatch("close");
    }
  }
  onMount(() => document.addEventListener("click", handleClickOutside));
  onDestroy(() => document.removeEventListener("click", handleClickOutside));

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatYear(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
    });
  }
</script>

<div bind:this={wrapper} class="panel-wrapper">
  <h2>{community.title}</h2>

  <div class="tab-content">
    <div class="info-table">
      {#if community.risks}
        <div class="row">
          <div class="label">Risk:</div>
          <div class="value">{community.risks[0].riskvalue}</div>
        </div>
      {/if}
      {#if community.population}
        <div class="row">
          <div class="label">Population:</div>
          <div class="value">{community.population}</div>
        </div>
      {/if}

      {#if community.yearEstablished}
        <div class="row">
          <div class="label">History:</div>
          <div class="value">{formatYear(community.yearEstablished)}</div>
        </div>
      {/if}
    </div>

    {#if community.alerts?.length > 0}
      <h3>Alerts</h3>
      <div class="alerts-list">
        {#each community.alerts as alert}
          <div class="alert-item">
            <div class="date">{formatDate(alert.alertdate)}</div>
            <p>{@html alert.alertdescription}</p>
          </div>
        {/each}
      </div>
    {/if}

    {#if community.images?.length > 0}
      <h3>Images</h3>
      <div class="images-panel">
        {#each community.images as image}
          <div class="image-wrapper">
            <img src={image.url} alt={image.alt || community.title} />
            {#if image.caption}
              <p class="caption">{image.caption}</p>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .panel-wrapper {
    background: #fff;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-size: 14px;
  }

  h3 {
    margin: 10px 0px;
  }

  .info-table .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-primary);
    align-items: start;
  }

  .info-table .label {
    color: var(--color-primary);
  }
  .info-table .value {
    color: #333;
  }

  .alerts-list {
    margin-top: 0.5rem;
  }
  .alert-item {
    margin-bottom: 1rem;
  }
  .alert-item .date {
    margin-bottom: 0.25rem;
    color: var(--color-primary);
  }
  .alert-item p {
    margin: 0;
    color: #555;
  }

  .images-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .images-panel .image-wrapper img {
    width: 100%;
    border-radius: 4px;
  }

  .images-panel .caption {
    margin: 0.25rem 0 0;
    font-size: 12px;
    color: var(--color-tertiary);
  }
</style>
