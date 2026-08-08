import {
  closeIssueGracefully,
  discoverWorktrees,
  removeWorktreeAndBranch,
} from "./lib.mjs";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(
    "Usage: node cleanup.mjs <issueNumber|branch> [...] | all\n" +
      "Run report.mjs first to see what's eligible.",
  );
  process.exit(1);
}

const { candidates, dirtySkipped } = discoverWorktrees();

const wantAll = args.length === 1 && args[0] === "all";
const targets = wantAll
  ? candidates
  : candidates.filter(
      (c) => args.includes(c.issueNumber) || args.includes(c.branch),
    );

if (targets.length === 0) {
  const dirtyMatch = dirtySkipped.filter(
    (c) => args.includes(c.issueNumber) || args.includes(c.branch),
  );
  if (dirtyMatch.length > 0) {
    console.error(
      "Requested worktree(s) have uncommitted changes and were not touched:",
    );
    for (const d of dirtyMatch) console.error(`  - ${d.branch} at ${d.worktreePath}`);
  } else {
    console.error("No matching, merged, clean worktrees found for: " + args.join(", "));
  }
  process.exit(1);
}

for (const entry of targets) {
  console.log(`Cleaning up ${entry.branch} (${entry.worktreePath})`);
  removeWorktreeAndBranch(entry);
  console.log("  worktree + branch removed");

  const result = closeIssueGracefully(entry);
  if (result.acted) {
    console.log(`  issue #${entry.issueNumber} commented + closed`);
  } else {
    console.log(`  issue not modified (${result.reason})`);
  }
}
