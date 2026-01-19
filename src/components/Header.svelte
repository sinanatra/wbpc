<script>
  import { page } from '$app/stores';
</script>

<header>
  <h1><a href="/">forcible transfer watch</a></h1>
  <div>
    <p>A project by the West Bank Protection Consortium</p>
    <p>
      <a href="/about" class:active={$page.route.id === '/about'}>About</a> | 
      <a href="/methodology" class:active={$page.route.id === '/methodology'}>Methodology</a>
    </p>
  </div>
</header>

<style>
  header {
    padding: 5px;
    text-align: right;
  }

  header div {
    font-size: 0.8em;
  }

  header div p:last-child {
    font-size: 1.5em;
    margin-top: 0.5em;
    line-height: 1.3;
  }

  a {
    color: var(--color-primary);
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
  }

  a {
    text-decoration: none;
  }

  h1 a {
    text-decoration: none;
    color: inherit;
  }

  h1 a:hover {
    opacity: 0.8;
  }

  p {
    margin: 0;
    padding: 0;
    font-size: 0.875em;
  }
</style>
