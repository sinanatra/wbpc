<script>
  import { onMount } from "svelte";
  import {
    fetchCommunities,
    fetchCommunitiesData,
    fetchSettlements,
    fetchSettlementsData,
    fetchRiskColors,
  } from "$lib/loadData.js";

  import Map from "@components/Map.svelte";
  import PageInfo from "@components/PageInfo.svelte";
  import Legend from "@components/Legend.svelte";
  import SearchBar from "@components/SearchBar.svelte";

  let communities = [];
  let settlements = [];
  let mapItems = [];
  let filteredMapItems = [];

  let riskArray = [];
  let riskColors = {};
  let error = null;
  let selectedItem = null;

  let mapRef;

  async function handleItemSelect(item) {
    try {
      if (item.type === "community") {
        const detailData = await fetchCommunitiesData(item.id);
        selectedItem = detailData.result || detailData;
      } else if (item.type === "settlement") {
        const detailData = await fetchSettlementsData(item.id);
        selectedItem = detailData.result || detailData;
      }
    } catch (err) {
      console.error("Error fetching detail:", err);
    }
  }

  function handleMapClick(event) {
    handleItemSelect(event.detail);
  }

  function handleClosePanel() {
    selectedItem = null;
    mapRef?.clearLabel && mapRef.clearLabel();
  }

  function handleSearch(term) {
    const lowerTerm = term.toLowerCase().trim();

    if (lowerTerm.length < 3) {
      filteredMapItems = mapItems;
      return;
    }

    filteredMapItems = mapItems.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(lowerTerm);
      const altMatch =
        Array.isArray(item.alternativeNames) &&
        item.alternativeNames.some((alt) =>
          alt.toLowerCase().includes(lowerTerm)
        );
      return titleMatch || altMatch;
    });
  }

  onMount(async () => {
    try {
      const [communitiesData, settlementsData, riskColorsData] =
        await Promise.all([
          fetchCommunities(),
          fetchSettlements(),
          fetchRiskColors(),
        ]);

      communities = (communitiesData.result || communitiesData).map((c) => ({
        ...c,
        type: "community",
      }));
      settlements = (settlementsData.result || settlementsData).map((s) => ({
        ...s,
        type: "settlement",
      }));

      mapItems = [...communities, ...settlements];
      filteredMapItems = mapItems;

      riskArray = riskColorsData.result || riskColorsData;
      riskColors = {};

      if (Array.isArray(riskArray)) {
        riskArray.forEach((item) => {
          riskColors[item.riskvalue] = item.riskcolor;
        });
      } else if (riskArray?.riskvalue && riskArray?.riskcolor) {
        riskColors[riskArray.riskvalue] = riskArray.riskcolor;
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      error = err;
    }
  });
</script>

{#if error}
  <p>Error loading data: {error.message}</p>
{:else}
  <section class="full-screen">
    <Legend {riskArray} />

    <SearchBar on:search={(e) => handleSearch(e.detail)} />

    <Map
      bind:this={mapRef}
      communities={filteredMapItems}
      {riskColors}
      on:dotClick={handleMapClick}
    />

    {#if selectedItem}
      <PageInfo community={selectedItem} on:close={handleClosePanel} />
    {/if}
  </section>
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: sans-serif;
  }

  p {
    padding: 10px;
  }

  .full-screen {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }
</style>
