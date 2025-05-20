<script>
  import { onMount, onDestroy } from "svelte";
  import mapboxgl from "mapbox-gl";
  import { createEventDispatcher } from "svelte";

  export let communities = [];
  export let settlements = [];
  export let riskColors = {};

  mapboxgl.accessToken =
    "pk.eyJ1Ijoic2luYW5hdHJhIiwiYSI6ImNpcTloaTlocjAwNWFodm0yODJjODF5MXYifQ.urgyj3bpfbG3dX4uTOOZtQ";

  const STYLE_URL = "mapbox://styles/sinanatra/cm7yteg6x00ty01sc85aqduv2";
  const dispatch = createEventDispatcher();
  const targetZoom = 15;

  let map, mapContainer;
  let mapLoaded = false;
  let alertPillMarkers = [];
  let labelMarker = null;

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
    map = new mapboxgl.Map({
      container: mapContainer,
      style: STYLE_URL,
      center: [35.3182, 31.9613],
      zoom: 8.5,
      minZoom: 8.5,
      maxZoom: 18,
    });

    map.on("load", () => {
      mapLoaded = true;

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
              },
            })),
          ],
        },
      });

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
            0,
            4,
            100000,
            12,
          ],
          "circle-color": "rgba(0, 0, 0, 0.1)",
          "circle-stroke-color": "black",
          "circle-stroke-width": 0.5,
        },
        layout: { visibility: "none" },
      });

      map.addLayer({
        id: "communities-circle",
        type: "circle",
        source: "points",
        paint: {
          "circle-radius": 5,
          "circle-color": "#aaa",
        },
        filter: ["==", ["get", "type"], "community"],
        layout: { visibility: "none" },
      });

      ["oslo", "damage"].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "none");
        }
      });
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

  export function showSlide(id) {
    if (!map?.isStyleLoaded()) return;

    clearLabel();
    clearPills();

    ["settlements-circle", "communities-circle", "oslo", "damage"].forEach(
      (l) => map.setLayoutProperty(l, "visibility", "none")
    );

    if (id === "communities") {
      map.setLayoutProperty("communities-circle", "visibility", "visible");
      addAlertPills(communities);
    } else if (id === "settlements") {
      map.setLayoutProperty("settlements-circle", "visibility", "visible");
    } else if (id === "damage") {
      map.setLayoutProperty("damage", "visibility", "visible");
    } else if (["area-a", "area-b", "area-c"].includes(id)) {
      map.setLayoutProperty("oslo", "visibility", "visible");
      if (id === "area-a") {
        map.setFilter("oslo", ["==", ["get", "CLASS"], "A"]);
      } else if (id === "area-c") {
        map.setFilter("oslo", ["==", ["get", "CLASS"], "C"]);
      } else {
        map.setFilter("oslo", [
          "all",
          ["!=", ["get", "CLASS"], "A"],
          ["!=", ["get", "CLASS"], "C"],
        ]);
      }
    }
  }

  export function zoomToCommunity(
    comm,
    zoomLevel = targetZoom,
    duration = 500
  ) {
    const { lon, lat } = comm.coordinates || {};
    if (lon == null || lat == null) return;
    map.flyTo({ center: [lon, lat], zoom: zoomLevel, duration });
    showLabel({
      geometry: { coordinates: [lon, lat] },
      properties: comm,
    });
  }

  onDestroy(() => map && map.remove());
</script>

<div bind:this={mapContainer} class="map-container"></div>

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
  }

  :global(.label-line) {
    flex-shrink: 0;
  }
</style>
