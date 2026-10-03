#!/usr/bin/env python3
"""Replace the weak entries in a filled grid, one neighbourhood at a time.

Filling the whole grid from a cleaner vocabulary does not work. The curated list
(97k, names and brands dropped) filled nothing in 18 layouts; raising the score
floor to 55 (93k) filled nothing in 22. The only fill that ever landed used the
full 121k list — which means the junk is load-bearing: TESSIE and UDALL are
holding up the grid that the good fill sits in.

So this does not re-fill the grid. It takes a grid that already verifies, and for
each weak entry clears that entry together with everything crossing it, then
searches for a replacement neighbourhood drawn only from the curated list, with
the rest of the grid frozen. A local search over a dozen squares succeeds where
the global one cannot, and a failure costs nothing: the entry simply stays as it
was and the next one is tried.

The eight gift answers are never cleared.

Usage:
  polish.py --grid beta-best.json --wordlist stwl.dict --curated curated.dict
            [--rounds 3] [--seconds-per 20] [--out polished.json]
"""
import argparse
import collections
import json
import random
import sys
import time

from fill import Filler, REQUIRED, SEEDED
from grid import N, entries, is_block, load_wordlist


def letters_of(layout, solution):
    out, k = [], 0
    for i in range(N * N):
        if is_block(layout, i):
            out.append(None)
        else:
            out.append(solution[k])
            k += 1
    return out


def words_in(layout, letters):
    return {e["key"]: "".join(letters[i] for i in e["cells"]) for e in entries(layout)}


def weak_entries(layout, letters, curated):
    """Weak means: not in the curated vocabulary. A gift answer is never weak."""
    out = []
    for key, w in words_in(layout, letters).items():
        if w in REQUIRED:
            continue
        if w not in curated:
            out.append((key, w))
    return out


def repair(layout, letters, target_key, curated, seconds, rng, radius=2):
    """Clear one entry and everything within `radius` crossings of it, then re-search
    that neighbourhood with the rest of the grid frozen.

    Radius 1 — the entry and its direct crossings — replaced nothing: those crossings
    are still pinned at their far ends by frozen words, so the search has to find a
    replacement for every one of them simultaneously under fixed letters, which is
    about as hard as the global fill that already failed. Radius 2 gives the search
    somewhere to put the slack."""
    ents = entries(layout)
    by_key = {e["key"]: idx for idx, e in enumerate(ents)}
    ti = by_key[target_key]
    frozen_words = words_in(layout, letters)

    f = Filler(layout, curated, rng, time.time() + seconds)
    clearing = {ti}
    for _ in range(radius):
        for idx in list(clearing):
            for _, b, _ in f.cross[idx]:
                clearing.add(b)
    # Anything containing a gift answer stays put.
    for idx, e in enumerate(ents):
        if frozen_words[e["key"]] in REQUIRED:
            clearing.discard(idx)

    for idx, e in enumerate(ents):
        if idx in clearing:
            continue
        w = frozen_words[e["key"]]
        pat = f.pattern(idx)
        if any(c != "." and c != w[k] for k, c in enumerate(pat)):
            return None            # frozen neighbours disagree; leave this one alone
        f.place(idx, w)
    try:
        if f.solve():
            return f.solution()
    except TimeoutError:
        pass
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--grid", required=True)
    ap.add_argument("--wordlist", default="stwl.dict")
    ap.add_argument("--curated", required=True)
    ap.add_argument("--rounds", type=int, default=3)
    ap.add_argument("--seconds-per", type=float, default=20)
    ap.add_argument("--out")
    ap.add_argument("--seed", type=int, default=1)
    args = ap.parse_args()

    data = json.load(open(args.grid))
    layout, solution = data["layout"], data["solution"]
    full = load_wordlist(args.wordlist)
    full.update(SEEDED)
    curated = load_wordlist(args.curated)
    curated.update(SEEDED)
    rng = random.Random(args.seed)

    letters = letters_of(layout, solution)
    start = weak_entries(layout, letters, curated)
    print(f"{len(start)} weak entries to start: " +
          ", ".join(f"{k} {w}" for k, w in start), file=sys.stderr)

    fixed, stuck = [], []
    for rnd in range(args.rounds):
        weak = weak_entries(layout, letters, curated)
        if not weak:
            break
        progress = False
        for key, word in weak:
            if (key, word) in stuck:
                continue
            sol = repair(layout, letters, key, curated, args.seconds_per, rng)
            if sol:
                letters = letters_of(layout, sol)
                now = words_in(layout, letters)[key]
                print(f"  round {rnd + 1}: {key} {word} -> {now}", file=sys.stderr, flush=True)
                fixed.append((key, word, now))
                progress = True
            else:
                stuck.append((key, word))
                print(f"  round {rnd + 1}: {key} {word} unchanged", file=sys.stderr, flush=True)
        if not progress:
            break

    remaining = weak_entries(layout, letters, curated)
    sol = "".join(c for c in letters if c is not None)
    out = {"layout": layout, "solution": sol,
           "fixed": [{"key": k, "was": a, "now": b} for k, a, b in fixed],
           "remaining_weak": [{"key": k, "word": w} for k, w in remaining]}
    print(json.dumps(out, indent=2))
    if args.out:
        json.dump(out, open(args.out, "w"), indent=2)
    print(f"{len(fixed)} replaced, {len(remaining)} weak entries left", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
