<script>
  import { onMount, onDestroy } from "svelte";
  import mapboxgl from "mapbox-gl";
  import { createEventDispatcher } from "svelte";

  export let communities = [];
  export let riskColors = {};

  mapboxgl.accessToken =
    "pk.eyJ1Ijoic2ltb25zZXJ2ZWFuZHZvbGxleSIsImEiOiJjbGUyb3R0OG4wMDE0M3BzMGEyNDZ3N2xrIn0.evNhIFMBcNUdhzYST9gKHg";

  let map;
  let mapContainer;
  const dispatch = createEventDispatcher();

  function addMarkers() {
    communities.forEach((community) => {
      if (
        community.coordinates &&
        community.coordinates.lat &&
        community.coordinates.lon
      ) {
        const color = riskColors[community.risk] || "#000000";
        console.log(riskColors, community.risk);
        const marker = new mapboxgl.Marker({ color })
          .setLngLat([community.coordinates.lon, community.coordinates.lat])
          .addTo(map);

        marker.getElement().addEventListener("click", () => {
          dispatch("dotClick", community);
        });
      }
    });
  }

  onMount(() => {
    map = new mapboxgl.Map({
      container: mapContainer,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [35.205097633232725, 31.904950082190478],
      zoom: 8,
    });

    map.on("load", () => {
      addMarkers();
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
