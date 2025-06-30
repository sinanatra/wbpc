<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import mapboxgl from "mapbox-gl";

  export let communities = [];
  export let settlements = [];
  export let riskColors = {};

  mapboxgl.accessToken =
    "pk.eyJ1Ijoic2luYW5hdHJhIiwiYSI6ImNpcTloaTlocjAwNWFodm0yODJjODF5MXYifQ.urgyj3bpfbG3dX4uTOOZtQ";

  const STYLE_URL = "mapbox://styles/sinanatra/cm7yteg6x00ty01sc85aqduv2";
  const dispatch = createEventDispatcher();
  let targetZoom = 15;

  let map, mapContainer;
  let mapLoaded = false;
  let alertPillMarkers = [];
  let labelMarker = null;
  let showSettlementsLegend = false;
  let showCommunitiesLayers = false;

  let layersToggles = {
    "settlements-circle": true,
    outposts: true,
    "settlement-jurisdiction-areas": true,
    "demolition-orders": false,
    "jordanian-state-land": false,
    "closed-military-zones": true,
  };

  function clearPills() {
    alertPillMarkers.forEach((m) => m.remove());
    alertPillMarkers = [];
  }

  function showLabel(feature) {
    labelMarker?.remove();
    setTimeout(() => {
      const p = feature.properties;
      const rv = p.risks?.[0]?.riskvalue ?? p.risk ?? "default";
      const color = riskColors[rv] || "#aaa";
      const el = document.createElement("div");
      el.className = "label-container";
      el.innerHTML = `
        <svg class="label-line" width="50" height="50" viewBox="0 0 50 50">
          <line x1="0" y1="50" x2="50" y2="0" stroke="${color}" stroke-width="2"/>
        </svg>
        <div class="label-box" style="background:${color};color:black">
          ${p.title}
        </div>`;
      labelMarker = new mapboxgl.Marker({ element: el, anchor: "bottom-left" })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map);
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
        riskColors[item.risks[0].riskvalue] || "rgba(255,255,255,0)";
      pill.addEventListener("click", (e) => {
        e.stopPropagation();
        dispatch("dotClick", item);
        showLabel({
          geometry: {
            coordinates: [item.coordinates.lon, item.coordinates.lat],
          },
          properties: item,
        });
        setTimeout(() => {
          map.flyTo({
            center: [item.coordinates.lon, item.coordinates.lat],
            zoom: targetZoom,
            duration: 2000,
          });
        }, 50);
      });
      const marker = new mapboxgl.Marker({ element: pill, offset: [20, 0] })
        .setLngLat([item.coordinates.lon, item.coordinates.lat])
        .addTo(map);
      alertPillMarkers.push(marker);
    });
  }

  export function clearLabel() {
    labelMarker?.remove();
    labelMarker = null;
  }

  onMount(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    const initialPitch = isMobile ? 50 : 0;
    const initialZoom = isMobile ? 8 : 8;

    map = new mapboxgl.Map({
      container: mapContainer,
      style: STYLE_URL,
      center: [35.3182, 31.8613],
      zoom: initialZoom,
      minZoom: initialZoom,
      maxZoom: 18,
      pitch: initialPitch,
      bearing: 0,
      scrollZoom: false,
      dragPan: isMobile ? false : true,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    map.on("zoom", () => {
      toggleZoomLayers();
    });

    map.on("load", () => {
      mapLoaded = true;

      addStaticLabel("Occupied West Bank", [35.4558374411592, 32.404], "#ccc");
      addStaticLabel(
        "Gaza Strip",
        [34.55717960887084, 31.53758461986557],
        "#ccc"
      );

      map.addSource("points", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            ...communities.map((c) => {
              const latestRisk =
                (c.risks || [])
                  .slice()
                  .sort(
                    (a, b) => new Date(b.riskdate) - new Date(a.riskdate)
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
            ...settlements.map((s) => ({
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
          .addTo(map);
      }

      map.on("click", "communities-circle", (e) => {
        if (!e.features?.length) return;
        const feat = e.features[0];
        dispatch("dotClick", feat.properties);
        showLabel(feat);
        map.flyTo({
          center: feat.geometry.coordinates,
          zoom: targetZoom,
          duration: 1000,
        });
      });
      map.on("mouseenter", "communities-circle", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "communities-circle", () => {
        map.getCanvas().style.cursor = "";
      });

      map.addLayer({
        id: "settlements-circle",
        type: "circle",
        source: "points",
        filter: ["==", ["get", "type"], "settlement"],
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

      map.addLayer({
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

      if (map.getLayer("outposts")) {
        map.setPaintProperty("outposts", "circle-stroke-color", "#000");
        map.setPaintProperty("outposts", "circle-stroke-width", 2);
      }

      if (map.getLayer("demolition-orders")) {
        map.setPaintProperty("demolition-orders", "fill-opacity", 0.1);
        map.setPaintProperty("demolition-orders", "circle-radius", 4);
      }

      if (map.getLayer("jordanian-state-land")) {
        map.setPaintProperty("jordanian-state-land", "fill-opacity", 0.1);
      }

      if (map.getLayer("settlement-jurisdiction-areas")) {
        map.setPaintProperty(
          "settlement-jurisdiction-areas",
          "fill-opacity",
          0.1
        );
      }

      if (map.getLayer("closed-military-zones")) {
        map.setPaintProperty("closed-military-zones", "fill-opacity", 0.1);
        map.setPaintProperty(
          "closed-military-zones",
          "fill-outline-color",
          "#000"
        );
      }

      ["oslo", "closed-military-zones", "area-a", "area-b", "area-c"].forEach(
        (layerId) => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, "visibility", "none");
          }
        }
      );
    });
  });

  $: if (map && mapLoaded && riskColors && Object.keys(riskColors).length) {
    const colorExpr = [
      "match",
      ["get", "risk"],
      ...Object.entries(riskColors).flatMap(([rv, col]) => [rv, col]),
      "#aaa",
    ];
    if (map.getLayer("communities-circle")) {
      map.setPaintProperty("communities-circle", "circle-color", colorExpr);
    }
  }

  export function resize() {
    if (map) map.resize();
  }

  export function showSlide(id) {
    if (!map?.isStyleLoaded()) return;
    map.resize();

    map.flyTo({
      center: [35.3182, 31.9613],
      zoom: 8.5,
      duration: 500,

      pitch: map.getPitch(),
      bearing: map.getBearing(),
    });

    // if (id === "damage") {
    //   map.flyTo({
    //     center: [35.22, 31.85],
    //     zoom: 11,
    //     duration: 700,
    //     pitch: 0,
    //     bearing: 0,
    //   });
    // }

    clearLabel();
    clearPills();

    [
      "settlements-circle",
      "communities-circle",
      "oslo",
      "closed-military-zones",
      "area-a",
      "area-b",
      "area-c",
    ].forEach((l) => map.setLayoutProperty(l, "visibility", "none"));

    if (id === "communities") {
      map.scrollZoom.enable();
      map.setLayoutProperty("communities-circle", "visibility", "visible");
      addAlertPills(communities);
    } else if (id === "settlements") {
      map.setLayoutProperty("settlements-circle", "visibility", "visible");
    } else if (id === "closed-military-zones") {
      map.setLayoutProperty("area-c", "visibility", "visible");
      map.setLayoutProperty("closed-military-zones", "visibility", "visible");
    } else if (id === "area-a") {
      map.setLayoutProperty("area-a", "visibility", "visible");
    } else if (id === "area-b") {
      map.setLayoutProperty("area-a", "visibility", "visible");
      map.setLayoutProperty("area-b", "visibility", "visible");
    } else if (id === "area-c") {
      map.setLayoutProperty("area-c", "visibility", "visible");
    }
  }

  function toggleZoomLayers() {
    const zoom = map.getZoom();
    const shouldShow = zoom >= 11;
    showSettlementsLegend = shouldShow;
    showCommunitiesLayers = shouldShow;

    // if (shouldShow) {
    //   map.setLayoutProperty("settlements-circle", "visibility", "visible");
    // } else {
    //   map.setLayoutProperty("settlements-circle", "visibility", "none");
    // }

    [
      "settlements-circle",
      "outposts",
      "settlement-jurisdiction-areas",
      "demolition-orders",
      "jordanian-state-land",
      "closed-military-zones",
    ].forEach((id) => {
      map.setLayoutProperty(
        id,
        "visibility",
        shouldShow && layersToggles[id] ? "visible" : "none"
      );
    });
  }

  export function zoomToCommunity(
    comm,
    zoomLevel = targetZoom,
    duration = 1000
  ) {
    const { lon, lat } = comm.coordinates || {};
    if (lon == null || lat == null) return;
    map.flyTo({
      center: [lon, lat],
      zoom: zoomLevel,
      duration,

      pitch: map.getPitch(),
      bearing: map.getBearing(),
    });
    showLabel({
      geometry: { coordinates: [lon, lat] },
      properties: comm,
    });
  }

  onDestroy(() => map && map.remove());

  function toggleLayer(layerId) {
    layersToggles[layerId] = !layersToggles[layerId];
    if (map && map.getLayer(layerId)) {
      map.setLayoutProperty(
        layerId,
        "visibility",
        showCommunitiesLayers && layersToggles[layerId] ? "visible" : "none"
      );
    }
  }
</script>

<div bind:this={mapContainer} class="map-container">
  {#if showCommunitiesLayers}
    <div class="map-legend">
      <div
        class="legend-item"
        on:click={() => toggleLayer("settlements-circle")}
      >
        <span
          class="legend-swatch"
          style="background: rgba(255, 255, 255, .2);border-radius:100%; border: 1.5px solid black; opacity:{layersToggles[
            'settlements-circle'
          ]
            ? 1
            : 0.4};"
        ></span>
        <span class:legend-off={!layersToggles["settlements-circle"]}
          >Settlements</span
        >
      </div>
      <div class="legend-item" on:click={() => toggleLayer("outposts")}>
        <span
          class="legend-swatch"
          style="background:#707070; border-radius:100%; border:1.5px solid #000; opacity:{layersToggles[
            'outposts'
          ]
            ? 1
            : 0.4};"
        ></span>
        <span class:legend-off={!layersToggles["outposts"]}>Outposts</span>
      </div>
      <div
        class="legend-item"
        on:click={() => toggleLayer("demolition-orders")}
      >
        <span
          class="legend-swatch"
          style="background:#000000; border-radius:100%; border:1.5px solid #000000; opacity:{layersToggles[
            'demolition-orders'
          ]
            ? 1
            : 0.4};"
        ></span>
        <span class:legend-off={!layersToggles["demolition-orders"]}
          >Demolition Orders</span
        >
      </div>
      <div
        class="legend-item"
        on:click={() => toggleLayer("settlement-jurisdiction-areas")}
      >
        <span
          class="legend-swatch"
          style="background:#c4c2bb; border:1.5px solid #c4c2bb; opacity:{layersToggles[
            'settlement-jurisdiction-areas'
          ]
            ? 1
            : 0.4};"
        ></span>
        <span class:legend-off={!layersToggles["settlement-jurisdiction-areas"]}
          >Settlement Jurisdiction Areas</span
        >
      </div>

      <div
        class="legend-item"
        on:click={() => toggleLayer("jordanian-state-land")}
      >
        <span
          class="legend-swatch"
          style="background:#b5b5b5; border:1.5px solid #b5b5b5; opacity:{layersToggles[
            'jordanian-state-land'
          ]
            ? 1
            : 0.4};"
        ></span>
        <span class:legend-off={!layersToggles["jordanian-state-land"]}
          >Jordanian State Land</span
        >
      </div>
      <div
        class="legend-item"
        on:click={() => toggleLayer("closed-military-zones")}
      >
        <span
          class="legend-swatch"
          style="background:#464544; border:1.5px solid #464544; opacity:{layersToggles[
            'closed-military-zones'
          ]
            ? 1
            : 0.4};"
        ></span>
        <span class:legend-off={!layersToggles["closed-military-zones"]}
          >Closed Military Zones</span
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
    bottom: 10px;
    left: 10px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.97);
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
  .legend-off {
    opacity: 0.5;
    text-decoration: line-through;
  }
</style>
