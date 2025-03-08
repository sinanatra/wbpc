<script>
  export let riskArray;

  console.log(riskArray);
</script>

<section>
  {#each riskArray as risk}
    <div>
      <span style="background-color: {risk.riskcolor}"></span>
      <span>{risk.riskvalue}</span>
    </div>
  {/each}
</section>

<style>
  section {
    position: absolute;
    top: 10px;
    left: 10px;
    border-radius: 10px;
    z-index: 2;
    background-color: white;
    padding: 10px;
    width: 100%;
    max-width: 360px;
  }
</style>
