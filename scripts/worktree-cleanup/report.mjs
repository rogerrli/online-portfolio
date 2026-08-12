import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { evidenceFor, inspectWorktrees, REPO_ROOT } from "./lib.mjs";

const REPORT_FILE = path.join(REPO_ROOT, ".claude", "worktree-cleanup-report.json");

function notify(title, message) {
  if (process.platform !== "darwin") return;
  try {
    execFileSync("osascript", [
      "-e",
      `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`,
    ]);
  } catch {
    // best-effort only
  }
}

const entries = inspectWorktrees();
const removable = entries.filter((e) => e.removable);
const heldBack = entries.filter((e) => !e.removable);

const generatedAt = new Date().toISOString();
writeFileSync(
  REPORT_FILE,
  JSON.stringify({ generatedAt, removable, heldBack }, null, 2) + "\n",
);

const lines = [];
lines.push(`Worktree cleanup report — ${generatedAt}`);
lines.push("");

if (removable.length === 0) {
  lines.push("Nothing to clean up: no worktree has a closed issue and a clean tree.");
} else {
  lines.push(`${removable.length} worktree(s) confirmed safe to remove:`);
  for (const entry of removable) {
    lines.push("");
    lines.push(`  ${entry.branch}`);
    for (const line of evidenceFor(entry)) {
      lines.push(`    ✓ ${line}`);
    }
  }
  lines.push("");
  lines.push("Nothing was removed. To act on it, tell Claude \"clean up the merged worktrees\", or run:");
  lines.push(
    `  node scripts/worktree-cleanup/cleanup.mjs ${removable
      .map((e) => e.issueNumber ?? e.branch)
      .join(" ")}`,
  );
}

if (heldBack.length > 0) {
  lines.push("");
  lines.push(`${heldBack.length} worktree(s) kept:`);
  for (const entry of heldBack) {
    lines.push(`  - ${entry.branch} — ${entry.blockers.join("; ")}`);
  }
}

console.log(lines.join("\n"));

if (removable.length > 0) {
  notify(
    "Worktree cleanup report ready",
    `${removable.length} worktree(s) confirmed safe to remove — see ${path.basename(REPORT_FILE)}`,
  );
}
