<script>
  import { onMount } from "svelte";
  import {
    fetchCommunities,
    fetchCommunitiesData,
    fetchSettlements,
    fetchRiskColors,
    fetchEditorial,
    fetchTitle,
  } from "$lib/loadData.js";
  import MapContainer from "@components/MapContainer.svelte";

  let communities = [];
  let settlements = [];
  let mapItems = [];
  let filteredMapItems = [];
  let riskArray = [];
  let riskColors = {};
  let selectedItem = null;
  let error = null;
  let editorialData = [];
  let title = null;
  let loading = true;

  async function handleItemSelect(item) {
    try {
      if (item) {
        const res = await fetchCommunitiesData(item.id);
        selectedItem = res.result || res;
      }
    } catch (e) {
      console.error("detail fetch error:", e);
    }
  }

  function handleSearch(query) {
    const q = query.toLowerCase().trim();
    filteredMapItems =
      q.length < 3
        ? [...mapItems]
        : mapItems.filter((item) => {
            const t = item.title.toLowerCase();
            const alt = Array.isArray(item.alternativeNames)
              ? item.alternativeNames.some((a) => a.toLowerCase().includes(q))
              : false;
            return t.includes(q) || alt;
          });
  }

  onMount(async () => {
    loading = true;
    try {
      const [comms, setts, rc, editorial, tt] = await Promise.all([
        fetchCommunities(),
        fetchSettlements(),
        fetchRiskColors(),
        fetchEditorial(),
        fetchTitle(),
      ]);

      title = tt.result;
      communities = (comms.result || comms).map((c) => ({
        ...c,
        type: "community",
      }));
      settlements = (setts.result || setts).map((s) => ({
        ...s,
        type: "settlement",
      }));

      mapItems = [...communities];
      filteredMapItems = [...mapItems];

      riskArray = Array.isArray(rc.result)
        ? rc.result
        : rc.result
          ? [rc.result]
          : [];
      riskColors = {};
      riskArray.forEach((r) => {
        riskColors[r.riskvalue] = r.riskcolor;
      });

      editorialData = editorial?.result;
    } catch (e) {
      console.error(e);
      error = e;
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <div class="loader-container">
    <div class="loader"></div>
    <p>Loading...</p>
  </div>
{:else if error}
  <p class="error">Error loading: {error.message}</p>
{:else}
  <MapContainer
    bind:selectedItem
    communities={filteredMapItems}
    {settlements}
    {riskColors}
    {riskArray}
    {editorialData}
    {title}
    on:dotClick={(e) => handleItemSelect(e.detail)}
    on:search={(e) => handleSearch(e.detail)}
  />
{/if}

<style>
  .loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
  }
  .loader {
    border: 1px solid #f3f3f3;
    border-top: 1px solid var(--color-primary);
    border-radius: 50%;
    width: 10px;
    height: 10px;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .error {
    color: #ff4d4f;
    padding: 10px;
    text-align: center;
  }
</style>
