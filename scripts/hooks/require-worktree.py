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
import re
import shlex
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


def is_blocked(path):
    """True when writing `path` would land in the primary checkout."""
    path = os.path.abspath(path)

    # Write targets a file that may not exist yet — walk up to the nearest real
    # directory. A target that is itself a directory stands in for its own repo.
    directory = path if os.path.isdir(path) else os.path.dirname(path)
    while not os.path.isdir(directory) and directory != os.path.dirname(directory):
        directory = os.path.dirname(directory)

    git_dir = git_path(directory, "--git-dir")
    common_dir = git_path(directory, "--git-common-dir")

    # Not a git repo at all — none of this applies.
    if not git_dir or not common_dir:
        return False

    # Linked worktree — exactly where work is supposed to happen.
    if git_dir != common_dir:
        return False

    # Local machine config and job output live in the primary checkout by design:
    # .claude/launch.json, settings*.json, the worktree-cleanup report. This also
    # covers .claude/worktrees/, where the linked worktrees themselves live.
    if f"{os.sep}.claude{os.sep}" in path:
        return False

    return True


# Redirections. The lookbehind keeps fd forms (`2>`, `&>`) out, and `&` is
# excluded from the target so `2>&1` never reads as a file.
REDIRECT_RE = re.compile(r"(?<![0-9&])>>?\s*([^\s;|&<>()]+)")

# Commands whose non-flag arguments are all files they write.
PATH_WRITERS = {"tee", "touch"}

# Commands where only the final argument is the destination — the earlier ones
# are sources being read, and flagging those would block ordinary copies out.
DEST_WRITERS = {"cp", "mv"}

# git subcommands that rewrite working-tree files, paired with the argument that
# confirms it — `git checkout <branch>` is branch movement, `git checkout -- x`
# is a file write. The target is the repo the command runs in, so it is checked
# against the cwd rather than an extracted path.
GIT_TREE_WRITERS = {
    "restore": None,
    "apply": None,
    "checkout": {"--", "--ours", "--theirs", "-f", "--force"},
    "stash": {"pop", "apply"},
    "reset": {"--hard"},
    "clean": {"-f", "-fd", "-fdx", "--force"},
}


def bash_write_targets(command, cwd):
    """Best-effort list of paths a shell command would write."""
    targets = [m.group(1) for m in REDIRECT_RE.finditer(command)]

    try:
        tokens = shlex.split(command)
    except ValueError:
        tokens = command.split()

    for i, token in enumerate(tokens):
        rest = tokens[i + 1 :]

        if token in PATH_WRITERS:
            targets += [a for a in rest if not a.startswith("-")]

        if token in DEST_WRITERS:
            operands = [a for a in rest if not a.startswith("-")]
            if operands:
                targets.append(operands[-1])

        # In-place edit: the files follow the flag.
        if token in {"-i", "--in-place"} or token.startswith("-i."):
            targets += [a for a in rest if not a.startswith("-")]

        if token == "git":
            for sub in rest:
                if sub.startswith("-"):
                    continue
                if sub in GIT_TREE_WRITERS:
                    confirming = GIT_TREE_WRITERS[sub]
                    if confirming is None or confirming & set(rest):
                        targets.append(cwd)
                break

    resolved = []
    for target in targets:
        if not target:
            continue
        full = target if os.path.isabs(target) else os.path.join(cwd, target)
        # Keep only arguments that name a real place. Writers are matched loosely
        # (`sed -i` sweeps up its script expression too), and without this a
        # non-path argument would resolve under cwd and read as a repo write.
        if os.path.exists(full) or os.path.isdir(os.path.dirname(full)):
            resolved.append(full)
    return resolved


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        allow()

    tool_input = payload.get("tool_input") or {}

    if payload.get("tool_name") == "Bash":
        command = tool_input.get("command") or ""
        cwd = payload.get("cwd") or os.getcwd()
        for target in bash_write_targets(command, cwd):
            if is_blocked(target):
                deny(BLOCK_MESSAGE.format(path=os.path.abspath(target)))
        allow()

    path = tool_input.get("file_path") or tool_input.get("notebook_path")
    if not path:
        allow()

    if is_blocked(path):
        deny(BLOCK_MESSAGE.format(path=os.path.abspath(path)))

    allow()


if __name__ == "__main__":
    main()
