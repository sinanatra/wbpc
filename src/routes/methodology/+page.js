import { fetchCustomPageByUrl } from '$lib/loadData.js';

export async function load() {
  try {
    const response = await fetchCustomPageByUrl('methodology');
    return {
      methodology: response.result
    };
  } catch (error) {
    console.error('Failed to load methodology page:', error);
    return {
      error: 'Failed to load Methodology page.'
    };
  }
}
