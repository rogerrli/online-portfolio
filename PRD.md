# PRD: online-portfolio

## Goal
Replace the Squarespace site at [liroger.com](https://liroger.com) with a code-owned site that presents Roger's resume more usefully — easier to scan, easier to keep current, and a better signal of technical craft than a template site.

## Audience
Recruiters, hiring managers, and potential collaborators doing a first-pass evaluation. Assume a skim, not a read — the design should reward 30 seconds as much as 5 minutes.

## Must-have sections
- **About/Hero** — who Roger is, current focus, at-a-glance positioning.
- **Experience** — work history, structured so it's easy to scan by role, company, and dates.
- **Skills** — technical skills, likely grouped (languages, frameworks, tools) rather than a flat tag cloud.
- **Projects** — selected work worth showing, with enough context to understand impact.
- **Contact** — how to reach Roger (email, LinkedIn, GitHub, etc.).

(Content for these gets pulled from the current liroger.com Squarespace site as a starting inventory, then refined.)

## Non-goals
- No CMS — content lives in the codebase, edited via normal commits.
- No backend/server — static site only, no database, no auth.
- No large-traffic considerations — this is a personal site; free-tier static hosting is the target, not scale.

## Stack
- Vite + React + TypeScript, strict mode.
- `oxlint` for linting, `tsc -b` for typechecking — both run in CI on every push/PR.
- Deployed on Vercel, auto-deploy from `main`.
- [AGENTS.md](./AGENTS.md) captures the UI/interaction guidelines (Vercel's web-interface-guidelines) the build should follow.

## Process
New work is tracked as a GitHub Issue before it's built. Labels: `enhancement`, `content`, `infra`, `design` (plus GitHub's defaults like `bug`).
