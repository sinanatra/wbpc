<!-- src/components/Map.svelte -->
<script>
  import { onMount, onDestroy } from "svelte";
  import mapboxgl from "mapbox-gl";
  import { createEventDispatcher } from "svelte";

  export let communities = [];
  export let riskColors = {};
  mapboxgl.accessToken =
    "pk.eyJ1Ijoic2luYW5hdHJhIiwiYSI6ImNpcTloaTlocjAwNWFodm0yODJjODF5MXYifQ.urgyj3bpfbG3dX4uTOOZtQ";

  let map, mapContainer;
  const dispatch = createEventDispatcher();
  let labelMarker;
  let alertPillMarkers = [];
  let riskMarkers = [];
  const targetZoom = 14;

  function showLabel(feature) {
    labelMarker?.remove();
    setTimeout(() => {
      const riskVal =
        feature.properties.risks?.[0]?.riskvalue ||
        feature.properties.risk ||
        "default";
      const color = riskColors[riskVal] || "#aaa";

      const el = document.createElement("div");
      el.className = "label-container";
      el.innerHTML = `
        <svg width="50" height="50"><line x1="0" y1="50" x2="50" y2="0" stroke="${color}" stroke-width="2"/></svg>
        <div class="label-box" style="background:${color};">
          ${feature.properties.title}
        </div>`;

      labelMarker = new mapboxgl.Marker({ element: el, anchor: "bottom-left" })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map);
    }, 0);
  }

  function addAlertPills(geojson) {
    alertPillMarkers.forEach((m) => m.remove());
    alertPillMarkers = [];
    geojson.features.forEach((f) => {
      const { lastAlertDate, lastAlertText, alertCount = 1 } = f.properties;
      if (lastAlertDate && lastAlertText.trim()) {
        const pill = document.createElement("div");
        pill.className = "alert-pill";
        pill.textContent = `${alertCount} new alert${alertCount > 1 ? "s" : ""}`;
        pill.style.backgroundColor =
          riskColors[f.properties.risk] || "transparent";

        pill.addEventListener("click", (e) => {
          e.stopPropagation();
          dispatch("dotClick", f.properties);
          showLabel(f);
          map.flyTo({
            center: f.geometry.coordinates,
            zoom: targetZoom,
            duration: 2000,
          });
        });

        const mk = new mapboxgl.Marker({ element: pill, offset: [20, 0] })
          .setLngLat(f.geometry.coordinates)
          .addTo(map);
        alertPillMarkers.push(mk);
      }
    });
  }

  function clearRiskMarkers() {
    riskMarkers.forEach((m) => m.remove());
    riskMarkers = [];
  }

  const baseMarkerSvg = `<svg viewBox="0 0 24 24" width="12" height="12" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" class="circle-outer"/>
    <circle cx="12" cy="12" r="8" class="circle-middle"/>
    <circle cx="12" cy="12" r="4" class="circle-inner"/>
  </svg>`;

  const settlementMarkerSvg = `<svg viewBox="0 0 8 8" width="8" height="8" xmlns="http://www.w3.org/2000/svg">
    <circle cx="4" cy="4" r="4" class="settlement-circle" />
  </svg>`;

  function renderRiskMarkers() {
    clearRiskMarkers();
    communities.forEach((item) => {
      const lon = item.coordinates?.lon;
      const lat = item.coordinates?.lat;
      if (lon == null || lat == null) return;

      const risks = item.risks?.length
        ? item.risks.slice().sort((a, b) => new Date(b.date) - new Date(a.date))
        : [{ riskvalue: item.risk || "default" }];
      const color = riskColors[risks[0].riskvalue] || "#aaa";

      const el = document.createElement("div");
      el.className = "risk-marker";
      el.innerHTML =
        item.type === "settlement" ? settlementMarkerSvg : baseMarkerSvg;

      if (item.type === "settlement") {
        el.querySelector(".settlement-circle").setAttribute("fill", color);
      } else {
        Array.from(el.querySelectorAll("circle")).forEach((c, i) => {
          c.setAttribute(
            "fill",
            risks[i]?.riskvalue ? riskColors[risks[i].riskvalue] : "transparent"
          );
        });
      }

      el.style.cursor = "pointer";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        dispatch("dotClick", item);
        showLabel({
          geometry: { coordinates: [lon, lat] },
          properties: { ...item, risks },
        });
        map.flyTo({ center: [lon, lat], zoom: targetZoom, duration: 2000 });
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([lon, lat])
        .addTo(map);
      riskMarkers.push(marker);
    });
  }

  onMount(() => {
    map = new mapboxgl.Map({
      container: mapContainer,
      style: "mapbox://styles/sinanatra/cm7yteg6x00ty01sc85aqduv2",
      center: [35.31820317122984, 31.961345483167264],
      zoom: 8.5,
      minZoom: 8.5,
      maxZoom: 18,
      maxBounds: [
        [32.45395548496137, 30.509751808262436],
        [36.9947960976464, 33.48706528683205],
      ],
    });

    map.on("load", () => {
      const update = () => {
        const feats = communities
          .filter((c) => c.coordinates?.lon != null)
          .map((item, i) => ({
            id: (item.id || i).toString(),
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [item.coordinates.lon, item.coordinates.lat],
            },
            properties: {
              id: (item.id || i).toString(),
              risk: item.risk || "default",
              title: item.title,
              lastAlertDate: item.lastAlertDate || "",
              lastAlertText: item.lastAlertText || "",
              alertCount: item.alertCount,
              type: item.type,
            },
          }));
        const geojson = { type: "FeatureCollection", features: feats };
        if (!map.getSource("communities")) {
          map.addSource("communities", { type: "geojson", data: geojson });
        } else {
          map.getSource("communities").setData(geojson);
        }
        renderRiskMarkers();
        addAlertPills(geojson);
      };
      update();
    });
  });

  onDestroy(() => map?.remove());

  export function zoomToCommunity(c, z = targetZoom, d = 500) {
    if (!map || !c.coordinates) return;
    map.flyTo({
      center: [c.coordinates.lon, c.coordinates.lat],
      zoom: z,
      duration: d,
    });
    showLabel({
      geometry: { coordinates: [c.coordinates.lon, c.coordinates.lat] },
      properties: { title: c.title, risks: c.risks, risk: c.risk },
    });
  }

  $: if (map && communities) {
    const src = map.getSource("communities");
    if (src) {
      src.setData({
        type: "FeatureCollection",
        features: communities
          .filter((c) => c.coordinates?.lon != null)
          .map((item, i) => ({
            id: (item.id || i).toString(),
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [item.coordinates.lon, item.coordinates.lat],
            },
            properties: {
              id: (item.id || i).toString(),
              risk: item.risk || "default",
              title: item.title,
              lastAlertDate: item.lastAlertDate || "",
              lastAlertText: item.lastAlertText || "",
              alertCount: item.alertCount,
              type: item.type,
            },
          })),
      });
      renderRiskMarkers();
      addAlertPills(map.getSource("communities")._data);
    }
  }
</script>

<div bind:this={mapContainer} class="map-container"></div>

<style>
  @import "mapbox-gl/dist/mapbox-gl.css";
  .map-container {
    width: 100%;
    height: 100%;
  }

  :global(.risk-marker) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
  }
  :global(.circle-outer) {
    stroke: #fff;
    stroke-width: 1;
  }
  :global(.alert-pill) {
    color: black;
    padding: 2px 5px;
    font-size: 0.875rem;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  }
  :global(.label-container) {
    display: flex;
    align-items: center;
    font-family: sans-serif;
  }
  :global(.label-box) {
    margin-left: 0;
    margin-bottom: 30px;
    padding: 4px 8px;
    border-radius: 4px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  }
</style>
