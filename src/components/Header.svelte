<script>
  import { marked } from "marked";
  import { fetchCustomPageByUrl } from "$lib/loadData.js";

  export let title;

  let showAbout = false;
  let about = null;
  let loading = false;
  let error = null;

  async function loadAbout() {
    if (about || loading) {
      showAbout = !showAbout;
      return;
    }

    loading = true;
    try {
      const response = await fetchCustomPageByUrl("about");
      about = response.result;
      console.log("About page loaded:", about);
      showAbout = true;
    } catch (err) {
      error = "Failed to load About page.";
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<header>
  <h1>{title}</h1>
  <div>
    <p>A project by the West Bank Protection Consortium</p>
    <p><a href="#about" on:click|preventDefault={loadAbout}>About</a></p>
  </div>

  {#if showAbout}
    <div class="about-content">
      {#if loading}
        <p>Loading…</p>
      {:else if error}
        <p>{error}</p>
      {:else}
        <div>{@html marked(about.content.text)}</div>
      {/if}
    </div>
  {/if}
</header>

<style>
  header {
    padding: 5px;
    text-align: right;
  }

  header div {
    font-size: 0.8em;
  }

  a {
    color: var(--color-primary);
  }
  
  h1 {
    font-size: 2em;
    margin: 0;
    padding: 0;
    color: var(--color-primary);
    text-transform: capitalize;
  }

  p {
    margin: 0;
    padding: 0;
    font-size: 0.875em;
  }

  .about-content {
    font-size: 1rem;
    margin-top: 1em;
    text-align: left;
    padding: 1em;
    border-bottom: 1px solid #ccc;
  }
</style>
