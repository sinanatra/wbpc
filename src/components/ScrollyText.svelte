<script>
  import { onDestroy } from "svelte";
  import { marked } from "marked";
  import {
    activeSlideIndex,
    setActiveSlide,
    setSlides,
    slides,
  } from "$stores/scrollStore.js";

  let { slides_data = [] } = $props();
  let articleEl;

  $effect(() => {
    if (slides_data.length > 0) {
      setSlides(slides_data);
      setActiveSlide(0);
    }
  });

  let observers = [];
  let slideRefs = [];
  const observerTopInsetRem = 1;

  function remToPx(rem) {
    const rootFontSize =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return rem * rootFontSize;
  }

  function getObserverRootMargin() {
    const viewportHeight = window.innerHeight || 0;
    if (!viewportHeight) return "0px 0px -98% 0px";

    const paddingTop = articleEl
      ? parseFloat(window.getComputedStyle(articleEl).paddingTop) || 0
      : viewportHeight * 0.1;

    let mobileOffsetY = 0;
    if (window.matchMedia("(max-width: 767px)").matches && articleEl) {
      const sidebar = articleEl.closest(".sidebar");
      const sidebarTop = sidebar
        ? sidebar.getBoundingClientRect().top
        : articleEl.getBoundingClientRect().top;
      mobileOffsetY = Math.max(sidebarTop, 0);
    }

    const triggerY = Math.min(
      Math.max(
        mobileOffsetY + paddingTop + remToPx(observerTopInsetRem),
        0,
      ),
      viewportHeight - 1,
    );
    const bandHeight = 2;
    const topShrink = triggerY;
    const bottomShrink = Math.max(0, viewportHeight - triggerY - bandHeight);

    return `-${topShrink}px 0px -${bottomShrink}px 0px`;
  }

  function intersectAction(node, index) {
    slideRefs[index] = node;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && $activeSlideIndex !== index) {
            setActiveSlide(index);
          }
        }
      },
      {
        root: null,
        rootMargin: getObserverRootMargin(),
        threshold: 0,
      },
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
    setActiveSlide(idx);
  }

  function skipIntro() {
    const firstPostIntroIndex = $slides.findIndex(
      (slide, idx) => idx > 0 && slide.id === "communities",
    );
    const fallbackIndex = $slides.length > 1 ? $slides.length - 1 : -1;
    const targetIndex =
      firstPostIntroIndex !== -1 ? firstPostIntroIndex : fallbackIndex;

    if (targetIndex !== -1) {
      scrollToIndex(targetIndex, "auto", "start");
    }
  }
</script>

<article class="slides" bind:this={articleEl}>
  <div>
    {#each $slides as slide, i}
      <div
        use:intersectAction={i}
        class="slide"
        class:active={i === $activeSlideIndex}
        on:click={() => scrollToIndex(i, "instant")}
      >
        {@html marked(slide.text)}
      </div>
      {#if i === 0}
        <div class="skip-btn-container">
          <button class="skip-btn" on:click={skipIntro}> Skip intro </button>
        </div>
      {/if}
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
    padding: 0.4rem 0.6rem;
    color: var(--color-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0.8;
    font-size: 1rem;
  }

  .skip-btn:hover {
    opacity: 1;
  }

  article {
    /* padding-top: 10vh; */
  }

  article .slide:first-child {
    /* background-color: red; */
    margin-bottom: 10vh;
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

  :global(.slide > p) {
    padding-bottom: 1rem;
  }

  .slide.active {
    opacity: 1;
  }
</style>
