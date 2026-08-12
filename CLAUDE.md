# Workflow

- MUST: Do all work on a feature branch **in its own worktree** and open a PR — NEVER commit directly to `main`, and never edit files in the primary checkout. A `PreToolUse` hook (`scripts/hooks/require-worktree.py`) enforces this: edits outside a worktree are blocked, except `.claude/` local config.
- MUST: Branch/worktree naming follows `issue-<N>-<slug>` (worktree dir) / `worktree-issue-<N>-<slug>` (branch) for work tied to a GitHub issue.
- MUST: PR description references the issue it closes (e.g. `Closes #16`) so merging closes it automatically.
- MUST: Merge PRs via squash merge (the only strategy enabled on this repo) — keeps `main` history linear, one commit per change.
- MUST: Before starting work, check for overlap with other in-flight work (`git worktree list`, `gh pr list`) — one issue/area in flight at a time to avoid conflicting concurrent edits.
- MUST: Before starting implementation on an issue, check it has no assignee and no claim comment (`gh issue view <n> --json assignees,comments`); if either is set, another session already has it — pick a different issue. Otherwise claim it: `gh issue edit <n> --add-assignee @me` plus a comment naming the worktree/branch in use.
- MUST: Verify the PR's CI run (`ci.yml`: typecheck, lint, build) is green before merging.
- MUST: When reporting a completed PR, include its Vercel preview deployment URL (from the `vercel[bot]` PR comment) alongside the PR link, once the preview is ready.
- SHOULD: Keep a PR scoped to a single issue — don't bundle unrelated changes into one PR.
- MUST: Never commit secrets or `.env*` files — use Vercel environment variables for anything sensitive.
- MUST: Never merge a PR yourself, even if CI is green and it's mergeable — open it, verify checks, and stop. Only Roger merges.
