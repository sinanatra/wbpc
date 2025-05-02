<script>
  import { onMount, onDestroy } from "svelte";
  import mapboxgl from "mapbox-gl";
  import { createEventDispatcher } from "svelte";

  export let communities = [];
  export let riskColors = {};

  mapboxgl.accessToken =
    "pk.eyJ1Ijoic2luYW5hdHJhIiwiYSI6ImNpcTloaTlocjAwNWFodm0yODJjODF5MXYifQ.urgyj3bpfbG3dX4uTOOZtQ";

  let map;
  let mapContainer;
  const dispatch = createEventDispatcher();
  let labelMarker;
  const targetZoom = 15;
  let alertPillMarkers = [];
  let riskMarkers = [];

  function showLabel(feature) {
    if (labelMarker) labelMarker.remove();
    setTimeout(() => {
      let risk;
      if (feature.properties.risks && feature.properties.risks.length > 0) {
        risk = feature.properties.risks[0].riskvalue;
      } else {
        risk = feature.properties.risk || "default";
      }
      const riskColor = riskColors[risk] || "#aaa";

      const labelEl = document.createElement("div");
      labelEl.className = "label-container";
      labelEl.style.display = "flex";
      labelEl.style.alignItems = "center";
      labelEl.innerHTML = `
        <svg class="label-line" width="50" height="50" viewBox="0 0 50 50">
          <line x1="0" y1="50" x2="50" y2="0" stroke="${riskColor}" stroke-width="2"/>
        </svg>
        <div class="label-box" style="background-color: ${riskColor}; color: black;">
          ${feature.properties.title}
        </div>
      `;
      labelMarker = new mapboxgl.Marker({
        element: labelEl,
        anchor: "bottom-left",
        offset: [0, 0],
      })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map);
    }, 0);
  }

  function addAlertPills(geojson) {
    alertPillMarkers.forEach((marker) => marker.remove());
    alertPillMarkers = [];
    if (!geojson || !geojson.features || geojson.features.length === 0) return;

    geojson.features.forEach((feature) => {
      const { lastAlertDate, lastAlertText } = feature.properties;
      if (lastAlertDate && lastAlertText && lastAlertText.trim() !== "") {
        const pillEl = document.createElement("div");
        pillEl.className = "alert-pill";
        const count = feature.properties.alertCount || 1;
        pillEl.textContent =
          count + (count === 1 ? " new alert" : " new alerts");
        const risk = feature.properties.risk || "default";
        const riskColor = riskColors[risk] || "#fff0";
        pillEl.style.backgroundColor = riskColor;

        pillEl.addEventListener("click", (e) => {
          e.stopPropagation();
          dispatch("dotClick", feature.properties);
          showLabel(feature);
          setTimeout(() => {
            map.flyTo({
              center: feature.geometry.coordinates,
              zoom: targetZoom,
              duration: 2000,
            });
          }, 50);
        });

        const marker = new mapboxgl.Marker({
          element: pillEl,
          offset: [20, 0],
        })
          .setLngLat(feature.geometry.coordinates)
          .addTo(map);
        alertPillMarkers.push(marker);
      }
    });
  }

  export function clearLabel() {
    if (labelMarker) {
      labelMarker.remove();
      labelMarker = null;
    }
  }

  function clearRiskMarkers() {
    riskMarkers.forEach((marker) => marker.remove());
    riskMarkers = [];
  }

  const baseMarkerSvg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24"
    width="24" height="24"
  >
    <!-- Outer circle -->
    <circle cx="12" cy="12" r="12" class="circle-outer" />
    <!-- Middle circle -->
    <circle cx="12" cy="12" r="8" class="circle-middle" />
    <!-- Inner circle -->
    <circle cx="12" cy="12" r="4" class="circle-inner" />
  </svg>`;

  const settlementMarkerSvg = `<svg viewBox="0 0 8 8" width="8" height="8" xmlns="http://www.w3.org/2000/svg">
    <circle  class="settlements" cx="4" cy="4" r="4" class="settlement-circle" />
  </svg>`;

  function renderRiskMarkers() {
    clearRiskMarkers();

    communities.forEach((item) => {
      if (item.coordinates && item.coordinates.lon && item.coordinates.lat) {
        let risks = [];
        if (item.risks && item.risks.length > 0) {
          risks = item.risks
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        } else {
          risks = [{ riskvalue: item.risk || "default" }];
        }

        const el = document.createElement("div");

        if (item.type === "settlement") {
          el.innerHTML = settlementMarkerSvg;
        } else {
          el.innerHTML = baseMarkerSvg;
        }
        el.className = "risk-marker";

        if (item.type === "settlement") {
          const polygonEls = el.querySelectorAll("polygon");
        } else {
          const circleEls = el.querySelectorAll("circle");
          for (let i = 0; i < Math.min(risks.length, 3); i++) {
            circleEls[i].style.fill = riskColors[risks[i].riskvalue] || "#fff0";
          }
          for (let j = risks.length; j < 3; j++) {
            circleEls[j].style.fill = "#fff0";
          }
        }

        el.style.cursor = "pointer";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          dispatch("dotClick", item);
          showLabel({
            geometry: {
              coordinates: [item.coordinates.lon, item.coordinates.lat],
            },
            properties: {
              ...item,
              risks,
            },
          });
          map.flyTo({
            center: [item.coordinates.lon, item.coordinates.lat],
            zoom: targetZoom,
            duration: 2000,
          });
        });

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([item.coordinates.lon, item.coordinates.lat])
          .addTo(map);

        riskMarkers.push(marker);
      }
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
      const validItems = communities.filter(
        (item) =>
          item.coordinates && item.coordinates.lon && item.coordinates.lat
      );

      const geojson = {
        type: "FeatureCollection",
        features: validItems.map((item, i) => {
          const id = (item.id || i).toString();
          let riskValue;
          if (item.risks && item.risks.length > 0) {
            riskValue = item.risks[item.risks.length - 1].riskvalue;
          } else {
            riskValue = item.risk || "default";
          }
          return {
            id,
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [item.coordinates.lon, item.coordinates.lat],
            },
            properties: {
              id,
              risk: riskValue,
              title: item.title,
              lastAlertDate: item.lastAlertDate || "",
              lastAlertText: item.lastAlertText || "",
              alertCount: item.alertCount,
              type: item.type || "community",
            },
          };
        }),
      };
      map.addSource("communities", { type: "geojson", data: geojson });
      renderRiskMarkers();
      addAlertPills(geojson);
    });
  });

  onDestroy(() => {
    if (map) map.remove();
  });

  export function zoomToCommunity(
    community,
    zoomLevel = targetZoom,
    duration = 500
  ) {
    if (map && community?.coordinates) {
      map.flyTo({
        center: [community.coordinates.lon, community.coordinates.lat],
        zoom: zoomLevel,
        duration,
      });

      const feature = {
        geometry: {
          coordinates: [community.coordinates.lon, community.coordinates.lat],
        },
        properties: {
          title: community.title,
          risks: community.risks,
          risk: community.risk,
        },
      };

      showLabel(feature);
    }
  }

  $: if (map && communities.length) {
    const validItems = communities.filter(
      (item) => item.coordinates && item.coordinates.lon && item.coordinates.lat
    );
    const geojson = {
      type: "FeatureCollection",
      features: validItems.map((item, i) => {
        const id = (item.id || i).toString();
        let riskValue;
        if (item.risks && item.risks.length > 0) {
          riskValue = item.risks[item.risks.length - 1].riskvalue;
        } else {
          riskValue = item.risk || "default";
        }
        return {
          id,
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [item.coordinates.lon, item.coordinates.lat],
          },
          properties: {
            id,
            risk: riskValue,
            title: item.title,
            lastAlertDate: item.lastAlertDate || "",
            lastAlertText: item.lastAlertText || "",
            alertCount: item.alertCount,
            type: item.type || "community",
          },
        };
      }),
    };
    if (map.getSource("communities")) {
      map.getSource("communities").setData(geojson);
      renderRiskMarkers();
      addAlertPills(geojson);
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

  :global(.alert-pill) {
    color: black;
    padding: 2px 5px;
    font-size: 0.875rem;
    line-height: 0.875rem;
    border-radius: 25px;
    cursor: pointer;
    box-shadow: 0 0px 8px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  }

  :global(.label-container) {
    display: flex;
    align-items: center;
    font-family: sans-serif;
    font-size: 1rem;
  }

  :global(.label-box) {
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    box-shadow: 0 0px 8px rgba(0, 0, 0, 0.3);
    margin-left: 0;
    margin-bottom: 30px;
  }

  :global(.label-line) {
    flex-shrink: 0;
  }

  :global(.risk-marker) {
    width: 12px;
    height: 12px;
    display: flex;
    justify-content: center;
    align-items: center;

    filter: drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.1));
  }

  :global(.settlements) {
    fill: #aaa;
  }
</style>
