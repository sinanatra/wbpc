<script>
  import { page } from "$app/stores";
</script>

<header>
  <h1>
    <a href="/"
      ><img src="/logo.svg" alt="Forcible Transfer Watch" class="logo" /></a
    >
  </h1>
  <nav>
    <a href="/about" class:active={$page.route.id === "/about"}>About</a>
    <br />
    <a href="/methodology" class:active={$page.route.id === "/methodology"}
      >Methodology</a
    >
  </nav>
</header>

<style>
  header {
    padding: 5px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    align-items: center;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--color-tertiary);
  }

  nav {
    font-size: 1.2em;
    display: block;
    text-align: right;
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
  }

  a.active {
    font-weight: bold;
    border-bottom: 1px solid var(--color-primary);
    padding-bottom: 1px;
  }

  h1 {
    font-size: 2em;
    margin: 0;
    padding: 0;
    color: var(--color-primary);
    text-transform: capitalize;
    line-height: 1.2;
  }

  h1 a {
    text-decoration: none;
    color: inherit;
  }

  h1 a:hover {
    opacity: 0.8;
  }

  .logo {
    height: 40px;
    width: auto;
    display: block;
  }
</style>
