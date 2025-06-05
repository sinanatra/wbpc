<script>
  import { onMount, tick, createEventDispatcher } from "svelte";
  import Map from "@components/Map.svelte";
  import SearchBar from "@components/SearchBar.svelte";
  import Legend from "@components/Legend.svelte";
  import ScrollyText from "@components/ScrollyText.svelte";
  import Header from "@components/Header.svelte";
  import Glossary from "@components/Glossary.svelte";

  export let editorialData = [];
  export let communities = [];
  export let settlements = [];
  export let riskColors = {};
  export let riskArray = [];
  export let selectedItem = null;
  export let title = "";
  export let mapRef; 

  const dispatch = createEventDispatcher();
  let mapComponent;

  $: mapRef = mapComponent;

  const handleSlideEnter = debounce((e) => {
    mapComponent?.showSlide(e.detail.slide.id);
  }, 200);

  function debounce(fn, wait = 100) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  function onSearch(e) {
    dispatch("search", e.detail);
  }

  function onDotClick(e) {
    dispatch("dotClick", e.detail);
  }

  function handleGlossarySelect(e) {
    const community = e.detail;
    mapComponent?.zoomToCommunity(community, 12, 1000);
    dispatch("dotClick", community);
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
    <ScrollyText slides={editorialData} on:slideEnter={handleSlideEnter} />
    <Legend {riskArray} />
    <SearchBar on:search={onSearch} />
    <Glossary
      {communities}
      {selectedItem}
      on:select={handleGlossarySelect}
      on:close={() => dispatch("dotClick", null)}
    />
  </aside>

  <div class="map-area">
    <Map
      bind:this={mapComponent}
      {communities}
      {settlements}
      {riskColors}
      on:dotClick={onDotClick}
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
      flex-direction: column-reverse;
    }

    .map-area {
      flex: 0 0 60vh;
    }
  }
</style>
