import { fetchCustomPageByUrl, fetchRiskColors } from '$lib/loadData.js';

export async function load() {
  try {
    const [response, riskResponse] = await Promise.all([
      fetchCustomPageByUrl('about'),
      fetchRiskColors()
    ]);
    return {
      about: response.result,
      riskArray: Array.isArray(riskResponse?.result) ? riskResponse.result : []
    };
  } catch (error) {
    console.error('Failed to load about page:', error);
    return {
      error: 'Failed to load About page.',
      riskArray: []
    };
  }
}
