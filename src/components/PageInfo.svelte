<script>
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  export let community;
  const dispatch = createEventDispatcher();

  let selectedTab = "Info";

  $: hasInfo =
    (community.info && community.info.trim().length > 0) ||
    (community.population && community.population.trim().length > 0) ||
    community.yearEstablished ||
    (community.mainThreat && community.mainThreat.trim().length > 0) ||
    (community.keyfacts && community.keyfacts.length > 0);

  $: console.log(hasInfo);

  $: hasAlerts = community.alerts && community.alerts.length > 0;
  $: hasStandards =
    (community.protection && community.protection.trim().length > 0) ||
    (community.access && community.access.trim().length > 0) ||
    (community.threat && community.threat.trim().length > 0) ||
    (community.safety && community.safety.trim().length > 0);
  $: hasImages = community.images && community.images.length > 0;
  $: hasGrants =
    community.governmentMoneySpent !== undefined &&
    community.governmentMoneySpent !== null &&
    community.governmentMoneySpent !== "";
  $: hasRisks = community.risks && community.risks.length > 0;

  $: {
    const availableTabs = [];
    if (hasInfo) availableTabs.push("Info");
    if (hasAlerts) availableTabs.push("Alerts");
    if (hasStandards) availableTabs.push("Standards");
    if (hasImages) availableTabs.push("Images");
    if (hasGrants) availableTabs.push("Grants");
    if (hasRisks) availableTabs.push("Risks");
    if (!availableTabs.includes(selectedTab)) {
      selectedTab = availableTabs[0] || "";
    }
  }

  let panelWrapperRef;

  function handleClickOutside(event) {
    if (panelWrapperRef && !panelWrapperRef.contains(event.target)) {
      dispatch("close");
    }
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener("click", handleClickOutside);
  });
</script>

<div bind:this={panelWrapperRef} class="panel-wrapper">
  <div class="pageinfo">
    <a href="/{community.id}">
      <h2>{community.title}</h2>
    </a>

    {#if community.alternativeNames && community.alternativeNames.length}
      <p>
        <strong>Alternative Names:</strong>
        {community.alternativeNames.join(", ")}
      </p>
    {/if}

    {#if hasInfo || hasAlerts || hasStandards || hasImages || hasGrants || hasRisks}
      <div class="tab-content">
        {#if selectedTab === "Info" && hasInfo}
          <div class="tab-panel">
            {#if community.info && community.info.trim().length > 0}
              <p>{community.info}</p>
            {/if}
            {#if community.population && community.population.trim().length > 0}
              <p><strong>Population:</strong> {community.population}</p>
            {/if}
            {#if community.yearEstablished}
              <p>
                <strong>Year Established:</strong>
                {community.yearEstablished}
              </p>
            {/if}
            {#if community.mainThreat && community.mainThreat.trim().length > 0}
              <p><strong>Main Threat:</strong> {community.mainThreat}</p>
            {/if}
            {#if community.isBedouin}
              <p><strong>Bedouin Community</strong></p>
            {/if}
            {#if community.keyfacts && community.keyfacts.length > 0}
              <div>
                <h3>Key Facts</h3>
                {#each community.keyfacts as keyfact}
                  <div class="alert-item">
                    <p>{keyfact.keyinfodescription}</p>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {:else if selectedTab === "Alerts" && hasAlerts}
          <div class="tab-panel">
            {#each community.alerts as alert}
              <div class="alert-item">
                <strong>{alert.alertdate}:</strong>
                {@html alert.alertdescription}
              </div>
            {/each}
          </div>
        {:else if selectedTab === "Standards" && hasStandards}
          <div class="tab-panel">
            <div>
              <strong>Protection:</strong>
              {community.protection}
            </div>
            <div>
              <strong>Access:</strong>
              {community.access}
            </div>
            <div>
              <strong>Threat:</strong>
              {community.threat}
            </div>
            <div>
              <strong>Safety:</strong>
              {community.safety}
            </div>
          </div>
        {:else if selectedTab === "Images" && hasImages}
          <div class="tab-panel images-panel">
            {#each community.images as image}
              <img
                src={image.url}
                alt={image.alt || community.title}
                class="community-image"
              />
              {#if image.caption}
                <p>{image.caption}</p>
              {/if}
            {/each}
          </div>
        {:else if selectedTab === "Grants" && hasGrants}
          <div class="tab-panel">
            <p>
              <strong>Donor-Funded Assistance:</strong>
              {community.governmentMoneySpent} €
            </p>
          </div>
        {:else if selectedTab === "Risks" && hasRisks}
          <div class="tab-panel">
            <h3>Risk History</h3>
            <ul>
              {#each community.risks as risk}
                <li>
                  <strong>{risk.riskdate}</strong>: {risk.riskvalue}
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="side-tabs">
    {#if hasInfo}
      <button
        class:selected={selectedTab === "Info"}
        on:click={() => (selectedTab = "Info")}
      >
        Info
      </button>
    {/if}
    {#if hasAlerts}
      <button
        class:selected={selectedTab === "Alerts"}
        on:click={() => (selectedTab = "Alerts")}
      >
        Alerts
      </button>
    {/if}
    {#if hasStandards}
      <button
        class:selected={selectedTab === "Standards"}
        on:click={() => (selectedTab = "Standards")}
      >
        Standards of Living
      </button>
    {/if}
    {#if hasImages}
      <button
        class:selected={selectedTab === "Images"}
        on:click={() => (selectedTab = "Images")}
      >
        Images
      </button>
    {/if}
    {#if hasGrants}
      <button
        class:selected={selectedTab === "Grants"}
        on:click={() => (selectedTab = "Grants")}
      >
        Donor-Funded Assistance
      </button>
    {/if}
    {#if hasRisks}
      <button
        class:selected={selectedTab === "Risks"}
        on:click={() => (selectedTab = "Risks")}
      >
        Risks
      </button>
    {/if}
  </div>
</div>

<style>
  .pageinfo {
    position: absolute;
    top: 50px;
    right: 10px;
    width: 360px;
    background-color: white;
    padding: 10px;
    z-index: 2;
    font-family: sans-serif;
    font-size: 14px;
  }
  h1,
  h2,
  p {
    margin: 0;
    padding: 0 10px 0 0;
  }
  .tab-content {
    margin-top: 10px;
    min-height: 500px;
    max-height: 80vh;
    overflow: auto;
  }
  .tab-panel {
    margin-bottom: 10px;
  }
  .alert-item {
    padding: 4px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-bottom: 6px;
  }
  .images-panel img {
    width: 100%;
    margin-bottom: 6px;
    border-radius: 4px;
  }
  .side-tabs {
    position: absolute;
    top: 50px;
    right: 390px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .side-tabs button {
    writing-mode: sideways-lr;
    text-orientation: mixed;
    background: white;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 4px;
  }
  .side-tabs button.selected {
    font-weight: bold;
  }
</style>
