<script>
  import Map from "@components/Map.svelte";
  import SearchBar from "@components/SearchBar.svelte";
  import Legend from "@components/Legend.svelte";
  import ScrollyText from "@components/ScrollyText.svelte";
  import Header from "@components/Header.svelte";
  import Glossary from "@components/Glossary.svelte";
  import { communities } from "$stores/mapStore.js";
  import { activeSlideIndex, currentSlideId } from "$stores/scrollStore.js";
  import {
    clearSelection,
    filteredItems,
    searchQuery,
    selectedItem,
    setSearchQuery,
  } from "$stores/uiStore.js";

  let {
    editorialData = [],
    riskArray = [],
    title = "",
    mapRef = undefined,
    mapComponent = undefined,
  } = $props();

  const debounce = (fn, wait = 100) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };

  let hasInitializedSlide = false;
  let sidebarEl;
  let mapAreaEl;
  let mapInteractionsEnabled = $derived(
    editorialData.length === 0 ||
      $activeSlideIndex === editorialData.length - 1,
  );
  let showClearAll = $derived(
    Boolean($selectedItem?.id) || ($searchQuery || "").trim().length > 0,
  );

  const handleSlideChange = debounce(() => {
    if ($currentSlideId && mapComponent?.showSlide) {
      mapComponent.showSlide($currentSlideId, { animate: hasInitializedSlide });
      hasInitializedSlide = true;
    }
  }, 200);

  $effect(() => {
    if ($currentSlideId && mapComponent?.showSlide) {
      handleSlideChange();
    }
  });

  $effect(() => {
    if (!mapInteractionsEnabled) {
      clearSelection();
    }
  });

  $effect(() => {
    if (!mapAreaEl || !sidebarEl) return;

    const onMapAreaWheel = (event) => {
      if (mapInteractionsEnabled) return;

      const maxScrollTop = sidebarEl.scrollHeight - sidebarEl.clientHeight;
      if (maxScrollTop <= 0) return;

      const prev = sidebarEl.scrollTop;
      const next = Math.min(maxScrollTop, Math.max(0, prev + event.deltaY));
      sidebarEl.scrollTop = next;

      if (next !== prev) {
        event.preventDefault();
      }
    };

    mapAreaEl.addEventListener("wheel", onMapAreaWheel, { passive: false });
    return () => {
      mapAreaEl.removeEventListener("wheel", onMapAreaWheel);
    };
  });

  function handleGlossarySelect(community) {
    mapComponent?.zoomToCommunity(community, 12, 1000);
  }

  function handleClearAll() {
    clearSelection();
    setSearchQuery("");
    mapComponent?.clearLabel?.();
  }
</script>

<div class="container">
  <aside class="sidebar" bind:this={sidebarEl}>
    <Header {title} />
    <ScrollyText slides_data={editorialData} />
    <div class="sticky-section">
      <Legend {riskArray} />
      <div class="search-controls">
        <SearchBar />
        {#if showClearAll}
          <button class="clear-btn" on:click={handleClearAll}>Clear all</button>
        {/if}
      </div>
    </div>
    <Glossary
      communities={$filteredItems}
      on:select={(e) => handleGlossarySelect(e.detail)}
    />
  </aside>

  <div class="map-area" bind:this={mapAreaEl}>
    <Map
      bind:this={mapComponent}
      interactionsEnabled={mapInteractionsEnabled}
    />
  </div>
</div>

<style>
  .container {
    display: flex;
    width: 100vw;
    height: 100vh;
    flex-direction: row;
  }

  .sidebar {
    flex: 0 0 45%;
    max-width: 450px;
    overflow-y: auto;
    background: #f9f9f9;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .sticky-section {
    position: sticky;
    top: 0;
    background: #f9f9f9;
    z-index: 10;
    border-bottom: 1px solid var(--color-fade);
    flex-shrink: 0;
  }

  .search-controls {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .search-controls :global(.search-bar) {
    flex: 1;
  }

  .search-controls :global(.search-bar input) {
    margin-bottom: 0;
    height: 100%;
    min-height: 38px;
  }

  .clear-btn {
    padding: 0.4rem 0.6rem;
    color: var(--color-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0.8;
    font-size: 1rem;
  }

  .clear-btn:hover {
    opacity: 1;
  }

  .map-area {
    flex: 1;
    position: relative;
  }

  .map-area > :global(svg),
  .map-area > :global(div) {
    width: 100%;
    height: 100%;
  }

  @media screen and (max-width: 767px) {
    .container {
      flex-direction: column;
      height: 100vh;
      width: 100%;
    }

    .sidebar {
      flex: 2;
      width: 100%;
      max-width: 100%;
      height: auto;
      order: 2;
      border-right: none;
      border-top: 1px solid var(--color-tertiary);
      overflow-y: auto;
    }
    .map-area {
      flex: 1;
      width: 100%;
      order: 1;
    }
  }
</style>
