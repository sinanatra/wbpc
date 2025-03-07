export const fetchRiskColors = async () => {
  const res = await fetch("/api/query", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: "site.riskValues.toStructure().toArray()",
    }),
  });
  const data = await res.json();
  return data;
};

export const fetchCommunities = async () => {
  const res = await fetch("/api/query", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: "site.children.template('community').filterBy('status', 'listed')",
      select: {
        title: "page.title",
        coordinates: "page.coordinates.yaml()",
        alternativeNames: "page.alternativeNames.split(',')",
        risk: "page.risk",
      },
    }),
  });
  const data = await res.json();
  return data;
};
