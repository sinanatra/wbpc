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

  const dispatch = createEventDispatcher();
  let mapComponent;

  onMount(async () => {
    await tick();
    if (mapComponent?.showSlide && editorialData.length) {
      mapComponent.showSlide(editorialData[0].id);
    }
  });

  function handleSlideEnter(e) {
    mapComponent?.showSlide(e.detail.slide.id);
  }
  function onSearch(e) {
    dispatch("search", e.detail);
  }
  function onDotClick(e) {
    dispatch("dotClick", e.detail);
  }

  // new: handle the select event from Glossary
  function handleGlossarySelect(e) {
    const community = e.detail;
    // 1) zoom the map
    mapComponent?.zoomToCommunity(community, 12, 1000);
    // 2) then dispatch dotClick so +page.svelte fetches details
    dispatch("dotClick", community);
  }
</script>

<div class="container">
  <aside class="sidebar">
    <Header {title} />
    <ScrollyText slides={editorialData} on:slideEnter={handleSlideEnter} />
    <Legend {riskArray} />
    <SearchBar on:search={onSearch} />

    <!-- listen for select instead of dotClick -->
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
    height: 100vh;
    width: 100vw;
  }

  .sidebar {
    flex: 0 0 45%;
    max-width: 450px;
    overflow-y: auto;
    background: #f9f9f9;
  }

  .map-area {
    flex: 1;
    position: relative;
  }
</style>
