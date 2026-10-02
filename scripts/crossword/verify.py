#!/usr/bin/env python3
"""Prove a grid is sound. Nothing downstream should be trusted without this.

A filled 15x15 has ~70 entries and every square answers to two of them, so a
broken crossing is invisible to inspection. This checks each one against the
word list and reports the structure a Friday puzzle is judged on.

Usage:
  verify.py --html public/ataliena/puzzle-beta.html [--wordlist PATH]
  verify.py --layout LAYOUT --solution LETTERS [--wordlist PATH]

Exit status is 1 if any hard check fails, so it can gate a commit.
"""
import argparse
import base64
import collections
import re
import sys

from grid import N, entries, runs, symmetry, connected, load_wordlist, is_block

REQUIRED = {
    "VIEWFINDER": "SPECIAL, star icon, highlighted squares",
    "RIVERWALK": "film icon",
    "SAKURA": "film icon",
    "DISNEY": "film icon",
    "ROGER": "film icon",
    "EAST": "film icon",
    "STAR": "film icon",
    "EMU": "film icon",
}
MAX_WORDS = 70
MAX_THREES = 4


def rot13(s):
    out = []
    for ch in s:
        if "A" <= ch <= "Z":
            out.append(chr((ord(ch) - 52) % 26 + 65))
        else:
            out.append(ch)
    return "".join(out)


def from_html(path):
    src = open(path, encoding="utf-8").read()
    layout = re.search(r'const LAYOUT="([^"]*)"', src).group(1)
    enc = re.search(r'const SOL_ENC="([^"]*)"', src).group(1)
    letters = rot13(base64.b64decode(enc).decode("utf-8"))
    marked = re.search(r"const MARKED = (\[[^\]]*\])", src)
    special = re.search(r'const SPECIAL = "([^"]+)"', src)
    clues = re.search(r"const CLUES = \{(.*?)\n\};", src, re.S)
    clue_keys = set(re.findall(r'"(\d+[AD])":', clues.group(1))) if clues else set()
    return {
        "layout": layout,
        "letters": letters,
        "marked": re.findall(r'"(\d+[AD])"', marked.group(1)) if marked else [],
        "special": special.group(1) if special else None,
        "clue_keys": clue_keys,
    }


def solution_grid(layout, letters):
    """Letters are stored for white squares only, in reading order."""
    sol, k = [], 0
    for i in range(N * N):
        if is_block(layout, i):
            sol.append(None)
        else:
            sol.append(letters[k] if k < len(letters) else "?")
            k += 1
    return sol, k


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--html")
    ap.add_argument("--layout")
    ap.add_argument("--solution")
    ap.add_argument("--wordlist", default="stwl.dict")
    ap.add_argument("--min-score", type=int, default=40)
    args = ap.parse_args()

    if args.html:
        data = from_html(args.html)
        layout, letters = data["layout"], data["letters"]
    else:
        data = {"marked": [], "special": None, "clue_keys": set()}
        layout, letters = args.layout, args.solution.upper()

    fail = []
    note = []

    if len(layout) != N * N:
        print(f"FAIL layout is {len(layout)} chars, expected {N * N}")
        return 1

    sol, used = solution_grid(layout, letters)
    white = sum(1 for i in range(N * N) if not is_block(layout, i))
    if used != white or len(letters) != white:
        fail.append(f"solution has {len(letters)} letters for {white} white squares")

    try:
        words = load_wordlist(args.wordlist)
    except OSError as e:
        print(f"FAIL cannot read word list: {e}")
        print("  Spread the Word(list), CC BY-NC-SA 4.0:")
        print("  curl -sLO https://www.spreadthewordlist.com/downloads/spreadthewordlist_caps.dict")
        return 1

    # Every run, including the short ones entries() hides, must be a real word.
    ents = entries(layout)
    seen = collections.Counter()
    bad_words, low = [], []
    for d, cells in runs(layout):
        if len(cells) < 2:
            fail.append(f"isolated white square at r{cells[0] // N + 1}c{cells[0] % N + 1}")
            continue
        w = "".join(sol[i] or "?" for i in cells)
        seen[w] += 1
        score = words.get(w)
        if score is None:
            bad_words.append((d, w, cells[0]))
        elif score < args.min_score:
            low.append((w, score))

    dupes = [w for w, c in seen.items() if c > 1]
    if bad_words:
        for d, w, i in bad_words:
            fail.append(f"{d} entry {w!r} at r{i // N + 1}c{i % N + 1} is not in the word list")
    if dupes:
        fail.append(f"duplicate answers: {', '.join(sorted(dupes))}")

    lens = collections.Counter(len(e["cells"]) for e in ents)
    threes = lens.get(3, 0)
    if len(ents) > MAX_WORDS:
        fail.append(f"{len(ents)} words, target is {MAX_WORDS} or fewer")
    if threes > MAX_THREES:
        fail.append(f"{threes} three-letter entries, target is {MAX_THREES} or fewer")

    by_word = {}
    for e in ents:
        by_word["".join(sol[i] or "?" for i in e["cells"])] = e["key"]
    for w, role in REQUIRED.items():
        if w not in by_word:
            fail.append(f"required answer {w} ({role}) is missing")

    if not connected(layout):
        fail.append("white squares are not all connected")

    # Unchecked squares: a cell in only one direction is never confirmed by a
    # crossing, which makes it a guess rather than a deduction.
    in_dir = {"A": set(), "D": set()}
    for e in ents:
        in_dir[e["dir"]].update(e["cells"])
    unchecked = [i for i in range(N * N) if not is_block(layout, i) and not (i in in_dir["A"] and i in in_dir["D"])]
    if unchecked:
        fail.append(f"{len(unchecked)} unchecked squares (in one direction only)")

    matched, total, _ = symmetry(layout)
    pct = 100.0 * matched / total

    print(f"words            {len(ents)}  (target <= {MAX_WORDS})")
    print(f"length histogram {dict(sorted(lens.items()))}")
    print(f"three-letter     {threes}  (target <= {MAX_THREES})")
    print(f"blocks           {sum(1 for ch in layout if ch == '#')} of {N * N}")
    print(f"symmetry         {pct:.1f}% of squares match under 180 rotation")
    print(f"white squares    {white}")
    if low:
        note.append(f"{len(low)} entries scored under {args.min_score}: " +
                    ", ".join(f"{w}({s})" for w, s in sorted(low, key=lambda x: x[1])[:12]))
    present = [f"{by_word[w]} {w}" for w in REQUIRED if w in by_word]
    print(f"required answers {len(present)}/8  {', '.join(present)}")

    if data.get("special") or data.get("marked"):
        want = {by_word[w] for w in REQUIRED if w in by_word}
        have = set(data["marked"]) | ({data["special"]} if data["special"] else set())
        if want != have:
            fail.append(f"MARKED/SPECIAL keys {sorted(have)} do not match where the "
                        f"required answers actually landed: {sorted(want)}")
    if data.get("clue_keys"):
        missing = [e["key"] for e in ents if e["key"] not in data["clue_keys"]]
        if missing:
            note.append(f"{len(missing)} entries have no clue yet: {', '.join(missing[:14])}")

    for n_ in note:
        print(f"note  {n_}")
    for f in fail:
        print(f"FAIL  {f}")
    print("OK" if not fail else f"{len(fail)} problem(s)")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
