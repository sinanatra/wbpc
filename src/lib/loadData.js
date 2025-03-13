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
  const lastDate = new Date();
  lastDate.setMonth(lastDate.getMonth() - 7);
  const lastISOString = lastDate.toISOString();

  const res = await fetch("/api/query", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: "site.children.template('community').filterBy('status', 'listed')",
      select: {
        id: "page.id",
        title: "page.title",
        risk: "page.risk",
        alternativeNames: "page.alternativeNames.split(',')",
        coordinates: "page.coordinates.yaml()",
        // lastAlertDate: "page.alerts.toStructure().sortBy('alertDate', 'desc').first().alertDate",
        // lastAlertText: "page.alerts.toStructure().sortBy('alertDate', 'desc').first().alertDescription",
        lastAlertDate:
          "page.alerts.toStructure().filterBy('alertDate', '>=', '" +
          lastISOString +
          "').sortBy('alertDate', 'desc').first() ? page.alerts.toStructure().filterBy('alertDate', '>=', '" +
          lastISOString +
          "').sortBy('alertDate', 'desc').first().alertDate : ''",
        lastAlertText:
          "page.alerts.toStructure().filterBy('alertDate', '>=', '" +
          lastISOString +
          "').sortBy('alertDate', 'desc').first() ? page.alerts.toStructure().filterBy('alertDate', '>=', '" +
          lastISOString +
          "').sortBy('alertDate', 'desc').first().alertDescription : ''",
      },
    }),
  });
  const data = await res.json();
  return data;
};

export const fetchCommunitiesData = async (id) => {
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
        risk: "page.risk",
        alternativeNames: "page.alternativeNames.split(',')",
        coordinates: "page.coordinates.yaml()",
        tags: "page.tags.split(',')",
        history: "page.history",
        keyfacts: "page.keyfacts.toStructure()",
        alerts: "page.alerts.toStructure().sortBy('alertDate', 'desc')",
        standardOfLiving: "page.standardOfLiving",
        images: {
          query: "page.images",
          select: {
            url: true,
            alt: "file.alt",
          },
        },
        governmentMoneySpent: "page.governmentMoneySpent",
      },
    }),
  });
  const data = await res.json();
  return data;
};
