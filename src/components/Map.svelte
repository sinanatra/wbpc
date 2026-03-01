<script>
  import { onMount, onDestroy } from "svelte";
  import mapboxgl from "mapbox-gl";
  import MapLegend from "./MapLegend.svelte";
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
  } from "$stores/mapStore.js";
  import { selectedItem, setSelectedItem } from "$stores/uiStore.js";

  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  const BASE_STYLE_URL =
    "mapbox://styles/sinanatra/cm7yteg6x00ty01sc85aqduv2";
  const STYLE_CACHE_VERSION = import.meta.env.VITE_MAP_STYLE_VERSION;
  const STYLE_URL = STYLE_CACHE_VERSION
    ? `${BASE_STYLE_URL}?v=${STYLE_CACHE_VERSION}`
    : BASE_STYLE_URL;

  let mapContainerElement;
  let isMobile = false;
  let colorSubscription = null;
  let isVisuallyReady = $state(false);
  let activeLabelType = null;

  const pointRadius = 6;
  const pointStroke = "#000";
  const communityStroke = "#222";
  const communityStrokeWidth = 1;
  const occupiedWestBankLabelMaxZoom = 8.5;
  const overlayLayersMinZoom = 10;
  const restrictedAreaLayersMinZoom = 10;
  const areaLayersMinZoom = 6;
  const overlayLayersMaxZoom = 18;
  const settlementsZoomSwitch = overlayLayersMinZoom;

  function getLatestRiskValue(item) {
    const risks = Array.isArray(item?.risks) ? item.risks : [];
    const latest = risks
      .slice()
      .sort(
        (a, b) => new Date(b.riskdate) - new Date(a.riskdate),
      )[0]?.riskvalue;
    return item?.risk ?? latest ?? "default";
  }

  function buildPointsData() {
    return {
      type: "FeatureCollection",
      features: [
        ...($communities || []).map((c) => {
          const latestRisk = getLatestRiskValue(c);
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
        ...($settlements || []).map((s) => ({
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
    };
  }

  function refreshPointsSource() {
    if (!$map || !$mapLoaded) return;
    const pointsSource = $map.getSource("points");
    if (!pointsSource || typeof pointsSource.setData !== "function") return;
    pointsSource.setData(buildPointsData());
  }

  function syncOccupiedWestBankLabelVisibility() {
    if (!occupiedWestBankLabelMarker || !$map) return;
    const shouldShow = $map.getZoom() <= occupiedWestBankLabelMaxZoom;
    occupiedWestBankLabelMarker.getElement().style.display = shouldShow
      ? ""
      : "none";
  }

  function clearPills() {
    alertPillMarkers.update((markers) => {
      markers.forEach((m) => m.remove());
      return [];
    });
  }

  function getSelectionZoom(preferredZoom = $targetZoom) {
    if (!$map) return preferredZoom;
    return Math.max($map.getZoom(), preferredZoom);
  }

  function isLayerVisible(layerId) {
    if (!$map?.getLayer(layerId)) return false;
    return $map.getLayoutProperty(layerId, "visibility") !== "none";
  }

  function syncLabelVisibility() {
    const type = $selectedItem?.type || activeLabelType;
    if (!type) return;

    const labelVisibleByType = {
      community: isLayerVisible("communities-circle"),
      settlement:
        isLayerVisible("settlements-circle") ||
        isLayerVisible("settlements-circle-fixed"),
      outpost: isLayerVisible("outposts"),
    };

    if (labelVisibleByType[type] === false) {
      clearLabel();
    }
  }

  function showLabel(feature) {
    labelMarker.update((marker) => {
      marker?.remove();
      return null;
    });

    setTimeout(() => {
      const p = feature.properties;
      activeLabelType = p.type || null;
      let color;
      if (p.type === "community") {
        const rv = getLatestRiskValue(p);
        color = $riskColors?.[rv] || "#aaa";
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
      const newMarker = new mapboxgl.Marker({
        element: el,
        anchor: "bottom-left",
      })
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
      const riskValue = item.risks?.[0]?.riskvalue;
      pill.style.backgroundColor =
        (riskValue && $riskColors?.[riskValue]) || "rgba(255,255,255,0)";
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
            zoom: getSelectionZoom($targetZoom),
            duration: 3000,
          });
        }, 50);
      });
      const marker = new mapboxgl.Marker({ element: pill, offset: [20, 0] })
        .setLngLat([item.coordinates.lon, item.coordinates.lat])
        .addTo($map);
      alertPillMarkers.update((markers) => [...markers, marker]);
    });
  }

  export function clearLabel() {
    labelMarker.update((marker) => {
      marker?.remove();
      return null;
    });
    activeLabelType = null;
  }

  let {
    initialCenter = [35.23, 31.95],
    initialZoomLevel = 8,
    initialPitch = 0,
    singleCommunity = null,
    interactionsEnabled = true,
  } = $props();

  // console.log(
  //   "Initial center:",
  //   initialCenter,
  //   "Initial zoom:",
  //   initialZoomLevel,
  // );
  // console.log(
  //   "Initial center:",
  //   initialCenter,
  //   "Initial zoom:",
  //   initialZoomLevel,
  // );

  let center = initialCenter;
  let singleCommunityMarker = null;

  function showSingleCommunity() {
    if (!$map || !$mapLoaded || !singleCommunity?.coordinates) return;

    if (singleCommunityMarker) {
      singleCommunityMarker.remove();
      singleCommunityMarker = null;
    }

    const coords = singleCommunity.coordinates;
    const riskValue = getLatestRiskValue(singleCommunity);
    const color = $riskColors?.[riskValue] || "#aaa";

    const markerEl = document.createElement("div");
    markerEl.className = "single-community-marker";
    markerEl.style.width = "12px";
    markerEl.style.height = "12px";
    markerEl.style.backgroundColor = color;
    markerEl.style.borderRadius = "50%";
    markerEl.style.cursor = "pointer";

    singleCommunityMarker = new mapboxgl.Marker({ element: markerEl })
      .setLngLat([parseFloat(coords.lon), parseFloat(coords.lat)])
      .addTo($map);

    showLabel({
      geometry: {
        coordinates: [parseFloat(coords.lon), parseFloat(coords.lat)],
      },
      properties: {
        ...singleCommunity,
        title: singleCommunity.title,
        type: "community",
        risk: riskValue,
      },
    });
  }

  $effect(() => {
    if ($mapLoaded && $riskColors && Object.keys($riskColors).length > 0) {
      showSingleCommunity();
    }
  });
  const minZoomLevel = 8;
  const initialZoom = initialZoomLevel;

  const maxBounds = [
    [33.5, 30.8],
    [36.5, 33.2],
  ];

  let mapInstance;
  let pendingSlideRequest = null;
  let occupiedWestBankLabelMarker = null;

  onMount(() => {
    if (!mapContainerElement) return;

    mapLoaded.set(false);
    mapInstance?.remove();
    isVisuallyReady = false;

    mapInstance = new mapboxgl.Map({
      container: mapContainerElement,
      style: STYLE_URL,
      center: center,
      zoom: initialZoom,
      minZoom: minZoomLevel,
      maxZoom: 18,
      maxBounds,

      pitch: initialPitch,
      bearing: 0,
      scrollZoom: false,
      dragPan: true,
    });

    map.set(mapInstance);
    mapContainer.set(mapContainerElement);

    mapInstance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    mapInstance.on("zoom", () => {
      toggleZoomLayers();
      syncOccupiedWestBankLabelVisibility();
    });

    mapInstance.on("load", () => {
      mapLoaded.set(true);
      let hasMarkedReady = false;
      const markReady = () => {
        if (hasMarkedReady) return;
        hasMarkedReady = true;
        isVisuallyReady = true;
      };
      mapInstance.once("render", markReady);
      mapInstance.once("idle", markReady);

      requestAnimationFrame(() => {
        mapInstance.resize();
        mapInstance.jumpTo({
          center,
          zoom: initialZoom,
          pitch: initialPitch,
          bearing: 0,
        });
      });

      occupiedWestBankLabelMarker = addStaticLabel(
        "Occupied West Bank",
        isMobile
          ? [34.96829552848957, 31.82178927355715]
          : [35.4558374411592, 32.404],
        "#ccc",
      );
      syncOccupiedWestBankLabelVisibility();

      mapInstance.addSource("points", {
        type: "geojson",
        data: buildPointsData(),
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
        if (!interactionsEnabled) return;
        if (!e.features?.length) return;
        const feat = e.features[0];
        setSelectedItem(feat.properties);
        showLabel(feat);
        mapInstance.flyTo({
          center: feat.geometry.coordinates,
          zoom: getSelectionZoom($targetZoom),
          duration: 1500,
        });
      });
      mapInstance.on("mouseenter", "communities-circle", () => {
        if (!interactionsEnabled) return;
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
        maxzoom: settlementsZoomSwitch,
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
        minzoom: settlementsZoomSwitch,
        paint: {
          "circle-radius": pointRadius,
          "circle-color": "rgba(0, 0, 0, .2)",
          "circle-stroke-color": pointStroke,
          "circle-stroke-width": 1,
        },
      });

      mapInstance.addLayer({
        id: "communities-circle",
        type: "circle",
        source: "points",
        paint: {
          "circle-radius": pointRadius,
          "circle-color": "#aaa",
          "circle-stroke-color": communityStroke,
          "circle-stroke-width": communityStrokeWidth,
        },
        filter: ["==", ["get", "type"], "community"],
        layout: { visibility: "none" },
      });

      colorSubscription = riskColors.subscribe((colors) => {
        if (
          Object.keys(colors).length > 0 &&
          mapInstance.getLayer("communities-circle")
        ) {
          requestAnimationFrame(() => {
            try {
              const colorExpr = [
                "match",
                ["get", "risk"],
                ...Object.entries(colors).flatMap(([rv, col]) => [rv, col]),
                "#aaa",
              ];
              if (mapInstance.getLayer("communities-circle")) {
                mapInstance.setPaintProperty(
                  "communities-circle",
                  "circle-color",
                  colorExpr,
                );
              }
            } catch (e) {
              console.error("Error setting color:", e);
            }
          });
        }
      });

      mapInstance.on("click", "settlements-circle-fixed", (e) => {
        if (!interactionsEnabled) return;
        if (!e.features?.length) return;
        const feat = e.features[0];
        setSelectedItem(feat.properties);
        showLabel(feat);
        mapInstance.flyTo({
          center: feat.geometry.coordinates,
          zoom: getSelectionZoom($targetZoom),
          duration: 1500,
        });
      });
      mapInstance.on("mouseenter", "settlements-circle-fixed", () => {
        if (!interactionsEnabled) return;
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "settlements-circle-fixed", () => {
        mapInstance.getCanvas().style.cursor = "";
      });

      mapInstance.on("click", "outposts", (e) => {
        if (!interactionsEnabled) return;
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
          zoom: getSelectionZoom($targetZoom),
          duration: 1500,
        });
      });

      mapInstance.on("mouseenter", "outposts", () => {
        if (!interactionsEnabled) return;
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "outposts", () => {
        mapInstance.getCanvas().style.cursor = "";
      });

      if (mapInstance.getLayer("outposts")) {
        mapInstance.setPaintProperty("outposts", "circle-color", "#fff");
        mapInstance.setPaintProperty(
          "outposts",
          "circle-stroke-color",
          pointStroke,
        );
        mapInstance.setPaintProperty("outposts", "circle-stroke-width", 1.5);
        mapInstance.setPaintProperty("outposts", "circle-radius", pointRadius);
      }

      if (mapInstance.getLayer("demolition-orders")) {
        mapInstance.setLayoutProperty(
          "demolition-orders",
          "visibility",
          "none",
        );
      }

      if (mapInstance.getLayer("jordanian-state-land")) {
        mapInstance.setPaintProperty(
          "jordanian-state-land",
          "fill-opacity",
          0.9,
        );
      }

      if (mapInstance.getLayer("settlement-jurisdiction-areas")) {
        mapInstance.setPaintProperty(
          "settlement-jurisdiction-areas",
          "fill-opacity",
          0.9,
        );
      }

      if (mapInstance.getLayer("closed-military-zones")) {
        mapInstance.setPaintProperty(
          "closed-military-zones",
          "fill-opacity",
          0.9,
        );
        mapInstance.setPaintProperty(
          "closed-military-zones",
          "fill-outline-color",
          "#000",
        );
      }

      [
        "outposts",
        "settlement-jurisdiction-areas",
        "jordanian-state-land",
        "closed-military-zones",
        "area-a",
        "area-b",
        "area-c",
        "demolition-orders",
      ].forEach((layerId) => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.setLayerZoomRange(
            layerId,
            overlayLayersMinZoom,
            overlayLayersMaxZoom,
          );
        }
      });

      [
        "settlement-jurisdiction-areas",
        "jordanian-state-land",
        "closed-military-zones",
      ].forEach((layerId) => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.setLayerZoomRange(
            layerId,
            restrictedAreaLayersMinZoom,
            overlayLayersMaxZoom,
          );
        }
      });

      ["area-a", "area-b", "area-c"].forEach((layerId) => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.setLayerZoomRange(
            layerId,
            areaLayersMinZoom,
            overlayLayersMaxZoom,
          );
        }
      });

      [
        "oslo",
        "closed-military-zones",
        "demolition-orders",
        "area-a",
        "area-b",
        "area-c",
      ].forEach((layerId) => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.setLayoutProperty(layerId, "visibility", "none");
        }
      });

      toggleZoomLayers();

      if (pendingSlideRequest) {
        const { id, options } = pendingSlideRequest;
        pendingSlideRequest = null;
        showSlide(id, { ...options, animate: false, duration: 0 });
      }
    });
  });

  // $effect(() => {
  //   if (!$mapLoaded) return;
  //   setMapInteractions(interactionsEnabled);
  // });

  $effect(() => {
    if (!$mapLoaded || !$map) return;
    $layersToggles;
    $activeSlide;
    $selectedItem;
    syncLabelVisibility();
  });

  $effect(() => {
    if (!$mapLoaded || !$map) return;
    $communities;
    $settlements;
    $activeSlide;
    refreshPointsSource();
    if ($activeSlide === "communities") {
      addAlertPills($communities);
    }
  });

  export function resize() {
    if ($map) $map.resize();
  }

  export function showSlide(id) {
    const options =
      arguments.length > 1 && arguments[1] != null ? arguments[1] : {};

    if (!$map) {
      pendingSlideRequest = { id, options };
      return;
    }
    if (!$map.isStyleLoaded()) {
      pendingSlideRequest = { id, options };
      return;
    }
    $map.resize();

    activeSlide.set(id);

    const defaultZoom = 6;

    const communitiesZoom = 8.5;

    let zoom = defaultZoom;

    if (id === "communities") {
      zoom = communitiesZoom;
    } else if (id === "settlements") {
      zoom = 8;
    }

    const animate = options?.animate ?? true;
    const duration = options?.duration ?? 1000;
    const view = {
      center: center,
      zoom: zoom,
      pitch: $map.getPitch(),
      bearing: $map.getBearing(),
    };

    if (animate && duration > 0) {
      $map.flyTo({ ...view, duration });
    } else {
      $map.jumpTo(view);
    }

    clearLabel();
    clearPills();

    [
      "settlements-circle",
      "settlements-circle-fixed",
      "communities-circle",
      "oslo",
      "closed-military-zones",
      "demolition-orders",
      "area-a",
      "area-b",
      "area-c",
    ].forEach((l) => {
      if ($map?.getLayer(l)) {
        $map.setLayoutProperty(l, "visibility", "none");
      }
    });

    if (id === "communities") {
      if (interactionsEnabled) {
        $map.scrollZoom.enable();
      }
      $map.setLayoutProperty("communities-circle", "visibility", "visible");
      addAlertPills($communities);
    } else if (id === "settlements") {
      $map.setLayoutProperty("settlements-circle", "visibility", "visible");
    } else if (id === "closed-military-zones") {
      if ($map?.getLayer("area-c")) {
        $map.setLayoutProperty("area-c", "visibility", "visible");
      }
      if ($map?.getLayer("closed-military-zones")) {
        $map.setLayoutProperty(
          "closed-military-zones",
          "visibility",
          "visible",
        );
      }
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
    const shouldShow = zoom >= overlayLayersMinZoom;
    const shouldShowRestrictedAreaLayers = zoom >= restrictedAreaLayersMinZoom;
    showSettlementsLegend.set(shouldShow);

    const allowLayerDisplay =
      $activeSlide === "communities" ||
      $activeSlide === "settlements" ||
      $activeSlide === "closed-military-zones";
    showCommunitiesLayers.set(shouldShow && allowLayerDisplay);

    ["outposts"].forEach((id) => {
      $map.setLayoutProperty(
        id,
        "visibility",
        shouldShow && $layersToggles[id] && allowLayerDisplay
          ? "visible"
          : "none",
      );
    });

    [
      "settlement-jurisdiction-areas",
      "jordanian-state-land",
      "closed-military-zones",
    ].forEach((id) => {
      if ($map.getLayer(id)) {
        $map.setLayoutProperty(
          id,
          "visibility",
          shouldShowRestrictedAreaLayers && $layersToggles[id] && allowLayerDisplay
            ? "visible"
            : "none",
        );
      }
    });

    ["settlements-circle", "settlements-circle-fixed"].forEach((id) => {
      $map.setLayoutProperty(
        id,
        "visibility",
        (shouldShow || $activeSlide === "settlements") &&
          $layersToggles["settlements-circle"] &&
          allowLayerDisplay
          ? "visible"
          : "none",
      );
    });

    if ($map.getLayer("demolition-orders")) {
      $map.setLayoutProperty("demolition-orders", "visibility", "none");
    }

    syncLabelVisibility();

  }

  export function zoomToCommunity(comm, zoomLevel = 12, duration = 1000) {
    const { lon, lat } = comm.coordinates || {};
    if (lon == null || lat == null) return;
    $map.flyTo({
      center: [lon, lat],
      zoom: getSelectionZoom(zoomLevel),
      duration,

      pitch: $map.getPitch(),
      bearing: $map.getBearing(),
    });
    showLabel({
      geometry: { coordinates: [lon, lat] },
      properties: comm,
    });
  }

  onDestroy(() => {
    if (colorSubscription) colorSubscription();
    occupiedWestBankLabelMarker?.remove();
    occupiedWestBankLabelMarker = null;
    mapInstance?.remove();
    map.set(null);
    mapLoaded.set(false);
  });
</script>

<div
  bind:this={mapContainerElement}
  class="map-container"
  class:ready={isVisuallyReady}
  class:locked={!interactionsEnabled}
>
  <MapLegend />
  {#if !isVisuallyReady}
    <div class="map-loader" aria-live="polite">
      <div class="map-loader__spinner" />
    </div>
  {/if}
</div>

<style>
  @import "mapbox-gl/dist/mapbox-gl.css";
  .map-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: #101316;
  }

  .map-container.ready {
    background: transparent;
  }

  .map-container.locked {
    pointer-events: none;
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

  .map-loader {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    gap: 10px;
    background: linear-gradient(160deg, rgba(16, 19, 22, 0.92), rgba(22, 28, 35, 0.92));
    color: #e8e8e8;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    z-index: 1;
  }

  .map-loader__spinner {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid rgba(232, 232, 232, 0.3);
    border-top-color: #e8e8e8;
    animation: map-spin 1s linear infinite;
  }

  @keyframes map-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
