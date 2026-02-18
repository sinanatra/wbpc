<script>
  import {
    map,
    layersToggles,
    showCommunitiesLayers,
    riskColors,
    toggleLayerVisibility,
  } from "$stores/mapStore.js";

  function applyVisibility(layerIds, enabled) {
    if (!$map) return;

    layerIds.forEach((id) => {
      if ($map.getLayer(id)) {
        $map.setLayoutProperty(
          id,
          "visibility",
          $showCommunitiesLayers && enabled ? "visible" : "none",
        );
      }
    });
  }

  function toggleLayer(layerId) {
    const nextEnabled = !$layersToggles[layerId];
    toggleLayerVisibility(layerId);

    if (layerId === "settlements-circle") {
      applyVisibility(
        ["settlements-circle", "settlements-circle-fixed"],
        nextEnabled,
      );
      return;
    }

    applyVisibility([layerId], nextEnabled);
  }
</script>

{#if $showCommunitiesLayers}
  <div class="map-legend">
    <div class="legend-item">
      <div class="legend-dots">
        {#each Object.entries($riskColors).slice(0, 4) as [risk, color]}
          <span
            class="legend-dot"
            style="background: {color}; border: .5px solid #000;"
          ></span>
        {/each}
      </div>
      <span>Communities</span>
    </div>
    <button
      class="legend-item"
      class:legend-off={!$layersToggles["settlements-circle"]}
      on:click={() => toggleLayer("settlements-circle")}
      type="button"
    >
      <span
        class="legend-swatch"
        style="background: rgba(0, 0, 0, .2);border-radius:100%; border: 1.5px solid black; opacity:{$layersToggles[
          'settlements-circle'
        ]
          ? 1
          : 0.4};"
      ></span>
      <span>Settlements</span>
    </button>
    <button
      class="legend-item"
      class:legend-off={!$layersToggles["outposts"]}
      on:click={() => toggleLayer("outposts")}
      type="button"
    >
      <span
        class="legend-swatch"
        style="background:#fff; border-radius:100%; border:1.5px solid #000; opacity:{$layersToggles[
          'outposts'
        ]
          ? 1
          : 0.4};"
      ></span>
      <span>Outposts</span>
    </button>
    <button
      class="legend-item"
      class:legend-off={!$layersToggles["settlement-jurisdiction-areas"]}
      on:click={() => toggleLayer("settlement-jurisdiction-areas")}
      type="button"
    >
      <span
        class="legend-swatch"
        style="background:#c4c2bb; border:1.5px solid #c4c2bb; opacity:{$layersToggles[
          'settlement-jurisdiction-areas'
        ]
          ? 1
          : 0.4};"
      ></span>
      <span>Settlement Jurisdiction Areas</span>
    </button>
    <button
      class="legend-item"
      class:legend-off={!$layersToggles["closed-military-zones"]}
      on:click={() => toggleLayer("closed-military-zones")}
      type="button"
    >
      <span
        class="legend-swatch"
        style="background:#464544; border:1.5px solid #464544; opacity:{$layersToggles[
          'closed-military-zones'
        ]
          ? 1
          : 0.4};"
      ></span>
      <span>Closed Military Zones</span>
    </button>
    <button
      class="legend-item"
      class:legend-off={!$layersToggles["jordanian-state-land"]}
      on:click={() => toggleLayer("jordanian-state-land")}
      type="button"
    >
      <span
        class="legend-swatch"
        style="background:#b5b5b5; border:1.5px solid #b5b5b5; opacity:{$layersToggles[
          'jordanian-state-land'
        ]
          ? 1
          : 0.4};"
      ></span>
      <span>Declared State Land</span>
    </button>
  </div>
{/if}

<style>
  .map-legend {
    position: absolute;
    bottom: 8px;
    left: 8px;

    font-size: 0.97rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    z-index: 20;

    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    /* white-space: nowrap; */
    /* overflow-x: auto; */
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 0;
    cursor: pointer;
    user-select: none;
    padding: 4px 8px;
    border: 1px solid var(--color-tertiary);
    border-radius: 3px;
    font: inherit;
    color: inherit;
    white-space: nowrap;
    background-color: white;
  }

  .legend-item:hover {
    opacity: 0.8;
  }

  .legend-item:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
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
    background-color: gainsboro;
    opacity: 0.8;
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
      max-height: unset;
      overflow-x: auto;
    }

    .legend-item {
      margin-bottom: 0;
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
