<script>
  import { onMount } from "svelte";
  import {
    fetchCommunities,
    fetchCommunitiesData,
    fetchRiskColors,
  } from "$lib/loadData.js";
  import { page } from "$app/stores";

  import Map from "@components/Map.svelte";
  import PageInfo from "@components/PageInfo.svelte";
  import Legend from "@components/Legend.svelte";
  import SearchBar from "@components/SearchBar.svelte";

  let communities = [];
  let filteredCommunities = [];
  let riskArray = [];
  let riskColors = {};
  let error = null;
  let selectedCommunity = null;

  let mapRef;

  async function handleCommunitySelect(community) {
    try {
      const detailData = await fetchCommunitiesData(community.id);
      selectedCommunity = detailData.result || detailData;
    } catch (err) {
      console.error("Error fetching community detail:", err);
    }
  }

  function handleMapClick(event) {
    handleCommunitySelect(event.detail);
  }

  function handleClosePanel() {
    selectedCommunity = null;
    if (mapRef?.clearLabel) {
      mapRef.clearLabel();
    }
  }

  function handleSearch(term) {
    const lowerTerm = term.toLowerCase().trim();

    if (lowerTerm.length < 3) {
      filteredCommunities = communities;
      return;
    }

    filteredCommunities = communities.filter((community) => {
      const titleMatch = community.title.toLowerCase().includes(lowerTerm);

      const altMatch =
        community.alternativeNames &&
        community.alternativeNames.some((alt) =>
          alt.toLowerCase().includes(lowerTerm)
        );

      return titleMatch || altMatch;
    });
  }

  onMount(async () => {
    try {
      const [communitiesData, riskColorsData] = await Promise.all([
        fetchCommunities(),
        fetchRiskColors(),
      ]);

      communities = communitiesData.result || communitiesData;
      filteredCommunities = communities;

      riskArray = riskColorsData.result || riskColorsData;
      riskColors = {};

      let communityPage = communities?.find((d) => {
        return d.id == $page.params.page;
      });

      if (communityPage) {
        handleCommunitySelect(communityPage);
        if (mapRef && mapRef.zoomToCommunity) {
          mapRef.zoomToCommunity(communityPage);
        }
      }

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
  <p>Error loading communities: {error.message}</p>
{:else}
  <section class="full-screen">
    <Legend {riskArray} />

    <SearchBar on:search={(e) => handleSearch(e.detail)} />

    <Map
      bind:this={mapRef}
      communities={filteredCommunities}
      {riskColors}
      on:dotClick={handleMapClick}
    />

    {#if selectedCommunity}
      <PageInfo community={selectedCommunity} on:close={handleClosePanel} />
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
