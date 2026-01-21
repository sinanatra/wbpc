<script>
  import { onMount, onDestroy } from "svelte";
  import {
    fetchCommunities,
    fetchCommunitiesData,
    fetchSettlements,
    fetchRiskColors,
    fetchEditorial,
    fetchTitle,
  } from "$lib/loadData.js";
  import { communities, settlements, riskColors } from "$stores/mapStore.js";
  import { selectedItem, setSelectedItem, setMapItems, filteredItems, isLoading, error } from "$stores/uiStore.js";

  let riskArray = [];
  let editorialData = [];
  let title = null;

  let MapContainerPromise;
  let MapContainer;
  let lastFetchedId = null;

  const unsubscribeSelectedItem = selectedItem.subscribe((item) => {
    if (item?.id && item.id !== lastFetchedId) {
      handleItemSelect(item);
    }
  });

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
      if (item?.id) {
        lastFetchedId = item.id;
        const res = await fetchCommunitiesData(item.id);
        setSelectedItem(res.result || res);
      }
    } catch (e) {
      console.error("detail fetch error:", e);
    }
  }

  async function loadEverything() {
    isLoading.set(true);
    error.set(null);
    try {
      const [comms, setts, rc, editorial, tt] = await Promise.all([
        retry(() => fetchCommunities()),
        retry(() => fetchSettlements()),
        retry(() => fetchRiskColors()),
        retry(() => fetchEditorial()),
        retry(() => fetchTitle()),
      ]);

      title = tt.result;
      
      const communitiesData = (comms.result || comms).map((c) => ({
        ...c,
        type: "community",
      }));
      
      const settlementsData = (setts.result || setts).map((s) => ({
        ...s,
        type: "settlement",
      }));

      riskArray = Array.isArray(rc.result)
        ? rc.result
        : rc.result
          ? [rc.result]
          : [];
      
      const riskColorsObj = {};
      riskArray.forEach((r) => {
        riskColorsObj[r.riskvalue] = r.riskcolor;
      });

      editorialData = editorial?.result;

      communities.set(communitiesData);
      settlements.set(settlementsData);
      riskColors.set(riskColorsObj);
      setMapItems(communitiesData);
    } catch (e) {
      error.set(e);
    } finally {
      isLoading.set(false);
    }
  }

  $effect(() => {
    if (!MapContainerPromise) {
      MapContainerPromise = import("@components/MapContainer.svelte").then(
        (mod) => (MapContainer = mod.default)
      );
    }
  });

  onMount(loadEverything);

  onDestroy(() => {
    unsubscribeSelectedItem();
  });
</script>

{#if $isLoading}
  <div class="loader-container">
    <div class="loader"></div>
    <p>Loading…</p>
  </div>
{:else if $error}
  <div class="error">
    Error loading: {$error.message}
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
      {title}
      {riskArray}
      {editorialData}
      on:dotClick={(e) => handleItemSelect(e.detail)}
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
    color: var(--color-primary);
    padding: 10px;
    text-align: center;
  }
</style>
