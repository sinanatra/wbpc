<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  let searchTerm = "";

  function handleInput(event) {
    searchTerm = event.target.value;
    dispatch("search", searchTerm);
  }
</script>

<div class="search-bar">
  <input
    type="text"
    bind:value={searchTerm}
    on:input={handleInput}
    placeholder="Search communities..."
  />
</div>

<style>
  .search-bar {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 5;
  }

  .search-bar input {
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 1rem;
    min-width: 250px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .search-bar input:focus {
    outline: none;
    border-color: #0077ff;
  }
</style>
