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

function parseWorktrees(porcelain) {
  const worktrees = [];
  let current = null;
  for (const line of porcelain.split("\n")) {
    if (line.startsWith("worktree ")) {
      current = { path: line.slice("worktree ".length), locked: false };
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
  try {
    const out = execFileSync(
      "gh",
      ["issue", "view", issueNumber, "--json", "state,title,url"],
      { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    return JSON.parse(out);
  } catch {
    return null;
  }
}

// The repo merges PRs via squash, so a merged branch's commits are never an
// ancestor of main (squash produces a brand-new commit hash) — ask GitHub
// directly whether a PR for this branch merged, falling back to ancestry
// for branches that predate the PR workflow (merged via direct commit/merge commit).
function isBranchMerged(branch) {
  try {
    const out = execFileSync(
      "gh",
      ["pr", "list", "--head", branch, "--state", "merged", "--json", "number", "--limit", "1"],
      { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    if (JSON.parse(out).length > 0) return true;
  } catch {
    // fall through to ancestry check
  }
  return gitOrNull(["merge-base", "--is-ancestor", branch, "main"]) !== null;
}

// Discovers worktrees whose branch is fully merged into main.
// Returns { candidates, dirtySkipped, unmerged } — candidates are safe to clean up.
export function discoverWorktrees() {
  gitOrNull(["fetch", "origin", "main", "--quiet"]);

  const porcelain = git(["worktree", "list", "--porcelain"]);
  const worktrees = parseWorktrees(porcelain);

  const candidates = [];
  const dirtySkipped = [];
  const unmerged = [];

  for (const wt of worktrees) {
    if (wt.path === REPO_ROOT || !wt.branch) continue;

    if (!isBranchMerged(wt.branch)) {
      unmerged.push({ worktreePath: wt.path, branch: wt.branch });
      continue;
    }

    const status = gitOrNull(["status", "--porcelain"], wt.path);
    const dirty = Boolean(status);

    const issueNumber = issueNumberFromBranch(wt.branch);
    const issue = issueNumber ? getIssueInfo(issueNumber) : null;

    const entry = {
      worktreePath: wt.path,
      branch: wt.branch,
      locked: wt.locked,
      issueNumber,
      issueState: issue?.state ?? null,
      issueTitle: issue?.title ?? null,
      issueUrl: issue?.url ?? null,
    };

    if (dirty) {
      dirtySkipped.push(entry);
    } else {
      candidates.push(entry);
    }
  }

  return { candidates, dirtySkipped, unmerged };
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

export function closeIssueGracefully(entry) {
  if (!entry.issueNumber) return { acted: false, reason: "no linked issue" };

  const issue = getIssueInfo(entry.issueNumber);
  if (!issue) return { acted: false, reason: "could not read issue" };

  if (issue.state !== "OPEN") {
    return { acted: false, reason: `issue already ${issue.state}` };
  }

  const shortSha = gitOrNull(["rev-parse", "--short", "main"]) ?? "main";
  const body =
    `Closing automatically: branch \`${entry.branch}\` was merged into ` +
    `\`main\` (${shortSha}) and its worktree has been cleaned up by the ` +
    `daily worktree-cleanup job.`;

  execFileSync("gh", ["issue", "comment", entry.issueNumber, "--body", body], {
    cwd: REPO_ROOT,
  });
  execFileSync("gh", ["issue", "close", entry.issueNumber], { cwd: REPO_ROOT });

  return { acted: true };
}
