<script>
  import { onMount, onDestroy } from "svelte";
  import mapboxgl from "mapbox-gl";
  import {
    map,
    mapLoaded,
    mapContainer,
    activeSlide,
    targetZoom,
    labelMarker,
    alertPillMarkers,
    layersToggles,
    showCommunitiesLayers,
    showSettlementsLegend,
    communities,
    settlements,
    riskColors,
    clearAllMarkers,
    toggleLayerVisibility
  } from "$stores/mapStore.js";
  import { selectedItem, setSelectedItem } from "$stores/uiStore.js";

  mapboxgl.accessToken =
    "pk.eyJ1Ijoic2luYW5hdHJhIiwiYSI6ImNpcTloaTlocjAwNWFodm0yODJjODF5MXYifQ.urgyj3bpfbG3dX4uTOOZtQ";

  const STYLE_URL = `mapbox://styles/sinanatra/cm7yteg6x00ty01sc85aqduv2?${Date.now()}`;

  let mapContainerElement;
  let isMobile = false;

  function clearPills() {
    alertPillMarkers.update(markers => {
      markers.forEach((m) => m.remove());
      return [];
    });
  }

  function showLabel(feature) {
    labelMarker.update(marker => {
      marker?.remove();
      return null;
    });
    
    setTimeout(() => {
      const p = feature.properties;
      let color;
      if (p.type === "community") {
        const rv = p.risks?.[0]?.riskvalue ?? p.risk ?? "default";
        color = $riskColors[rv] || "#aaa";
      } else if (p.type === "settlement") {
        color = "#555";
      } else if (p.type === "outpost") {
        color = "#fff";
      } else {
        color = "#aaa";
      }

      const el = document.createElement("div");
      el.className = "label-container";
      el.innerHTML = `
      <svg class="label-line" width="50" height="50" viewBox="0 0 50 50">
        <line x1="0" y1="50" x2="50" y2="0" stroke="${color}" stroke-width="2"/>
      </svg>
      <div class="label-box" style="background:${color};color:black">
        ${p.title}
      </div>`;
      const newMarker = new mapboxgl.Marker({ element: el, anchor: "bottom-left" })
        .setLngLat(feature.geometry.coordinates)
        .addTo($map);
      labelMarker.set(newMarker);
    }, 0);
  }

  function addAlertPills(list) {
    clearPills();
    list.forEach((item) => {
      if (!item.lastAlertDate || !item.lastAlertText?.trim()) return;
      const pill = document.createElement("div");
      pill.className = "alert-pill";
      const count = item.alertCount || 1;
      pill.textContent = `${count}${count === 1 ? " new alert" : " new alerts"}`;
      pill.style.backgroundColor =
        $riskColors[item.risks[0].riskvalue] || "rgba(255,255,255,0)";
      pill.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedItem(item);
        showLabel({
          geometry: {
            coordinates: [item.coordinates.lon, item.coordinates.lat],
          },
          properties: item,
        });
        setTimeout(() => {
          $map.flyTo({
            center: [item.coordinates.lon, item.coordinates.lat],
            zoom: $targetZoom,
            duration: 3000,
          });
        }, 50);
      });
      const marker = new mapboxgl.Marker({ element: pill, offset: [20, 0] })
        .setLngLat([item.coordinates.lon, item.coordinates.lat])
        .addTo($map);
      alertPillMarkers.update(markers => [...markers, marker]);
    });
  }

  export function clearLabel() {
    labelMarker.update(marker => {
      marker?.remove();
      return null;
    });
  }

  let center = [35.23, 31.95];

  onMount(() => {
    isMobile = window.matchMedia("(max-width: 767px)").matches;

    const initialPitch = isMobile ? 50 : 0;
    const minZoomLevel = 8;
    const initialZoom = 8;

    const maxBounds = [
      [33.5, 30.8], // Southwest corner
      [36.5, 33.2], // Northeast corner
    ];

    const mapInstance = new mapboxgl.Map({
      container: mapContainerElement,
      style: STYLE_URL,
      center: center,
      zoom: initialZoom,
      minZoom: minZoomLevel,
      maxZoom: 18,
      // maxBounds: maxBounds,
      pitch: initialPitch,
      bearing: 0,
      scrollZoom: false,
      dragPan: isMobile ? false : true,
    });

    map.set(mapInstance);

    mapInstance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    mapInstance.on("zoom", () => {
      toggleZoomLayers();
    });

    mapInstance.on("load", () => {
      mapLoaded.set(true);

      addStaticLabel(
        "Occupied West Bank",
        isMobile
          ? [34.96829552848957, 31.82178927355715]
          : [35.4558374411592, 32.404],
        "#ccc",
      );

      mapInstance.addSource("points", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            ...$communities.map((c) => {
              const latestRisk =
                (c.risks || [])
                  .slice()
                  .sort(
                    (a, b) => new Date(b.riskdate) - new Date(a.riskdate),
                  )[0]?.riskvalue || "default";

              return {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [
                    parseFloat(c.coordinates.lon),
                    parseFloat(c.coordinates.lat),
                  ],
                },
                properties: {
                  ...c,
                  risk: latestRisk,
                },
              };
            }),
            ...$settlements.map((s) => ({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [
                  parseFloat(s.coordinates.lon),
                  parseFloat(s.coordinates.lat),
                ],
              },
              properties: {
                ...s,
                type: "settlement",
                size: Number(s.size) || 0,
                year: Number(s.year),
              },
            })),
          ],
        },
      });

      function addStaticLabel(text, coordinates, color = "#aaa") {
        const el = document.createElement("div");
        el.className = "label-container";
        el.innerHTML = `
    <svg class="label-line" width="50" height="50" viewBox="0 0 50 50">
      <line x1="0" y1="50" x2="50" y2="0" stroke="${color}" stroke-width="2"/>
    </svg>
    <div class="label-box" style="background:${color};color:black">
      ${text}
    </div>
  `;
        return new mapboxgl.Marker({ element: el, anchor: "bottom-left" })
          .setLngLat(coordinates)
          .addTo(mapInstance);
      }

      mapInstance.on("click", "communities-circle", (e) => {
        if (!e.features?.length) return;
        const feat = e.features[0];
        setSelectedItem(feat.properties);
        showLabel(feat);
        mapInstance.flyTo({
          center: feat.geometry.coordinates,
          zoom: $targetZoom,
          duration: 1500,
        });
      });
      mapInstance.on("mouseenter", "communities-circle", () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "communities-circle", () => {
        mapInstance.getCanvas().style.cursor = "";
      });

      mapInstance.addLayer({
        id: "settlements-circle",
        type: "circle",
        source: "points",
        filter: ["==", ["get", "type"], "settlement"],
        minzoom: 0,
        maxzoom: 11,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear", ["clamp", true]],
            ["coalesce", ["to-number", ["get", "size"]], 0],
            100,
            2,
            1000,
            12,
            10000,
            20,
          ],
          "circle-color": "rgba(0, 0, 0, .2)",
          "circle-stroke-color": "black",
          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,
            0.5,
            11,
            2,
            14,
            2,
            18,
            4,
          ],
        },
        layout: { visibility: "none" },
      });

      mapInstance.addLayer({
        id: "settlements-circle-fixed",
        type: "circle",
        source: "points",
        filter: ["==", ["get", "type"], "settlement"],
        minzoom: 11,
        paint: {
          "circle-radius": 6,
          "circle-color": "rgba(0, 0, 0, .2)",
          "circle-stroke-color": "black",
          "circle-stroke-width": 1,
        },
      });

      mapInstance.addLayer({
        id: "communities-circle",
        type: "circle",
        source: "points",
        paint: {
          "circle-radius": 6,
          "circle-color": "#aaa",
        },
        filter: ["==", ["get", "type"], "community"],
        layout: { visibility: "none" },
      });

      mapInstance.on("click", "settlements-circle-fixed", (e) => {
        if (!e.features?.length) return;
        const feat = e.features[0];
        setSelectedItem(feat.properties);
        showLabel(feat);
        mapInstance.flyTo({
          center: feat.geometry.coordinates,
          zoom: $targetZoom,
          duration: 1500,
        });
      });
      mapInstance.on("mouseenter", "settlements-circle-fixed", () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "settlements-circle-fixed", () => {
        mapInstance.getCanvas().style.cursor = "";
      });

      mapInstance.on("click", "outposts", (e) => {
        if (!e.features?.length) return;
        const feat = e.features[0];

        feat.properties.title =
          feat.properties["Name_Engli"] ||
          feat.properties["שם"] ||
          feat.properties["ערבית"] ||
          "Unknown";

        feat.properties.type = "outpost";

        setSelectedItem(feat.properties);
        showLabel(feat);
        mapInstance.flyTo({
          center: feat.geometry.coordinates,
          zoom: $targetZoom,
          duration: 1500,
        });
      });

      mapInstance.on("mouseenter", "outposts", () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "outposts", () => {
        mapInstance.getCanvas().style.cursor = "";
      });

      if (mapInstance.getLayer("outposts")) {
        mapInstance.setPaintProperty("outposts", "circle-stroke-color", "#000");
        mapInstance.setPaintProperty("outposts", "circle-stroke-width", 2);
        mapInstance.setPaintProperty("outposts", "circle-radius", 2);
      }

      if (mapInstance.getLayer("demolition-orders")) {
        mapInstance.setPaintProperty("demolition-orders", "fill-opacity", 0.1);
        mapInstance.setPaintProperty("demolition-orders", "circle-radius", 2);
      }

      if (mapInstance.getLayer("jordanian-state-land")) {
        mapInstance.setPaintProperty("jordanian-state-land", "fill-opacity", 0.1);
      }

      if (mapInstance.getLayer("settlement-jurisdiction-areas")) {
        mapInstance.setPaintProperty(
          "settlement-jurisdiction-areas",
          "fill-opacity",
          0.1,
        );
      }

      if (mapInstance.getLayer("closed-military-zones")) {
        mapInstance.setPaintProperty("closed-military-zones", "fill-opacity", 0.1);
        mapInstance.setPaintProperty(
          "closed-military-zones",
          "fill-outline-color",
          "#000",
        );
      }

      ["oslo", "closed-military-zones", "area-a", "area-b", "area-c"].forEach(
        (layerId) => {
          if (mapInstance.getLayer(layerId)) {
            mapInstance.setLayoutProperty(layerId, "visibility", "none");
          }
        },
      );
    });
  });

  $: if ($map && $mapLoaded && $riskColors && Object.keys($riskColors).length) {
    const colorExpr = [
      "match",
      ["get", "risk"],
      ...Object.entries($riskColors).flatMap(([rv, col]) => [rv, col]),
      "#aaa",
    ];
    if ($map.getLayer("communities-circle")) {
      $map.setPaintProperty("communities-circle", "circle-color", colorExpr);
    }
  }

  export function resize() {
    if ($map) $map.resize();
  }

  export function showSlide(id) {
    if (!$map?.isStyleLoaded()) return;
    $map.resize();

    activeSlide.set(id);

    // const defaultCenter = [35.3182, 31.9613];
    const defaultZoom = 6;

    // const communitiesCenter = [35.23, 31.95];
    const communitiesZoom = 8.5;

    // let center = communitiesCenter;

    let zoom = defaultZoom;

    if (id === "communities") {
      // center = communitiesCenter;
      zoom = communitiesZoom;
    } else if (id === "settlements") {
      zoom = 8;
    }

    $map.flyTo({
      center: center,
      zoom: zoom,
      duration: 1000,
      pitch: $map.getPitch(),
      bearing: $map.getBearing(),
    });

    clearLabel();
    clearPills();

    [
      "settlements-circle",
      "settlements-circle-fixed",
      "communities-circle",
      "oslo",
      "closed-military-zones",
      "area-a",
      "area-b",
      "area-c",
    ].forEach((l) => $map.setLayoutProperty(l, "visibility", "none"));

    if (id === "communities") {
      $map.scrollZoom.enable();
      $map.setLayoutProperty("communities-circle", "visibility", "visible");
      addAlertPills($communities);
    } else if (id === "settlements") {
      $map.setLayoutProperty("settlements-circle", "visibility", "visible");
    } else if (id === "closed-military-zones") {
      $map.setLayoutProperty("area-c", "visibility", "visible");
      $map.setLayoutProperty("closed-military-zones", "visibility", "visible");
    } else if (id === "area-a") {
      $map.setLayoutProperty("area-a", "visibility", "visible");
    } else if (id === "area-b") {
      $map.setLayoutProperty("area-a", "visibility", "visible");
      $map.setLayoutProperty("area-b", "visibility", "visible");
    } else if (id === "all-areas") {
      $map.setLayoutProperty("area-a", "visibility", "visible");
      $map.setLayoutProperty("area-b", "visibility", "visible");
      $map.setLayoutProperty("area-c", "visibility", "visible");
    } else if (id === "area-c") {
      $map.setLayoutProperty("area-c", "visibility", "visible");
    }

    toggleZoomLayers();
  }

  function toggleZoomLayers() {
    const zoom = $map.getZoom();
    const shouldShow = zoom >= 11;
    showSettlementsLegend.set(shouldShow);
    showCommunitiesLayers.set(shouldShow);

    // if (shouldShow) {
    //   $map.setLayoutProperty("settlements-circle", "visibility", "visible");
    // } else {
    //   $map.setLayoutProperty("settlements-circle", "visibility", "none");
    // }

    [
      "outposts",
      "settlement-jurisdiction-areas",
      "demolition-orders",
      "jordanian-state-land",
    ].forEach((id) => {
      $map.setLayoutProperty(
        id,
        "visibility",
        shouldShow && $layersToggles[id] ? "visible" : "none",
      );
    });

    ["settlements-circle", "settlements-circle-fixed"].forEach((id) => {
      $map.setLayoutProperty(
        id,
        "visibility",
        (shouldShow || $activeSlide === "settlements") && $layersToggles[id]
          ? "visible"
          : "none",
      );
    });

    if ($map.getLayer("closed-military-zones")) {
      $map.setLayoutProperty(
        "closed-military-zones",
        "visibility",
        (shouldShow || $activeSlide === "closed-military-zones") &&
          $layersToggles["closed-military-zones"]
          ? "visible"
          : "none",
      );
    }
  }

  export function zoomToCommunity(
    comm,
    zoomLevel = 12,
    duration = 1000,
  ) {
    const { lon, lat } = comm.coordinates || {};
    if (lon == null || lat == null) return;
    $map.flyTo({
      center: [lon, lat],
      zoom: zoomLevel,
      duration,

      pitch: $map.getPitch(),
      bearing: $map.getBearing(),
    });
    showLabel({
      geometry: { coordinates: [lon, lat] },
      properties: comm,
    });
  }

  onDestroy(() => $map && $map.remove());

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

<div bind:this={mapContainerElement} class="map-container">
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
</div>

<style>
  @import "mapbox-gl/dist/mapbox-gl.css";
  .map-container {
    width: 100%;
    height: 100%;
  }

  :global(.alert-pill) {
    color: black;
    padding: 2px 5px;
    font-size: 0.875rem;
    line-height: 0.875rem;
    border-radius: 25px;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  }

  :global(.label-container) {
    display: flex;
    align-items: center;
    font-size: 1rem;
  }

  :global(.label-box) {
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
    margin-bottom: 30px;
    font-family: Ronzino, sans-serif;
  }

  :global(.label-line) {
    flex-shrink: 0;
  }

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
      font-size: 0.5rem;
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
