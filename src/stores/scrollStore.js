import { writable, derived } from 'svelte/store';

export const activeSlideIndex = writable(0);
export const slides = writable([]);
export const slideRefs = writable([]);
export const slideObservers = writable([]);

export function setActiveSlide(index) {
  activeSlideIndex.set(index);
}

export function setSlides(newSlides) {
  slides.set(newSlides);
}

export const currentSlide = derived(
  [slides, activeSlideIndex],
  ([$slides, $index]) => $slides[$index] || null
);

export const currentSlideId = derived(
  currentSlide,
  $currentSlide => $currentSlide?.id || null
);
