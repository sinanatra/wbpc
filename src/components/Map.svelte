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

  function addAlertPills(geojson) {
    geojson.features.forEach((feature) => {
      const { lastAlertDate, lastAlertText } = feature.properties;
      if (lastAlertDate && lastAlertText && lastAlertText.trim() !== "") {
        const pillEl = document.createElement("div");
        pillEl.className = "alert-pill";
        const count = feature.properties.alertCount || 1;
        if (count == 1) {
          pillEl.textContent = count + " new alert";
        } else {
          pillEl.textContent = count + " new alerts";
        }

        const risk = feature.properties.risk;
        const riskColor = riskColors[risk] || "#F05056";
        pillEl.style.backgroundColor = riskColor;
        // pillEl.style.color = "white";

        pillEl.addEventListener("click", (e) => {
          e.stopPropagation();
          dispatch("dotClick", feature.properties);
        });

        const offset = [20, 0];
        new mapboxgl.Marker({
          element: pillEl,
          offset: offset,
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
      center: [35.31820317122984, 31.961345483167264],
      zoom: 8.5,
      minZoom: 1,
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
              alertCount: community.alertCount,
            },
          };
        }),
      };

      map.addSource("communities", {
        type: "geojson",
        data: geojson,
      });

      if (Object.entries(riskColors).length > 0) {
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
      }

      addAlertPills(geojson);

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

  :global(.alert-pill) {
    color: black;
    padding: 4px 10px;
    font-size: 10px;
    line-height: 12px;
    border-radius: 25px;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  }
</style>
