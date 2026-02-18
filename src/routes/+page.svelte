<script>
  import { onMount, onDestroy } from "svelte";
  import MapContainer from "@components/MapContainer.svelte";
  import {
    fetchCommunities,
    fetchCommunitiesData,
    fetchSettlements,
    fetchRiskColors,
    fetchEditorial,
    fetchTitle,
  } from "$lib/loadData.js";
  import { communities, settlements, riskColors } from "$stores/mapStore.js";
  import { selectedItem, setSelectedItem, setMapItems, error } from "$stores/uiStore.js";

  let riskArray = [];
  let editorialData = [];
  let title = null;
  let shellLoading = true;
  let pointsLoading = true;
  let hasPoints = false;
  let loadError = null;
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

  function buildRiskColorsMap(risks) {
    const colors = {};
    risks.forEach((risk) => {
      colors[risk.riskvalue] = risk.riskcolor;
    });
    return colors;
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

  async function loadShellData() {
    shellLoading = true;
    try {
      const [rc, editorial, tt] = await Promise.all([
        retry(() => fetchRiskColors()),
        retry(() => fetchEditorial()),
        retry(() => fetchTitle()),
      ]);

      title = tt.result;
      riskArray = Array.isArray(rc.result)
        ? rc.result
        : rc.result
          ? [rc.result]
          : [];
      editorialData = editorial?.result || [];
      riskColors.set(buildRiskColorsMap(riskArray));
    } catch (e) {
      loadError = e;
      error.set(e);
    } finally {
      shellLoading = false;
    }
  }

  async function loadPointData() {
    pointsLoading = true;
    let pointsError = null;
    try {
      await Promise.allSettled([
        retry(() => fetchCommunities())
          .then((comms) => {
            const communitiesData = (comms.result || comms).map((c) => ({
              ...c,
              type: "community",
            }));
            communities.set(communitiesData);
            setMapItems(communitiesData);
            hasPoints = communitiesData.length > 0;
          })
          .catch((e) => {
            pointsError = pointsError || e;
            hasPoints = false;
          }),
        retry(() => fetchSettlements())
          .then((setts) => {
            const settlementsData = (setts.result || setts).map((s) => ({
              ...s,
              type: "settlement",
            }));
            settlements.set(settlementsData);
          })
          .catch((e) => {
            pointsError = pointsError || e;
          }),
      ]);

      if (pointsError) {
        throw pointsError;
      }
    } catch (e) {
      loadError = e;
      error.set(e);
    } finally {
      pointsLoading = false;
    }
  }

  function reloadData() {
    loadError = null;
    error.set(null);
    hasPoints = false;
    return loadShellData().then(() => loadPointData());
  }

  onMount(reloadData);

  onDestroy(() => {
    unsubscribeSelectedItem();
  });
</script>

<MapContainer
  {title}
  {riskArray}
  {editorialData}
  on:dotClick={(e) => handleItemSelect(e.detail)}
/>

{#if (shellLoading || pointsLoading) && !hasPoints}
  <div class="loader-container">
    <div class="loader"></div>
    <p>Loading…</p>
  </div>
{:else if loadError}
  <div class="error">
    Error loading data: {loadError.message}
    <br />
    <button on:click={reloadData}>Retry</button>
  </div>
{/if}

<style>
  .loader-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: rgba(249, 249, 249, 0.95);
    border: 1px solid var(--color-fade);
    color: var(--color-primary);
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .loader {
    border: 1px solid #f3f3f3;
    border-top: 1px solid var(--color-primary);
    border-radius: 50%;
    width: 14px;
    height: 14px;
    animation: spin 1s linear infinite;
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
    position: fixed;
    right: 12px;
    bottom: 12px;
    z-index: 50;
    background: rgba(249, 249, 249, 0.95);
    border: 1px solid var(--color-fade);
    border-color: var(--color-primary);
    color: var(--color-primary);
    padding: 8px 10px;
    border-radius: 4px;
    font-size: 0.9rem;
    max-width: 320px;
  }

  .error button {
    margin-top: 6px;
  }
</style>
