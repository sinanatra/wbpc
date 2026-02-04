<script>
  import { goto } from '$app/navigation';
  let password = '';
  let error = '';
  let loading = false;

  async function handleSubmit() {
    loading = true;
    error = '';
    try {
      const response = await fetch('/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        goto('/');
      } else {
        error = 'Incorrect password';
      }
    } catch (e) {
      error = 'An error occurred';
    } finally {
      loading = false;
    }
  }
</script>

<div class="container">
  <div class="form-wrapper">
    <h1>Enter Password</h1>
    <form on:submit|preventDefault={handleSubmit}>
      <input
        type="password"
        bind:value={password}
        placeholder="Password"
        disabled={loading}
        autofocus
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Checking...' : 'Submit'}
      </button>
    </form>
    {#if error}
      <p class="error">{error}</p>
    {/if}
  </div>
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #ffffff;
  }

  .form-wrapper {
    text-align: center;
  }

  h1 {
    color: #333;
    margin-bottom: 2rem;
  }

  form {
    display: flex;
    gap: 1rem;
  }

  input {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 250px;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: #333;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover:not(:disabled) {
    background: #555;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error {
    color: #e74c3c;
    margin-top: 1rem;
  }
</style>
