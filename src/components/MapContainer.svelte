<script>
  import { onMount, tick } from "svelte";
  import Map from "@components/Map.svelte";
  import SearchBar from "@components/SearchBar.svelte";
  import Legend from "@components/Legend.svelte";
  import ScrollyText from "@components/ScrollyText.svelte";
  import Header from "@components/Header.svelte";
  import Glossary from "@components/Glossary.svelte";
  import { communities } from "$stores/mapStore.js";
  import { currentSlideId } from "$stores/scrollStore.js";
  import { filteredItems } from "$stores/uiStore.js";

  let { editorialData = [], riskArray = [], title = "", mapRef = undefined, mapComponent = undefined } = $props();

  const debounce = (fn, wait = 100) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };

  const handleSlideChange = debounce(() => {
    if ($currentSlideId && mapComponent?.showSlide) {
      mapComponent.showSlide($currentSlideId);
    }
  }, 200);

  $effect(() => {
    if ($currentSlideId) {
      handleSlideChange();
    }
  });

  function handleGlossarySelect(community) {
    mapComponent?.zoomToCommunity(community, 12, 1000);
  }

  onMount(async () => {
    await tick();
    if (mapComponent?.showSlide && editorialData.length) {
      mapComponent.showSlide(editorialData[0].id);
    }
  });
</script>

<div class="container">
  <aside class="sidebar">
    <Header {title} />
    <ScrollyText slides_data={editorialData} />
    <div class="sticky-section">
      <Legend {riskArray} />
      <SearchBar />
    </div>
    <Glossary
      communities={$filteredItems}
      on:select={(e) => handleGlossarySelect(e.detail)}
    />
  </aside>

  <div class="map-area">
    <Map
      bind:this={mapComponent}
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
