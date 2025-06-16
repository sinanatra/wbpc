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

  let MapContainerPromise;
  let MapContainer;

  function retry(fn, retries = 3, delay = 500) {
    let lastErr;
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < retries; i++) {
        try {
          return resolve(await fn());
        } catch (e) {
          lastErr = e;
          await new Promise((res) => setTimeout(res, delay));
        }
      }
      reject(lastErr);
    });
  }

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

  async function loadEverything() {
    loading = true;
    error = null;
    try {
      const [comms, setts, rc, editorial, tt] = await Promise.all([
        retry(() => fetchCommunities()),
        retry(() => fetchSettlements()),
        retry(() => fetchRiskColors()),
        retry(() => fetchEditorial()),
        retry(() => fetchTitle()),
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
      error = e;
    } finally {
      loading = false;
    }
  }

  $: if (!loading && !error && !MapContainerPromise) {
    MapContainerPromise = import("@components/MapContainer.svelte").then(
      (mod) => (MapContainer = mod.default)
    );
  }

  onMount(loadEverything);
</script>

{#if loading}
  <div class="loader-container">
    <div class="loader"></div>
    <p>Loading…</p>
  </div>
{:else if error}
  <div class="error">
    Error loading: {error.message}
    <br />
    <button
      on:click={() => {
        MapContainerPromise = null;
        loadEverything();
      }}>Reload</button
    >
  </div>
{:else}
  {#await MapContainerPromise}
    <div class="loader-container">
      <div class="loader"></div>
      <p>Loading map…</p>
    </div>
  {:then MapContainerComponent}
    <svelte:component
      this={MapContainerComponent}
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
  {:catch e}
    <div class="error">
      Could not load map UI: {e.message}
      <br />
      <button
        on:click={() => {
          MapContainerPromise = null;
          loadEverything();
        }}>Reload</button
      >
    </div>
  {/await}
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
