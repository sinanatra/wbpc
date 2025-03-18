<script>
  export let riskArray;

  console.log(riskArray);
</script>

<section class="risk-legend">
  {#each riskArray as risk}
    <div class="risk-item">
      <span class="risk-circle" style="background-color: {risk.riskcolor}"
      ></span>
      <span class="risk-label">{risk.riskvalue}</span>
    </div>
    <p class="risk-description">{risk.riskdescription}</p>
  {/each}
</section>

<style>
  .risk-legend {
    position: absolute;
    top: 10px;
    left: 10px;
    border-radius: 10px;
    z-index: 2;
    background-color: white;
    padding: 10px;
    width: 100%;
    max-width: 360px;
    font-size: 14px;
  }

  .risk-description {
    margin: 0;
    padding: 0;
    padding-bottom: 20px;
  }

  .risk-item {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }
  .risk-circle {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 8px;
    border: 1px solid white;
  }
  .risk-label {
    flex: 1;
  }
</style>
