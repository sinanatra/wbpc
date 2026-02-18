import { writable, derived } from 'svelte/store';

export const selectedItem = writable(null);
export const activeTab = writable(null);
export const searchQuery = writable('');
export const mapItems = writable([]);

export const filteredItems = derived(
  [mapItems, searchQuery],
  ([$mapItems, $searchQuery]) => {
    const q = $searchQuery.toLowerCase().trim();
    if (q.length < 3) return $mapItems;
    
    return $mapItems.filter((item) => {
      const t = item.title.toLowerCase();
      const alternativeTitle =
        typeof item.alternativeTitle === 'string'
          ? item.alternativeTitle.toLowerCase()
          : '';
      const alt = Array.isArray(item.alternativeNames)
        ? item.alternativeNames.some((a) => a.toLowerCase().includes(q))
        : false;
      return t.includes(q) || alternativeTitle.includes(q) || alt;
    });
  }
);
export const isMobile = writable(false);
export const isLoading = writable(false);
export const error = writable(null);
export function setSelectedItem(item) {
  selectedItem.set(item);
}
export function clearSelection() {
  selectedItem.set(null);
}
export function setSearchQuery(query) {
  searchQuery.set(query);
}
export function setMapItems(items) {
  mapItems.set(items);
}
