import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { discoverWorktrees, REPO_ROOT } from "./lib.mjs";

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

const { candidates, dirtySkipped, unmerged } = discoverWorktrees();

const report = {
  generatedAt: new Date().toISOString(),
  candidates,
  dirtySkipped,
};

writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + "\n");

const lines = [];
lines.push(`Worktree cleanup report — ${report.generatedAt}`);
lines.push("");

if (candidates.length === 0) {
  lines.push("No merged worktrees ready for cleanup.");
} else {
  lines.push(`${candidates.length} worktree(s) merged into main and ready to clean up:`);
  for (const c of candidates) {
    const issuePart = c.issueNumber
      ? `issue #${c.issueNumber} (${c.issueState ?? "unknown"}): ${c.issueTitle ?? ""}`
      : "no linked issue";
    lines.push(`  - ${c.branch} — ${issuePart}`);
  }
  lines.push("");
  lines.push(
    "Tell Claude which to clean up, e.g. \"clean up worktree issue 16\", or run:",
  );
  lines.push(
    `  node scripts/worktree-cleanup/cleanup.mjs ${candidates
      .map((c) => c.issueNumber ?? c.branch)
      .join(" ")}`,
  );
}

if (dirtySkipped.length > 0) {
  lines.push("");
  lines.push(`${dirtySkipped.length} worktree(s) merged but skipped (uncommitted changes):`);
  for (const c of dirtySkipped) {
    lines.push(`  - ${c.branch} at ${c.worktreePath}`);
  }
}

if (unmerged.length > 0) {
  lines.push("");
  lines.push(`${unmerged.length} worktree(s) still active (branch not merged into main):`);
  for (const u of unmerged) {
    lines.push(`  - ${u.branch}`);
  }
}

const summary = lines.join("\n");
console.log(summary);

if (candidates.length > 0) {
  notify(
    "Worktree cleanup report ready",
    `${candidates.length} merged worktree(s) ready to clean up — see ${path.basename(REPORT_FILE)}`,
  );
}
