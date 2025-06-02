<script>
  import { onDestroy, createEventDispatcher } from "svelte";
  import { marked } from "marked";

  export let slides = [];

  let activeIndex = 0;
  const dispatch = createEventDispatcher();
  const observers = [];
  const slideRefs = [];

  function intersectAction(node, index) {
    slideRefs[index] = node;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && activeIndex !== index) {
            activeIndex = index;
            dispatch("slideEnter", { index, slide: slides[index] });
          }
        }
      },
      {
        root: null,
        rootMargin: "-50% 0px -50% 0px",
        threshold: 0,
      }
    );
    obs.observe(node);
    observers.push(obs);
    return {
      destroy() {
        obs.disconnect();
      },
    };
  }

  onDestroy(() => observers.forEach((o) => o.disconnect()));

  function scrollToIndex(idx, behavior = "smooth", block = "center") {
    if (idx < 0 || idx >= slideRefs.length) return;
    slideRefs[idx].scrollIntoView({ behavior: behavior, block: block });
    activeIndex = idx;
    dispatch("slideEnter", { index: idx, slide: slides[idx] });
  }

  function goToCommunities() {
    const idx = slides.findIndex((s) => s.id === "communities");
    scrollToIndex(idx, "instant", "start");
  }
</script>

<article class="slides">
  <div class="skip-btn-container">
    <button class="skip-btn" on:click={goToCommunities}>
      Skip to Communities
    </button>
  </div>
  <div>
    {#each slides as slide, i}
      <div
        use:intersectAction={i}
        class="slide"
        class:active={i === activeIndex}
        on:click={() => scrollToIndex(i, "instant")}
      >
        {@html marked(slide.text)}
      </div>
    {/each}
  </div>
</article>

<style>
  article {
    position: relative;
    padding: 10px;
  }

  :global(.slides strong) {
    color: var(--color-primary);
    font-weight: 400;
  }

  .skip-btn-container {
    display: flex;
    flex-direction: row-reverse;
  }

  .skip-btn {
    padding: 0.2rem 0.5rem;
    color: var(--color-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0.7;
  }

  .skip-btn:hover {
    opacity: 1;
  }

  article {
    padding-top: 60vh;
  }
  @media screen and (max-width: 767px) {
    article {
      padding-top: 10vh;
    }
  }

  .slide {
    opacity: 0.3;
    transition: opacity 0.3s ease;
    padding: 10px 5px;
    font-size: 1.8em;
    line-height: 1.2em;
    /* text-indent: 10px; */
    cursor: pointer;
    margin: 0 auto;

    hyphens: auto;
    text-wrap: pretty;
  }

  .slide.active {
    opacity: 1;
  }
</style>
