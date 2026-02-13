import { writable, derived } from 'svelte/store';

export const map = writable(null);
export const mapLoaded = writable(false);
export const mapContainer = writable(null);

export const activeSlide = writable(null);
export const targetZoom = writable(12);
export const labelMarker = writable(null);
export const alertPillMarkers = writable([]);

export const layersToggles = writable({
  'settlements-circle': true,
  'outposts': true,
  'settlement-jurisdiction-areas': true,
  'jordanian-state-land': false,
  'closed-military-zones': true,
});

export const showCommunitiesLayers = writable(false);
export const showSettlementsLegend = writable(false);
export const communities = writable([]);
export const settlements = writable([]);
export const riskColors = writable({});

export function clearAllMarkers() {
  labelMarker.set(null);
  alertPillMarkers.update(markers => {
    markers.forEach(m => m.remove());
    return [];
  });
}

export function toggleLayerVisibility(layerId) {
  layersToggles.update(toggles => ({
    ...toggles,
    [layerId]: !toggles[layerId]
  }));
}
