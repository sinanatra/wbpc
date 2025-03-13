<script>
  import { onMount } from "svelte";
  import {
    fetchCommunities,
    fetchCommunitiesData,
    fetchRiskColors,
  } from "$lib/loadData.js";
  import Map from "@components/Map.svelte";
  import PageInfo from "@components/PageInfo.svelte";
  import Legend from "@components/Legend.svelte";

  let communities = [];
  let riskArray = [];
  let riskColors = {};
  let error = null;
  let selectedCommunity = null;

  async function handleCommunitySelect(community) {
    try {
      const detailData = await fetchCommunitiesData(community.id);
      selectedCommunity = detailData.result || detailData;
    } catch (err) {
      console.error("Error fetching community detail:", err);
    }
  }

  onMount(async () => {
    try {
      const [communitiesData, riskColorsData] = await Promise.all([
        fetchCommunities(),
        fetchRiskColors(),
      ]);
      communities = communitiesData.result || communitiesData;

      riskArray = riskColorsData.result || riskColorsData;
      riskColors = {};
      if (Array.isArray(riskArray)) {
        riskArray.forEach((item) => {
          riskColors[item.riskvalue] = item.riskcolor;
        });
      } else {
        riskColors[riskArray.riskvalue] = riskArray.riskcolor;
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      error = err;
    }
  });

  function handleMapClick(event) {
    handleCommunitySelect(event.detail);
  }
</script>

{#if error}
  <p>Error loading communities: {error.message}</p>
{:else if communities.length === 0}
  <!-- <p>Loading communities...</p> -->
  <section class="full-screen">
    <Map />
  </section>
{:else}
  <section class="full-screen">
    <Legend {riskArray} />
    <Map {communities} {riskColors} on:dotClick={handleMapClick} />

    {#if selectedCommunity}
      <PageInfo community={selectedCommunity} />
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
