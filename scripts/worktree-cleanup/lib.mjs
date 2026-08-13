import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function git(args, cwd = REPO_ROOT) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function gitOrNull(args, cwd = REPO_ROOT) {
  try {
    return git(args, cwd);
  } catch {
    return null;
  }
}

function gh(args) {
  try {
    const out = execFileSync("gh", args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

// `git worktree list` always reports the primary checkout first; flagging it here
// keeps the primary out of the candidate set even when this script is itself run
// from inside a worktree (where REPO_ROOT points at that worktree, not the primary).
function parseWorktrees(porcelain) {
  const worktrees = [];
  let current = null;
  for (const line of porcelain.split("\n")) {
    if (line.startsWith("worktree ")) {
      current = {
        path: line.slice("worktree ".length),
        locked: false,
        primary: worktrees.length === 0,
      };
      worktrees.push(current);
    } else if (line.startsWith("branch ")) {
      current.branch = line.slice("branch ".length).replace(/^refs\/heads\//, "");
    } else if (line.startsWith("locked")) {
      current.locked = true;
    }
  }
  return worktrees;
}

export function issueNumberFromBranch(branch) {
  const match = branch?.match(/issue-(\d+)/);
  return match ? match[1] : null;
}

export function getIssueInfo(issueNumber) {
  return gh(["issue", "view", issueNumber, "--json", "state,title,url"]);
}

// The repo merges PRs via squash, so a merged branch's commits are never an
// ancestor of main (squash produces a brand-new commit hash) — ask GitHub
// directly whether a PR for this branch merged, falling back to ancestry
// for branches that predate the PR workflow (merged via direct commit/merge commit).
function mergedPrForBranch(branch) {
  const prs = gh([
    "pr", "list", "--head", branch, "--state", "merged",
    "--json", "number,title,mergedAt", "--limit", "1",
  ]);
  if (prs?.length > 0) return prs[0];
  return null;
}

// Both GitHub lookups below are fetched once for the whole run rather than once
// per worktree: with ~18 worktrees the per-branch version cost ~36 sequential
// network round trips (~9s).
//
// `complete` reports whether the batch is known to hold every record — it is only
// false if the fetch failed outright or came back full enough to have been
// truncated. A miss against a complete batch is a real "no such record", so the
// per-item fallback fires only when the batch can't answer authoritatively, and
// correctness never depends on BATCH_LIMIT being large enough.
const BATCH_LIMIT = 200;

function fetchBatch(args, keyOf) {
  const rows = gh([...args, "--limit", String(BATCH_LIMIT)]);
  return {
    map: new Map((rows ?? []).map((row) => [keyOf(row), row])),
    complete: rows !== null && rows.length < BATCH_LIMIT,
  };
}

function fetchMergedPrs() {
  return fetchBatch(
    ["pr", "list", "--state", "merged", "--json", "number,title,mergedAt,headRefName"],
    (pr) => pr.headRefName,
  );
}

function fetchIssues() {
  return fetchBatch(
    ["issue", "list", "--state", "all", "--json", "number,state,title,url"],
    (issue) => String(issue.number),
  );
}

function isAncestorOfMain(branch) {
  return gitOrNull(["merge-base", "--is-ancestor", branch, "main"]) !== null;
}

// Builds the evidence record for every worktree and decides, from that evidence,
// whether it is safe to remove.
//
// The linked GitHub issue is the source of truth: an open issue means the work is
// still in flight no matter what the branch looks like, so the worktree stays. The
// remaining checks (clean tree, merged PR) exist to confirm nothing would be lost
// when the issue says the work is done.
export function inspectWorktrees() {
  gitOrNull(["fetch", "origin", "main", "--prune", "--quiet"]);

  const worktrees = parseWorktrees(git(["worktree", "list", "--porcelain"]));
  const mergedPrs = fetchMergedPrs();
  const issues = fetchIssues();
  const entries = [];

  for (const wt of worktrees) {
    if (wt.primary || wt.path === REPO_ROOT || !wt.branch) continue;

    const issueNumber = issueNumberFromBranch(wt.branch);
    const issue = !issueNumber
      ? null
      : (issues.map.get(issueNumber) ??
        (issues.complete ? null : getIssueInfo(issueNumber)));
    const mergedPr =
      mergedPrs.map.get(wt.branch) ??
      (mergedPrs.complete ? null : mergedPrForBranch(wt.branch));
    const ancestor = mergedPr ? false : isAncestorOfMain(wt.branch);
    const dirty = Boolean(gitOrNull(["status", "--porcelain"], wt.path));
    const aheadOfMain = Number(
      gitOrNull(["rev-list", "--count", `origin/main..${wt.branch}`]) ?? "0",
    );

    // Each blocker is a reason the worktree is NOT safe to remove, phrased for
    // the report so the held-back list explains itself.
    const blockers = [];
    if (!issueNumber) {
      blockers.push("branch name has no issue number — can't confirm the work is done");
    } else if (!issue) {
      blockers.push(`issue #${issueNumber} could not be read from GitHub`);
    } else if (issue.state !== "CLOSED") {
      blockers.push(`issue #${issueNumber} is still ${issue.state}`);
    }
    if (dirty) blockers.push("uncommitted changes in the worktree");
    if (!mergedPr && !ancestor) blockers.push("no merged PR, and branch is not in main");

    entries.push({
      worktreePath: wt.path,
      branch: wt.branch,
      locked: wt.locked,
      issueNumber,
      issueState: issue?.state ?? null,
      issueTitle: issue?.title ?? null,
      issueUrl: issue?.url ?? null,
      mergedPrNumber: mergedPr?.number ?? null,
      mergedPrTitle: mergedPr?.title ?? null,
      mergedPrMergedAt: mergedPr?.mergedAt ?? null,
      inMainByAncestry: ancestor,
      dirty,
      aheadOfMain,
      blockers,
      removable: blockers.length === 0,
    });
  }

  return entries;
}

// The lines that justify removing a worktree — this is what makes the report a
// confirmation rather than just a list of names.
export function evidenceFor(entry) {
  const evidence = [];

  if (entry.issueNumber) {
    evidence.push(
      `issue #${entry.issueNumber} is ${entry.issueState}` +
        (entry.issueTitle ? ` — ${entry.issueTitle}` : ""),
    );
  }
  if (entry.mergedPrNumber) {
    const when = entry.mergedPrMergedAt?.slice(0, 10) ?? "unknown date";
    evidence.push(`PR #${entry.mergedPrNumber} merged ${when}`);
  } else if (entry.inMainByAncestry) {
    evidence.push("branch is already contained in main");
  }
  evidence.push(entry.dirty ? "HAS uncommitted changes" : "working tree is clean");
  if (entry.aheadOfMain > 0) {
    evidence.push(
      `${entry.aheadOfMain} commit(s) not in main — expected after a squash merge`,
    );
  }

  return evidence;
}

export function removeWorktreeAndBranch(entry) {
  if (entry.locked) {
    gitOrNull(["worktree", "unlock", entry.worktreePath]);
  }
  git(["worktree", "remove", entry.worktreePath]);
  // -D (not -d): squash-merged branches aren't an ancestor of main, so git's
  // own "-d" safety check would refuse even though we already verified via
  // GitHub that the PR merged.
  git(["branch", "-D", entry.branch]);

  const remoteRef = gitOrNull(["ls-remote", "--heads", "origin", entry.branch]);
  if (remoteRef) {
    gitOrNull(["push", "origin", "--delete", entry.branch]);
  }
}
