<script>
  import { onMount } from "svelte";
  import Map from "@components/Map.svelte";
  import Header from "@components/Header.svelte";
  import PageInfo from "@components/PageInfo.svelte";
  import Legend from "@components/Legend.svelte";
  import { selectedItem, setSelectedItem } from "$stores/uiStore.js";
  import { communities, settlements, riskColors } from "$stores/mapStore.js";
  import { fetchRiskColors } from "$lib/loadData.js";

  export let data;

  let mapComponent = undefined;
  let riskArray = [];
  let initialCenter = [];
  let initialZoom;

  function getLatestRiskValue(item) {
    const risks = Array.isArray(item?.risks) ? item.risks : [];
    const latest = risks
      .slice()
      .sort((a, b) => new Date(b.riskdate) - new Date(a.riskdate))[0]?.riskvalue;
    return item?.risk ?? latest ?? "default";
  }

  onMount(async () => {
    try {
      const rc = await fetchRiskColors();

      riskArray = Array.isArray(rc.result)
        ? rc.result
        : rc.result
          ? [rc.result]
          : [];

      const riskColorsObj = {};
      riskArray.forEach((r) => {
        riskColorsObj[r.riskvalue] = r.riskcolor;
      });

      riskColors.set(riskColorsObj);

      if (data.community) {
        const coords = data.community.coordinates;
        const riskValue = getLatestRiskValue(data.community);

        const communityWithType = {
          ...data.community,
          type: "community",
          risk: riskValue,
          coordinates: coords,
        };

        communities.set([communityWithType]);
        settlements.set([]);

        setSelectedItem(communityWithType);

        if (coords?.lon && coords?.lat) {
          initialCenter = [parseFloat(coords.lon), parseFloat(coords.lat)];
          initialZoom = 14;
        }
      }
    } catch (e) {
      console.error("Failed to load map data:", e);
    }
  });
</script>

<div class="container">
  <aside class="sidebar">
    <Header />
    <div class="community-content">
      {#if data.community}
        <PageInfo community={data.community} hideLink={true} />
      {:else}
        <div class="error">Community not found</div>
      {/if}
      <Legend {riskArray} />
    </div>
  </aside>

  <div class="map-area">
    {#if initialCenter && initialZoom}
      <Map
        bind:this={mapComponent}
        {initialCenter}
        initialZoomLevel={initialZoom}
        singleCommunity={data.community}
      />
    {/if}
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
    display: flex;
    flex-direction: column;
  }

  .community-content {
    flex: 1;
    overflow-y: auto;
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

  .error {
    color: var(--color-primary);
    padding: 10px;
    text-align: center;
  }

  @media screen and (max-width: 767px) {
    .container {
      flex-direction: column;
      height: 100vh;
      width: 100%;
    }

    .sidebar {
      flex: 2;
      width: 100%;
      max-width: 100%;
      height: auto;
      order: 2;
      border-right: none;
      border-top: 1px solid var(--color-tertiary);
      overflow-y: auto;
    }

    .map-area {
      flex: 1;
      width: 100%;
      order: 1;
    }

    .community-content {
      overflow: visible;
    }
  }
</style>
