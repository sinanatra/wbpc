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

export const fetchEditorial = async () => {
  const res = await fetch("/api/query", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: "site.slides.yaml()",
    }),
  });
  const data = await res.json();
  return data;
};

export const fetchCommunities = async () => {
  const alertRangeConfig = await fetchAlertRange();
  const alertRange = alertRangeConfig.result || 0;
  const daysRange = alertRangeConfig.result || 0;
  const lastDate = new Date();
  lastDate.setDate(lastDate.getDate() - daysRange);
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
        alternativeTitle: "page.alternativeTitle",
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
        donorFunding:
          "page.grantsList.toStructure().sortBy('fundingDate', 'asc')",
        population: "page.population",
        yearEstablished: "page.yearEstablished",
        mainThreat: "page.mainThreat",
        isBedouin: "page.isBedouin",
      },
    }),
  });
  const data = await res.json();
  return data;
};

export const fetchSettlements = async () => {
  const res = await fetch("/api/query", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query:
        "site.children.template('settlement').filterBy('status', 'listed')",
      select: {
        id: "page.id",
        title: "page.title",
        year: "page.establishment",
        size: "page.numberOfResidents",

        alternativeNames: "page.alternativeNames.split(',')",
        coordinates: "page.coordinates.yaml()",
      },
    }),
  });
  const data = await res.json();
  return data;
};

export const fetchSettlementsData = async (id) => {
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
        alternativeNames: "page.alternativeNames.split(',')",
        coordinates: "page.coordinates.yaml()",
        tags: "page.tags.split(',')",
      },
    }),
  });
  const data = await res.json();
  return data;
};

export const fetchTitle = async () => {
  const res = await fetch("/api/query", {
    method: "post",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: "site.title",
    }),
  });
  const data = await res.json();
  return data;
};

export const fetchCustomPageByUrl = async (url) => {
  const res = await fetch("/api/query", {
    method: "post",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `page("${url}")`,
      select: {
        id: "page.id",
        title: "page.title",
        content: "page.content",
      },
    }),
  });
  const data = await res.json();
  return data;
};
