<script>
  import { marked } from "marked";

  export let editorialData;
  console.log("Editorial data:", editorialData);
</script>

<article>
  {#if editorialData}
    {#each editorialData as slide}
      <p>{@html marked(slide.text)}</p>
    {/each}
  {:else}
    <p>No editorial content available.</p>
  {/if}
</article>

<style>
  article {
    margin: 0;
    padding: 1rem;
    background: #f9f9f9;
    /* font-size: 36px; */
  }
</style>
