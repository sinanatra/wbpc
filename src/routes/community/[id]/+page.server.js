import { fetchCommunitiesData } from "$lib/loadData.js";

export async function load({ params, fetch }) {
  const id = params.id;
  console.log("loading community with id:", id);
  try {
    const data = await fetchCommunitiesData(id, fetch);
    return {
      community: data.result || null,
    };
  } catch (error) {
    console.error("Failed to fetch community:", error);
    return {
      community: null,
    };
  }
}
