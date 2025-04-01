<script>
  import Header from "../components/Header.svelte";
  import "./styles.css";
</script>

<div class="app">
  <Header />

  <main>
    <slot />
  </main>
</div>

<style>
  :global(html), 
  :global(body) {
    font-family: "Inter", sans-serif;
    font-size: 14px;
  }
</style>
