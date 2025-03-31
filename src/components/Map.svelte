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
  const targetZoom = 12;
  let alertPillMarkers = [];
  let riskMarkers = [];

  function showLabel(feature) {
    if (labelMarker) labelMarker.remove();
    setTimeout(() => {
      let risk;

      if (feature.properties.risks && feature.properties.risks.length > 0) {
        risk =
          feature.properties.risks[feature.properties.risks.length - 1]
            .riskvalue;
      } else {
        risk = feature.properties.risk || "default";
      }

      const riskColor = riskColors[risk] || "#fff";

      // console.log(feature.properties);

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
        const riskColor = riskColors[risk] || "#fff";
        pillEl.style.backgroundColor = riskColor;
        pillEl.addEventListener("click", (e) => {
          e.stopPropagation();
          dispatch("dotClick", feature.properties);
          showLabel(feature);
          setTimeout(() => {
            map.zoomTo(targetZoom, { center: feature.geometry.coordinates });
          }, 100);
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

  const marker1Svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48.93 48.93">
    <g>
      <path class="cls-1" d="M24.46,20c2.46,0,4.46,2,4.46,4.46s-2,4.46-4.46,4.46-4.46-2-4.46-4.46,2-4.46,4.46-4.46M24.46,0C10.95,0,0,10.95,0,24.46s10.95,24.46,24.46,24.46,24.46-10.95,24.46-24.46S37.97,0,24.46,0"/>
    </g>
  </svg>`;

  const marker2Svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48.93 48.93">
    <g>
      <path class="cls-1" d="M24.46,10c7.97,0,14.46,6.49,14.46,14.46s-6.49,14.46-14.46,14.46-14.46-6.49-14.46-14.46,6.49-14.46,14.46-14.46M24.46,0C10.95,0,0,10.95,0,24.46s10.95,24.46,24.46,24.46,24.46-10.95,24.46-24.46S37.97,0,24.46,0"/>
    </g>
  </svg>`;

  const marker3Svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48.93 48.93">
    <g>
      <path class="cls-1" d="M24.46,5c10.73,0,19.46,8.73,19.46,19.46s-8.73,19.46-19.46,19.46S5,35.19,5,24.46,13.73,5,24.46,5M24.46,0C10.95,0,0,10.95,0,24.46s10.95,24.46,24.46,24.46,24.46-10.95,24.46-24.46S37.97,0,24.46,0"/>
    </g>
  </svg>`;

  function renderRiskMarkers() {
    clearRiskMarkers();
    communities.forEach((community) => {
      if (
        community.coordinates &&
        community.coordinates.lon &&
        community.coordinates.lat
      ) {
        let risks = [];
        if (community.risks && community.risks.length > 0) {
          risks = community.risks;
        }
        if (!risks.length) {
          risks = [{ riskvalue: community.risk || "default" }];
        }
        risks = risks.reverse();
        risks.forEach((risk, index) => {
          let markerSvg;
          if (index === 0) markerSvg = marker1Svg;
          else if (index === 1) markerSvg = marker2Svg;
          else if (index === 2) markerSvg = marker3Svg;

          const color = riskColors[risk.riskvalue] || "#fff";
          const el = document.createElement("div");
          el.innerHTML = markerSvg;
          el.className = "risk-marker";
          const pathEl = el.querySelector("path.cls-1");
          if (pathEl) {
            pathEl.style.fill = color;
          }
          if (index === 0) {
            el.style.cursor = "pointer";
            el.addEventListener("click", (e) => {
              e.stopPropagation();
              dispatch("dotClick", community);
              showLabel({
                geometry: {
                  coordinates: [
                    community.coordinates.lon,
                    community.coordinates.lat,
                  ],
                },
                properties: community,
              });
              map.zoomTo(targetZoom, {
                center: [community.coordinates.lon, community.coordinates.lat],
              });
            });
          } else {
            el.style.pointerEvents = "none";
          }
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: "center",
          })
            .setLngLat([community.coordinates.lon, community.coordinates.lat])
            .addTo(map);
          riskMarkers.push(marker);
        });
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
      maxZoom: 15,
      maxBounds: [
        [32.45395548496137, 30.509751808262436],
        [36.9947960976464, 33.48706528683205],
      ],
    });
    map.on("load", () => {
      const validCommunities = communities.filter(
        (community) =>
          community.coordinates &&
          community.coordinates.lon &&
          community.coordinates.lat
      );
      const geojson = {
        type: "FeatureCollection",
        features: validCommunities.map((community, i) => {
          const id = (community.id || i).toString();
          let riskValue;
          if (community.risks && community.risks.length > 0) {
            riskValue = community.risks[community.risks.length - 1].riskvalue;
          } else {
            riskValue = community.risk || "default";
          }
          return {
            id,
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [
                community.coordinates.lon,
                community.coordinates.lat,
              ],
            },
            properties: {
              id,
              risk: riskValue,
              title: community.title,
              lastAlertDate: community.lastAlertDate || "",
              lastAlertText: community.lastAlertText || "",
              alertCount: community.alertCount,
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

  $: if (map && communities.length) {
    const validCommunities = communities.filter(
      (community) =>
        community.coordinates &&
        community.coordinates.lon &&
        community.coordinates.lat
    );
    const geojson = {
      type: "FeatureCollection",
      features: validCommunities.map((community, i) => {
        const id = (community.id || i).toString();
        let riskValue;
        if (community.risks && community.risks.length > 0) {
          riskValue = community.risks[community.risks.length - 1].riskvalue;
        } else {
          riskValue = community.risk || "default";
        }
        return {
          id,
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [community.coordinates.lon, community.coordinates.lat],
          },
          properties: {
            id,
            risk: riskValue,
            title: community.title,
            lastAlertDate: community.lastAlertDate || "",
            lastAlertText: community.lastAlertText || "",
            alertCount: community.alertCount,
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
    padding: 4px 10px;
    font-size: 10px;
    line-height: 12px;
    border-radius: 25px;
    cursor: pointer;
    box-shadow: 0 0px 8px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  }
  :global(.label-container) {
    display: flex;
    align-items: center;
    font-family: sans-serif;
    font-size: 12px;
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
    width: 15px;
    height: 15px;
    filter: drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.1));
  }
</style>
