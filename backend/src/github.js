// Zugriff auf das Repository über die GitHub-REST-API (fein granulierter Token, nur dieses Repo).
// Änderungen werden als ein einziger Commit geschrieben (Git-Data-API), damit Protokoll und
// Änderungs-Historie immer zusammen geändert werden.

export class GitHubError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export function github(env) {
  const api = (env.GITHUB_API || "https://api.github.com").replace(/\/$/, "");
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || "main";

  async function call(method, path, { body, accept = "application/vnd.github+json", allow404 = false } = {}) {
    const res = await fetch(`${api}/repos/${repo}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: accept,
        "User-Agent": "fortschritt-dashboard",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (allow404 && res.status === 404) return null;
    if (!res.ok) {
      let msg = `GitHub ${method} ${path.split("?")[0]}: HTTP ${res.status}`;
      try { const j = await res.json(); if (j.message) msg += ` (${j.message})`; } catch (e) { /* kein JSON */ }
      throw new GitHubError(msg, res.status);
    }
    return accept.includes("raw") ? res.text() : res.json();
  }

  return {
    branch,
    async head() {
      const ref = await call("GET", `/git/ref/heads/${encodeURIComponent(branch)}`);
      const commit = await call("GET", `/git/commits/${ref.object.sha}`);
      return { sha: ref.object.sha, tree: commit.tree.sha };
    },
    // Rohinhalt einer Datei an einem bestimmten Commit; null, wenn es sie nicht gibt.
    async file(path, ref) {
      const p = path.split("/").map(encodeURIComponent).join("/");
      return call("GET", `/contents/${p}?ref=${encodeURIComponent(ref)}`, { accept: "application/vnd.github.raw+json", allow404: true });
    },
    // Ein Commit mit mehreren Dateien; schlägt fehl (409), wenn der Branch sich inzwischen bewegt hat.
    async commit(base, files, message, author) {
      const tree = await call("POST", "/git/trees", {
        body: { base_tree: base.tree, tree: Object.entries(files).map(([path, content]) => ({ path, mode: "100644", type: "blob", content })) },
      });
      const commit = await call("POST", "/git/commits", { body: { message, tree: tree.sha, parents: [base.sha], ...(author ? { author } : {}) } });
      try {
        await call("PATCH", `/git/refs/heads/${encodeURIComponent(branch)}`, { body: { sha: commit.sha, force: false } });
      } catch (e) {
        if (e.status === 422) throw new GitHubError("Branch wurde inzwischen geändert", 409);
        throw e;
      }
      return commit.sha;
    },
    // Läuft gerade ein Workflow, der das Protokoll schreibt?
    async activeRuns(workflowFile) {
      const wf = encodeURIComponent(workflowFile);
      const [a, b] = await Promise.all([
        call("GET", `/actions/workflows/${wf}/runs?status=in_progress&per_page=5`),
        call("GET", `/actions/workflows/${wf}/runs?status=queued&per_page=5`),
      ]);
      return (a.total_count || 0) + (b.total_count || 0);
    },
  };
}
