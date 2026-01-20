<script>
  export let riskArray = [];
</script>

<section class="risk-legend" id="risk-legend">
  {#each riskArray as risk}
    <div class="risk-row">
      <div class="risk-key">
        <span class="risk-circle" style="background-color: {risk.riskcolor}"
        ></span>
        <span class="risk-label">{risk.riskvalue}</span>
      </div>
      <div class="risk-description">{risk.riskdescription}</div>
    </div>
  {/each}
</section>

<style>
  .risk-legend {
    position: sticky;
    top: 0;
    left: 0;
    background-color: #f9f9f9;
    z-index: 10;
    padding: 10px;
    font-size: 0.8em;
    display: grid;
    row-gap: 5px;
    margin-top: 50px;
    margin-bottom: 10px;
  }

  .risk-row {
    display: grid;
    grid-template-columns: 1fr 2fr;
    column-gap: 5px;
    align-items: start;
    /* border-bottom: 1px dashed var(--color-primary); */
  }

  .risk-key {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .risk-circle {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid #fff;
    flex-shrink: 0;
  }

  .risk-description {
    margin: 0;
    color: #555;
  }
</style>
