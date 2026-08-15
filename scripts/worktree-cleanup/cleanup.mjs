import { evidenceFor, inspectWorktrees, removeWorktreeAndBranch } from "./lib.mjs";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(
    "Usage: node cleanup.mjs <issueNumber|branch> [...] | all\n" +
      "Run report.mjs first to see what's eligible.",
  );
  process.exit(1);
}

const entries = inspectWorktrees();
const removable = entries.filter((e) => e.removable);

const matchesArgs = (e) =>
  args.includes(e.issueNumber) || args.includes(e.branch);

const wantAll = args.length === 1 && args[0] === "all";
const targets = wantAll ? removable : removable.filter(matchesArgs);

if (targets.length === 0) {
  const heldBack = entries.filter((e) => !e.removable && matchesArgs(e));
  if (heldBack.length > 0) {
    console.error("Requested worktree(s) are not safe to remove:");
    for (const entry of heldBack) {
      console.error(`  - ${entry.branch} — ${entry.blockers.join("; ")}`);
    }
  } else {
    console.error("No matching removable worktrees found for: " + args.join(", "));
  }
  process.exit(1);
}

for (const entry of targets) {
  console.log(`Cleaning up ${entry.branch} (${entry.worktreePath})`);
  for (const line of evidenceFor(entry)) console.log(`  ✓ ${line}`);
  removeWorktreeAndBranch(entry);
  console.log("  worktree + branch removed");
}
