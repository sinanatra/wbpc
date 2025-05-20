<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  let query = "";

  function onInput(e) {
    query = e.target.value;
    dispatch("search", query);
  }
</script>

<div class="search-bar">
  <input
    type="text"
    placeholder="Search communities..."
    bind:value={query}
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
    margin-bottom: 1rem;

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
