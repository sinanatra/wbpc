export async function load({ params, fetch }) {
  const id = params.id;

  try {
    const res = await fetch("/api/query", {
      method: "post",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: `page("${id}")`,
        select: {
          id: "page.id",
          title: "page.title",
          risks: "page.risks.toStructure().sortBy('riskdate', 'desc')",
          alternativeNames: "page.alternativeNames.split(',')",
          coordinates: "page.coordinates.yaml()",
          tags: "page.tags.split(',')",
          info: "page.info",
          keyfacts: "page.keyfacts.toStructure()",
          alerts: "page.alerts.toStructure().sortBy('alertDate', 'desc')",
          protection: "page.protection",
          access: "page.access",
          threat: "page.threat",
          safety: "page.safety",
          images: {
            query: "page.images.sortBy('sort')",
            select: {
              url: true,
              caption: "file.caption",
              copyright: "file.copyright",
              alt: "file.alt",
            },
          },
          governmentMoneySpent: "page.governmentMoneySpent",
          donorFunding: "page.grantsList.toStructure().sortBy('fundingDate', 'asc')",
          population: "page.population",
          yearEstablished: "page.yearEstablished",
          mainThreat: "page.mainThreat",
          isBedouin: "page.isBedouin",
        },
      }),
    });
    const data = await res.json();
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
