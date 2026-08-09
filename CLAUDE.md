# Workflow

- MUST: Do all work on a feature branch and open a PR — NEVER commit directly to `main`.
- MUST: Branch/worktree naming follows `issue-<N>-<slug>` (worktree dir) / `worktree-issue-<N>-<slug>` (branch) for work tied to a GitHub issue.
- MUST: PR description references the issue it closes (e.g. `Closes #16`) so merging closes it automatically.
- MUST: Merge PRs via squash merge (the only strategy enabled on this repo) — keeps `main` history linear, one commit per change.
- MUST: Before starting work, check for overlap with other in-flight work (`git worktree list`, `gh pr list`) — one issue/area in flight at a time to avoid conflicting concurrent edits.
- MUST: Verify the PR's CI run (`ci.yml`: typecheck, lint, build) is green before merging.
- SHOULD: Keep a PR scoped to a single issue — don't bundle unrelated changes into one PR.
- MUST: Never commit secrets or `.env*` files — use Vercel environment variables for anything sensitive.
- MUST: Never merge a PR yourself, even if CI is green and it's mergeable — open it, verify checks, and stop. Only Roger merges.
