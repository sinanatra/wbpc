<script>
  import {
    map,
    layersToggles,
    showCommunitiesLayers,
    riskColors,
    toggleLayerVisibility
  } from "$stores/mapStore.js";

  function toggleLayer(layerId) {
    toggleLayerVisibility(layerId);
    if ($map && $map.getLayer(layerId)) {
      $map.setLayoutProperty(
        layerId,
        "visibility",
        $showCommunitiesLayers && $layersToggles[layerId] ? "visible" : "none",
      );
    }
  }
</script>

{#if $showCommunitiesLayers}
  <div class="map-legend">
    <div class="legend-item">
      <div class="legend-dots">
        {#each Object.entries($riskColors).slice(0, 3) as [risk, color]}
          <span
            class="legend-dot"
            style="background: {color}; border: .5px solid #000;"
          ></span>
        {/each}
      </div>
      <span>Communities</span>
    </div>
    <div class="legend-item" on:click={() => toggleLayer("outposts")}>
      <span
        class="legend-swatch"
        style="background:#fff; border-radius:100%; border:1.5px solid #000; opacity:{$layersToggles[
          'outposts'
        ]
          ? 1
          : 0.4};"
      ></span>
      <span class:legend-off={!$layersToggles["outposts"]}>Outposts</span>
    </div>
    <div
      class="legend-item"
      on:click={() => toggleLayer("settlement-jurisdiction-areas")}
    >
      <span
        class="legend-swatch"
        style="background:#c4c2bb; border:1.5px solid #c4c2bb; opacity:{$layersToggles[
          'settlement-jurisdiction-areas'
        ]
          ? 1
          : 0.4};"
      ></span>
      <span class:legend-off={!$layersToggles["settlement-jurisdiction-areas"]}
        >Settlement Jurisdiction Areas</span
      >
    </div>
    <div
      class="legend-item"
      on:click={() => toggleLayer("closed-military-zones")}
    >
      <span
        class="legend-swatch"
        style="background:#464544; border:1.5px solid #464544; opacity:{$layersToggles[
          'closed-military-zones'
        ]
          ? 1
          : 0.4};"
      ></span>
      <span class:legend-off={!$layersToggles["closed-military-zones"]}
        >Closed Military Zones</span
      >
    </div>
    <div
      class="legend-item"
      on:click={() => toggleLayer("settlements-circle-fixed")}
    >
      <span
        class="legend-swatch"
        style="background: rgba(0, 0, 0, .2);border-radius:100%; border: 1.5px solid black; opacity:{$layersToggles[
          'settlements-circle-fixed'
        ]
          ? 1
          : 0.4};"
      ></span>
      <span class:legend-off={!$layersToggles["settlements-circle-fixed"]}
        >Settlements</span
      >
    </div>
    <div
      class="legend-item"
      on:click={() => toggleLayer("demolition-orders")}
    >
      <span
        class="legend-swatch"
        style="background:#000000; border-radius:100%; border:1.5px solid #000000; opacity:{$layersToggles[
          'demolition-orders'
        ]
          ? 1
          : 0.4};"
      ></span>
      <span class:legend-off={!$layersToggles["demolition-orders"]}
        >Demolition Orders</span
      >
    </div>

    <div
      class="legend-item"
      on:click={() => toggleLayer("jordanian-state-land")}
    >
      <span
        class="legend-swatch"
        style="background:#b5b5b5; border:1.5px solid #b5b5b5; opacity:{$layersToggles[
          'jordanian-state-land'
        ]
          ? 1
          : 0.4};"
      ></span>
      <span class:legend-off={!$layersToggles["jordanian-state-land"]}
        >Jordanian State Land</span
      >
    </div>
  </div>
{/if}

<style>
  .map-legend {
    position: absolute;
    bottom: 8px;
    left: 8px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 1);
    border: 1px solid var(--color-tertiary);
    border-radius: 3px;
    font-size: 0.97rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    z-index: 20;
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    cursor: pointer;
    user-select: none;
  }

  .legend-swatch {
    width: 18px;
    height: 18px;
    display: inline-block;
    margin-right: 8px;
    border: 1.5px solid #222;
    transition: opacity 0.15s;
  }

  .legend-dots {
    display: flex;
    margin-right: 8px;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    margin-right: -5px;
  }

  .legend-off {
    opacity: 0.5;
    text-decoration: line-through;
  }

  @media screen and (max-width: 767px) {
    .map-legend {
      padding: 1px 2px;
      font-size: 0.9rem;
      line-height: 1.2rem;
      bottom: 4px;
      left: unset;
      right: 4px;
      max-height: 40vh;
      overflow-y: auto;
    }

    .legend-item {
      margin-bottom: 1px;
      padding: 0.5px 0;
      line-height: 1;
    }

    .legend-swatch {
      width: 8px;
      height: 8px;
      margin-right: 2px;
    }

    .legend-dot {
      width: 4px;
      height: 4px;
      margin-right: -1px;
    }
  }
</style>
