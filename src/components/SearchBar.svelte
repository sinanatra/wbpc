<script>
  import { searchQuery, setSearchQuery } from "$stores/uiStore.js";

  function onInput(e) {
    setSearchQuery(e.target.value);
  }
</script>

<div class="search-bar">
  <input
    type="text"
    placeholder="Search communities..."
    bind:value={$searchQuery}
    on:input={onInput}
  />
</div>

<style>
  .search-bar input {
    width: 100%;
    padding: 0.5rem;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-bottom: 0.5rem;

    /* padding: 0.2rem 0.5rem; */
    color: var(--color-primary);
    /* border: none; */
    cursor: text;
    opacity: 0.7;
  }

  input:focus {
    outline: none;
    border-color: var(--color-primary);
  }
</style>
