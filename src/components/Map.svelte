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
  let selectedFeatureId = null;

  function addAlertMarkers(geojson) {
    geojson.features.forEach((feature) => {
      const { lastAlertDate, lastAlertText } = feature.properties;
      if (lastAlertDate && lastAlertText && lastAlertText.trim() !== "") {
        const alertEl = document.createElement("div");
        alertEl.className = "alert-box";
        let displayText = lastAlertText;
        if (displayText.length > 80) {
          displayText = displayText.substring(0, 80) + "...";
        }
        alertEl.innerHTML = `<div class="alert-date">${lastAlertDate}</div><div class="alert-text">${displayText}</div>`;

        alertEl.addEventListener("click", (e) => {
          e.stopPropagation();
          dispatch("dotClick", feature.properties);

        });

        const screenPos = map.project(feature.geometry.coordinates);
        let anchor, offset;
        if (screenPos.x < mapContainer.clientWidth / 2) {
          anchor = "right";
          offset = [-10, 20];
        } else {
          anchor = "left";
          offset = [10, 20];
        }

        new mapboxgl.Marker({
          element: alertEl,
          anchor,
          offset,
        })
          .setLngLat(feature.geometry.coordinates)
          .addTo(map);
      }
    });
  }

  onMount(() => {
    map = new mapboxgl.Map({
      container: mapContainer,
      style: "mapbox://styles/sinanatra/cm7yteg6x00ty01sc85aqduv2",
      center: [35.2621, 31.95],
      zoom: 9,
      minZoom: 8,
      maxBounds: [
        [34.45395548496137, 30.509751808262436],
        [35.9947960976464, 32.48706528683205],
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
              risk: community.risk,
              title: community.title,
              lastAlertDate: community.lastAlertDate || "",
              lastAlertText: community.lastAlertText || "",
            },
          };
        }),
      };

      map.addSource("communities", {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: "community-dots",
        type: "circle",
        source: "communities",
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            10,
            6,
          ],
          "circle-color": [
            "match",
            ["get", "risk"],
            ...Object.entries(riskColors).flat(),
            "#000000",
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      addAlertMarkers(geojson);

      map.on("click", "community-dots", (event) => {
        const feature = event.features[0];
        const featureId = feature.id || feature.properties.id;
        if (feature && featureId !== undefined) {
          if (selectedFeatureId !== null && selectedFeatureId !== featureId) {
            map.setFeatureState(
              { source: "communities", id: selectedFeatureId },
              { selected: false }
            );
          }
          selectedFeatureId = featureId;
          map.setFeatureState(
            { source: "communities", id: featureId },
            { selected: true }
          );
          dispatch("dotClick", feature.properties);
        } else {
          console.error("Feature id is undefined", feature);
        }
      });

      map.on("mouseenter", "community-dots", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "community-dots", () => {
        map.getCanvas().style.cursor = "";
      });
    });
  });

  onDestroy(() => {
    if (map) map.remove();
  });
</script>

<div bind:this={mapContainer} class="map-container"></div>

<style>
  @import "mapbox-gl/dist/mapbox-gl.css";

  .map-container {
    width: 100%;
    height: 100%;
  }

  :global(.alert-box) {
    background: white;
    border-radius: 10px;
    padding: 5px;
    max-width: 150px;
    font-size: 10px;
    line-height: 12px;
    cursor: pointer;
  }

  :global(.alert-date) {
    font-weight: bold;
  }

  :global(.alert-text) {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
</style>
