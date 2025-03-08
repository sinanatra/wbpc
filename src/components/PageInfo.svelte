<script>
  import { createEventDispatcher } from "svelte";
  export let community;
  const dispatch = createEventDispatcher();

  function close() {
    dispatch("close");
  }
</script>

<div class="pageinfo">
  <button on:click={close}>Close</button>
  <h2>{community.title}</h2>
  <p><strong>Risk Level:</strong> {community.risk}</p>
  {#if community.alternativeNames && community.alternativeNames.length}
    <p>
      <strong>Alternative Names:</strong>
      {community.alternativeNames.join(", ")}
    </p>
  {/if}
  {#if community.coordinates}
    <p>
      <strong>Coordinates:</strong>
      {community.coordinates.lat}, {community.coordinates.lon}
    </p>
  {/if}
</div>

<style>
  .pageinfo {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 100%;
    max-width: 360px;
    border-radius: 10px;
    background-color: white;
    padding: 10px;
    z-index: 2;
  }

  button {
    float: right;
  }
</style>
