<script>
  import { onMount } from "svelte";
  import { fetchCommunitiesAudit } from "$lib/loadData.js";

  let loading = true;
  let error = null;
  let projects = [];

  let missingText = false;
  let missingImages = false;

  const hasText = (value) =>
    typeof value === "string" ? value.trim().length > 0 : false;

  const normalizeProject = (project) => {
    const text = hasText(project.info) ? project.info : project.text;
    const imagesCount = Number(project.imagesCount) || 0;
    return {
      id: project.id,
      title: project.title,
      hasText: hasText(text),
      hasImages: imagesCount > 0,
      imagesCount,
    };
  };

  onMount(async () => {
    loading = true;
    error = null;

    try {
      const communitiesRes = await fetchCommunitiesAudit();
      projects = (communitiesRes.result || communitiesRes)
        .map((p) => normalizeProject(p))
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } catch (e) {
      error = e;
    } finally {
      loading = false;
    }
  });

  $: filtered = projects.filter((p) => {
    if (missingText && missingImages) return !p.hasText && !p.hasImages;
    if (missingText) return !p.hasText;
    if (missingImages) return !p.hasImages;
    return true;
  });
</script>

<section class="audit">
  {#if loading}
    <p>Loading…</p>
  {:else if error}
    <p class="error">Error loading: {error.message}</p>
  {:else}
    <div class="controls">
      <label>
        <input type="checkbox" bind:checked={missingText} />
        Missing text
      </label>
      <label>
        <input type="checkbox" bind:checked={missingImages} />
        Missing images
      </label>
      <span class="count">{filtered.length} / {projects.length}</span>
    </div>

    <ul class="list">
      {#each filtered as p (p.id)}
        <li class="row">
          <span class="title">{p.title}</span>
          <span class="meta">
            {p.hasText ? "text" : "no text"},
            {p.hasImages ? `images (${p.imagesCount})` : "no images"}
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .audit {
    padding: 16px;
    max-width: 900px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 12px;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin: 12px 0 16px;
  }

  .count {
    margin-left: auto;
    color: var(--color-tertiary);
  }

  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    border-top: 1px solid var(--color-fade);
  }

  .row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-fade);
  }

  .title {
    font-weight: 600;
  }

  .meta {
    color: var(--color-tertiary);
  }

  .error {
    color: var(--color-primary);
  }

  input {
    accent-color: var(--color-primary);
  }
</style>
