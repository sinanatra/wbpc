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

  onMount(() => {
    map = new mapboxgl.Map({
      container: mapContainer,
      style: "mapbox://styles/sinanatra/cm7yteg6x00ty01sc85aqduv2",
      center: [35.2621, 31.95],
      zoom: 9,
      minZoom: 8,
      maxBounds: [
        [34.45395548496137, 31.509751808262436],
        [36.85691410858303, 32.845684499585985],
      ],
    });

    map.on("load", () => {
      map.addSource("communities", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: communities.map((community) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [
                community.coordinates.lon,
                community.coordinates.lat,
              ],
            },
            properties: {
              risk: community.risk,
              title: community.title,
            },
          })),
        },
      });

      map.addLayer({
        id: "community-dots",
        type: "circle",
        source: "communities",
        paint: {
          "circle-radius": 6,
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

      map.on("click", "community-dots", (event) => {
        const features = event.features[0];
        if (features) {
          dispatch("dotClick", features.properties);
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
</style>
