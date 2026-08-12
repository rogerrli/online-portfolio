#!/usr/bin/env python3
"""PreToolUse guard: keep file edits out of the primary checkout.

Work belongs in a git worktree, so parallel sessions can't strand edits on
whatever branch the shared checkout happens to have out. See issue #79: a
session branched inside the primary checkout, edited src/App.tsx without
committing, and the change rode along when it switched back to main.

Primary vs. linked worktree is detected through git rather than a hardcoded
path, so this keeps working on any machine: in the primary checkout --git-dir
and --git-common-dir resolve to the same directory, while in a linked worktree
--git-dir points at .git/worktrees/<name> and --git-common-dir still points at
the shared .git.

Python rather than jq — jq is not installed on this machine, but macOS always
ships /usr/bin/python3.
"""

import json
import os
import subprocess
import sys

BLOCK_MESSAGE = """Blocked: {path} is in the primary checkout.

Edits here land on whichever branch the shared checkout has out, and survive \
branch switches — that is how an orphaned src/App.tsx edit ended up sitting on \
main (issue #79).

Create a worktree and edit there instead:
  git worktree add .claude/worktrees/issue-<N>-<slug> -b worktree-issue-<N>-<slug> origin/main

Only .claude/ local config is editable in the primary checkout. See CLAUDE.md \
for the full workflow."""


def allow():
    sys.exit(0)


def deny(reason):
    json.dump(
        {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }
        },
        sys.stdout,
    )
    sys.exit(0)


def git_path(directory, which):
    try:
        result = subprocess.run(
            ["git", "-C", directory, "rev-parse", "--path-format=absolute", which],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    return result.stdout.strip() if result.returncode == 0 else None


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        allow()

    tool_input = payload.get("tool_input") or {}
    path = tool_input.get("file_path") or tool_input.get("notebook_path")
    if not path:
        allow()

    path = os.path.abspath(path)

    # Write targets a file that may not exist yet — walk up to the nearest real directory.
    directory = os.path.dirname(path)
    while not os.path.isdir(directory) and directory != os.path.dirname(directory):
        directory = os.path.dirname(directory)

    git_dir = git_path(directory, "--git-dir")
    common_dir = git_path(directory, "--git-common-dir")

    # Not a git repo at all — none of this applies.
    if not git_dir or not common_dir:
        allow()

    # Linked worktree — exactly where work is supposed to happen.
    if git_dir != common_dir:
        allow()

    # Local machine config and job output live in the primary checkout by design:
    # .claude/launch.json, settings*.json, the worktree-cleanup report.
    if f"{os.sep}.claude{os.sep}" in path:
        allow()

    deny(BLOCK_MESSAGE.format(path=path))


if __name__ == "__main__":
    main()
