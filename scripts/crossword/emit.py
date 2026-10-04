#!/usr/bin/env python3
"""Write a chosen grid into the beta page.

Does the one job by hand that must not be done by hand: LAYOUT, the encoded
solution, and the MARKED/SPECIAL keys all have to agree with each other, and the
clue numbers in MARKED are not the numbers the old grid used — they move with the
block pattern. Typing them is how the film icons end up on the wrong clues.

The page decodes the solution as rot13(base64-decode(SOL_ENC)), so this encodes it
the same way round: rot13 is its own inverse.

Clues are left alone. Entries without one show as "Clue to come", which is the
page's own placeholder, so an unfinished beta is still solvable and visibly
unfinished.

Usage:
  emit.py --grid best.json --page ../../public/ataliena/puzzle-beta.html
          [--title "..."] [--check]
"""
import argparse
import base64
import json
import re
import sys

from grid import N, entries, is_block

FILM = ["RIVERWALK", "SAKURA", "DISNEY", "ROGER", "EAST", "STAR", "EMU"]
STAR = "VIEWFINDER"


def rot13(s):
    return "".join(chr((ord(c) - 52) % 26 + 65) if "A" <= c <= "Z" else c for c in s)


def keys_for(layout, solution):
    """Where each gift answer actually landed, by clue key."""
    letters, k = [], 0
    for i in range(N * N):
        if is_block(layout, i):
            letters.append(None)
        else:
            letters.append(solution[k])
            k += 1
    found = {}
    for e in entries(layout):
        w = "".join(letters[i] for i in e["cells"])
        if w in FILM or w == STAR:
            found[w] = e["key"]
    missing = [w for w in FILM + [STAR] if w not in found]
    if missing:
        raise SystemExit(f"grid is missing {', '.join(missing)} — refusing to emit")
    return [found[w] for w in FILM], found[STAR]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--grid", required=True)
    ap.add_argument("--page", required=True)
    ap.add_argument("--title")
    ap.add_argument("--check", action="store_true", help="report, write nothing")
    args = ap.parse_args()

    data = json.load(open(args.grid))
    layout, solution = data["layout"], data["solution"]
    white = sum(1 for i in range(N * N) if not is_block(layout, i))
    if len(layout) != N * N or len(solution) != white:
        raise SystemExit(f"grid is inconsistent: {len(layout)} cells, {len(solution)} "
                         f"letters for {white} white squares")

    marked, special = keys_for(layout, solution)
    enc = base64.b64encode(rot13(solution).encode()).decode()

    print(f"MARKED  {marked}")
    print(f"SPECIAL {special}")
    if args.check:
        return 0

    src = open(args.page, encoding="utf-8").read()
    subs = [
        (r'const LAYOUT="[^"]*"', f'const LAYOUT="{layout}"'),
        (r'const SOL_ENC="[^"]*"', f'const SOL_ENC="{enc}"'),
        (r'const MARKED = \[[^\]]*\]', "const MARKED = " + json.dumps(marked).replace('"', '"')),
        (r'const SPECIAL = "[^"]*"', f'const SPECIAL = "{special}"'),
    ]
    if args.title:
        subs.append((r'const TITLE = "[^"]*"', f'const TITLE = "{args.title}"'))
    for pat, rep in subs:
        if len(re.findall(pat, src)) != 1:
            raise SystemExit(f"expected exactly one match for {pat}")
        src = re.sub(pat, lambda _m, r=rep: r, src)
    open(args.page, "w", encoding="utf-8").write(src)
    print(f"wrote {args.page}; verify it before trusting it")
    return 0


if __name__ == "__main__":
    sys.exit(main())
