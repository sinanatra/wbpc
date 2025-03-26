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

export const fetchAlertRange = async () => {
  const res = await fetch("/api/query", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: "site.alertRange",
    }),
  });
  const data = await res.json();
  return data;
};

export const fetchCommunities = async () => {
  const alertRangeConfig = await fetchAlertRange();
  const alertRange = alertRangeConfig.result || 0;
  const lastDate = new Date();
  lastDate.setMonth(lastDate.getMonth() - alertRange);
  const lastISOString = lastDate.toISOString();

  const res = await fetch("/api/query", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: "site.children.template('community').filterBy('status', 'listed')",
      select: {
        id: "page.id",
        title: "page.title",
        //  only the last N
        risks: "page.risks.toStructure().sortBy('riskdate', 'desc').limit(3)",
        alternativeNames: "page.alternativeNames.split(',')",
        coordinates: "page.coordinates.yaml()",
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
        risks: "page.risks.toStructure().sortBy('riskdate', 'desc')",
        alternativeNames: "page.alternativeNames.split(',')",
        coordinates: "page.coordinates.yaml()",
        tags: "page.tags.split(',')",
        history: "page.history",
        keyfacts: "page.keyfacts.toStructure()",
        alerts: "page.alerts.toStructure().sortBy('alertDate', 'desc')",
        protection: "page.protection",
        access: "page.access",
        threat: "page.threat",
        safety: "page.safety",
        images: {
          query: "page.images",
          select: {
            url: true,
            alt: "file.alt",
          },
        },
        governmentMoneySpent: "page.governmentMoneySpent",
        donorFunding: "page.grantsList.toStructure().sortBy('fundingDate', 'asc')",
      },
    }),
  });
  const data = await res.json();
  return data;
};
