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

N_SQ = 225
from fill import Filler, pin, SEEDED, banned_words
from grid import entries, load_wordlist, symmetry


def try_layout(layout, words, seconds, rng, clean=None):
    """Short, repeated attempts beat one long one: the search is randomised, so a
    fresh pin arrangement escapes a bad corner faster than backtracking out of it."""
    end = time.time() + seconds
    tries = 0
    while time.time() < end:
        tries += 1
        f = Filler(layout, words, random.Random(rng.randrange(1 << 30)),
                   min(end, time.time() + 6), clean=clean)
        if not pin(f, f.rng):
            return None, tries
        try:
            if f.solve():
                return f.solution(), tries
        except TimeoutError:
            pass
    return None, tries


def fill_quality(layout, sol, words, curated=None):
    """A valid fill is not a good one. The first grid that verified came back with
    TESSIE, UDALL, LARISSA, RENU, BENE, ANNO, ENS and EOCENE in it — every entry a
    real word, and a joyless puzzle. Obscure proper nouns and crosswordese make a
    grid hard in the cheap way: the solver is not being outwitted, just out-trivia'd.

    So fills are ranked, not merely accepted: how many entries sit at the bottom of
    the score range, then the mean.
    """
    from grid import entries as _ents, is_block as _isb
    letters = []
    k = 0
    for i in range(N_SQ):
        if _isb(layout, i):
            letters.append(None)
        else:
            letters.append(sol[k])
            k += 1
    scores, names = [], 0
    for e in _ents(layout):
        w = "".join(letters[i] for i in e["cells"])
        scores.append(words.get(w, 0))
        # A name or brand: in the full list but not in the curated vocabulary.
        if curated is not None and w not in curated:
            names += 1
    mean = sum(scores) / len(scores)
    if curated is not None:
        # Rank by names first. Banning them outright killed fillability — they hold
        # the grid up — so they are counted and competed down instead.
        return (-names, mean), names, mean
    weak = sum(1 for s in scores if s <= 50)
    return (-weak, mean), weak, mean


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
    # Host slots for the two answers that are not real words. See grid.slot_friction.
    ap.add_argument("--max-host-9", type=int, default=30)
    ap.add_argument("--max-host-10", type=int, default=42)
    ap.add_argument("--max-blocks", type=int, default=G.MAX_BLOCKS)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--out")
    ap.add_argument("--log", help="append every fill found, as JSON lines")
    ap.add_argument("--curated", help="vocabulary to judge fills against; anything "
                                      "outside it counts as a name or brand")
    # Off by default. Ordering clean words first sounds free and is not: the names
    # hold these grids up, so the search exhausts clean subtrees and times out before
    # reaching the entry a slot actually needs. 33 layouts, no fills, with it on.
    ap.add_argument("--prefer-clean", action="store_true")
    args = ap.parse_args()

    # No entry longer than VIEWFINDER.
    G.LONG_FROM, G.MAX_LONG = 11, 0

    words = load_wordlist(args.wordlist, min_score=args.min_score)
    words.update(SEEDED)
    for w in banned_words():
        words.pop(w, None)
    curated = None
    if args.curated:
        curated = load_wordlist(args.curated)
        curated.update(SEEDED)
    print(f"word list {len(words)} at score >= {args.min_score}", file=sys.stderr)

    rng = random.Random(args.seed)
    deadline = time.time() + args.seconds
    tested = filled = 0
    best = None
    seen = set()
    while time.time() < deadline:
        layout = G.grow(rng, args.min_words, args.max_words, args.max_threes,
                        args.max_fours, args.max_interlock, args.max_host_9,
                        args.max_host_10, args.max_blocks)
        if not layout or layout in seen:
            continue
        seen.add(layout)
        tested += 1
        budget = min(args.per_layout, max(1.0, deadline - time.time()))
        sol, tries = try_layout(layout, words, budget, rng,
                                clean=curated if args.prefer_clean else None)
        rank, lens = score_grid(layout)
        status = "FILLED" if sol else "no"
        print(f"[{tested:3}] words={len(entries(layout))} 3s={lens.get(3,0)} "
              f"4s={lens.get(4,0)} max={max(lens)} {status} ({tries} tries)",
              file=sys.stderr, flush=True)
        if not sol:
            continue
        filled += 1
        qrank, weak, mean = fill_quality(layout, sol, words, curated)
        print(f"      fill: {weak} names/brands, mean score {mean:.1f}",
              file=sys.stderr, flush=True)
        if args.log:
            with open(args.log, "a") as fh:
                fh.write(json.dumps({"layout": layout, "solution": sol, "names": weak,
                                     "blocks": layout.count("#"),
                                     "mean": round(mean, 2),
                                     "words": len(entries(layout)),
                                     "threes": lens.get(3, 0)}) + "\n")
        if best is None or qrank > best[0]:
            best = (qrank, layout, sol)
            print(f"      new best fill", file=sys.stderr, flush=True)

    if not best:
        print(f"nothing filled out of {tested} layouts tested", file=sys.stderr)
        return 1
    rank, layout, sol = best
    out = {"layout": layout, "solution": sol,
           "words": len(entries(layout)),
           "lens": {str(k): v for k, v in sorted(score_grid(layout)[1].items())},
           "symmetry": round(100 * symmetry(layout)[0] / 225, 1),
           "blocks": layout.count("#")}
    print(json.dumps(out, indent=2))
    if args.out:
        with open(args.out, "w") as fh:
            json.dump(out, fh, indent=2)
    print(f"{filled} of {tested} layouts filled", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
