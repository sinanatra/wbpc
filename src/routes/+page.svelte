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

  async function handleItemSelect(item) {
    try {
      if (item) {
        // console.log("item selected:", item);
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
    }
  });
</script>

{#if error}
  <p>Error loading data: {error.message}</p>
{:else if editorialData.length}
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
  p {
    padding: 10px;
  }
</style>
