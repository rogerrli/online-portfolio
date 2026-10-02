#!/usr/bin/env python3
"""Search layouts and fills together, and keep the ones that actually work.

Designing a layout and then hoping it fills does not work. Generated low-word-count
grids with big open regions failed every time across four cap settings and two score
thresholds, while the same filler completed alpha's own layout in 531 nodes on the
first attempt. The engine was never the problem: openness is. So fillability is
tested here as part of the search, with a short budget per candidate, and a layout
that cannot be filled quickly is thrown away rather than fought.

Entries are capped at ten letters, which leaves VIEWFINDER the longest answer in the
grid — fitting, since it is the one that matters — and avoids the 13s and 15s that
make a grid a fill exercise rather than a puzzle.

Usage:
  build.py --wordlist stwl.dict [--seconds 600] [--per-layout 12] [--out best.json]
"""
import argparse
import collections
import json
import random
import sys
import time

import gen_layout as G
from fill import Filler, pin, SEEDED
from grid import entries, load_wordlist, symmetry


def try_layout(layout, words, seconds, rng):
    """Short, repeated attempts beat one long one: the search is randomised, so a
    fresh pin arrangement escapes a bad corner faster than backtracking out of it."""
    end = time.time() + seconds
    tries = 0
    while time.time() < end:
        tries += 1
        f = Filler(layout, words, random.Random(rng.randrange(1 << 30)), min(end, time.time() + 6))
        if not pin(f, f.rng):
            return None, tries
        try:
            if f.solve():
                return f.solution(), tries
        except TimeoutError:
            pass
    return None, tries


def score_grid(layout):
    """Rank what fills: fewer short entries is the whole point of the rework, and
    near-symmetry is a nice-to-have, so it only breaks ties."""
    ents = entries(layout)
    lens = collections.Counter(len(e["cells"]) for e in ents)
    matched, total, _ = symmetry(layout)
    short = lens.get(3, 0) * 3 + lens.get(4, 0)
    return (-short, len(ents), matched / total), lens


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wordlist", default="stwl.dict")
    ap.add_argument("--min-score", type=int, default=50)
    ap.add_argument("--seconds", type=float, default=600)
    ap.add_argument("--per-layout", type=float, default=12)
    ap.add_argument("--min-words", type=int, default=62)
    ap.add_argument("--max-words", type=int, default=70)
    ap.add_argument("--max-threes", type=int, default=6)
    ap.add_argument("--max-fours", type=int, default=18)
    # Interlock is off by default: it looked like the discriminator and was not.
    # Grids scoring below alpha's 25 still failed, and the same grids filled in one
    # attempt once the pinning was fixed. See grid.interlock.
    ap.add_argument("--max-interlock", type=int, default=99)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--out")
    args = ap.parse_args()

    # No entry longer than VIEWFINDER.
    G.LONG_FROM, G.MAX_LONG = 11, 0

    words = load_wordlist(args.wordlist, min_score=args.min_score)
    words.update(SEEDED)
    print(f"word list {len(words)} at score >= {args.min_score}", file=sys.stderr)

    rng = random.Random(args.seed)
    deadline = time.time() + args.seconds
    tested = filled = 0
    best = None
    seen = set()
    while time.time() < deadline:
        layout = G.grow(rng, args.min_words, args.max_words, args.max_threes,
                        args.max_fours, args.max_interlock)
        if not layout or layout in seen:
            continue
        seen.add(layout)
        tested += 1
        budget = min(args.per_layout, max(1.0, deadline - time.time()))
        sol, tries = try_layout(layout, words, budget, rng)
        rank, lens = score_grid(layout)
        status = "FILLED" if sol else "no"
        print(f"[{tested:3}] words={len(entries(layout))} 3s={lens.get(3,0)} "
              f"4s={lens.get(4,0)} max={max(lens)} {status} ({tries} tries)",
              file=sys.stderr, flush=True)
        if not sol:
            continue
        filled += 1
        if best is None or rank > best[0]:
            best = (rank, layout, sol)
            print(f"      new best: short-score {-rank[0]}", file=sys.stderr, flush=True)

    if not best:
        print(f"nothing filled out of {tested} layouts tested", file=sys.stderr)
        return 1
    rank, layout, sol = best
    out = {"layout": layout, "solution": sol,
           "words": len(entries(layout)),
           "lens": {str(k): v for k, v in sorted(score_grid(layout)[1].items())},
           "symmetry": round(100 * symmetry(layout)[0] / 225, 1)}
    print(json.dumps(out, indent=2))
    if args.out:
        with open(args.out, "w") as fh:
            json.dump(out, fh, indent=2)
    print(f"{filled} of {tested} layouts filled", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
