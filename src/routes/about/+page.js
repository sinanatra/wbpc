import { fetchCustomPageByUrl } from '$lib/loadData.js';

export async function load() {
  try {
    const response = await fetchCustomPageByUrl('about');
    return {
      about: response.result
    };
  } catch (error) {
    console.error('Failed to load about page:', error);
    return {
      error: 'Failed to load About page.'
    };
  }
}
