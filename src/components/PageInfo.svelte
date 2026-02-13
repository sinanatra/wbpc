<script>
  import { onMount, onDestroy } from "svelte";
  import { clearSelection } from "$stores/uiStore.js";
  let { community, hideLink = false } = $props();

  let wrapper;
  // function handleClickOutside(e) {
  //   if (wrapper && !wrapper.contains(e.target)) {
  //     clearSelection();
  //   }
  // }
  // onMount(() => {
  //   document.addEventListener("click", handleClickOutside, true);
  //   // setTimeout(() => {
  //   // }, 0);
  // });
  // onDestroy(() => {
  //   document.removeEventListener("click", handleClickOutside, true);
  // });

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

<div bind:this={wrapper} class="panel-wrapper" on:click|stopPropagation>
  <div class="title-row">
    {#if !hideLink}
      <a
        target="_blank"
        href="/community/{community.id}"
        class="title-link"
        title="Open in a new tab"
      >
        <div>
          <h2>{community.title}</h2>
          <h2 class="alternative">{community.alternativeTitle}</h2>
        </div>

        <svg width="1rem" height="1rem" viewBox="0 0 1rem 1rem" fill="none">
          <path
            d="M2 14L14 2M14 2H6M14 2V10"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </a>
    {:else}
      <div>
        <h2>{community.title}</h2>
        <h2 class="alternative">{community.alternativeTitle}</h2>
      </div>
    {/if}
  </div>

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
          <div class="label">Established:</div>
          <div class="value">{formatYear(community.yearEstablished)}</div>
        </div>
      {/if}
    </div>

    {#if community.info?.length > 0}
      <h3>Info</h3>
      <div class="info">
        <div class="info-item">
          <p>{@html community.info}</p>
        </div>
      </div>
    {/if}

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
    font-size: 1em;
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .title-row h2 {
    margin: 0;
    flex: 1;
  }

  .title-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex: 1;
    color: inherit;
    text-decoration: none;
  }

  .title-link h2 {
    margin: 0;
    flex: 1;
  }

  .alternative {
    color: var(--color-primary);
    font-weight: 100;
    font-size: 0.8em;
    margin-top: 0.4em;
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

  .info {
    font-size: 1.35em;
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
  }

  .images-panel .image-wrapper img {
    width: 100%;
    border-radius: 4px;
  }

  .images-panel .caption {
    margin: 0 0 0.5em;
    font-size: 0.875em;
    color: var(--color-tertiary);
  }
</style>
