#!/usr/bin/env python3
"""Search block patterns that could carry a Friday-difficulty 15x15.

Blocks go in as 180-degree rotational pairs, which is what makes a grid look
like a crossword, and the search simply never breaks the pairing — symmetry
comes out free here. Relaxing it is for the filler, which is where the original
attempt gridlocked; a pattern that cannot be filled is cheap to throw away at
this stage.

Hard constraints, all of which exist to keep the grid solvable rather than
merely legal:
  - no run shorter than three, which also guarantees no unchecked squares,
    since a cell in a run of one is confirmed by nothing
  - all white squares connected
  - word count within range, and few enough three-letter entries
  - slots available for the eight fixed answers: 10, 9, 6, 6, 5, 4, 4, 3

Usage: gen_layout.py [--count 8] [--seed 1] [--min-words 62] [--max-words 70]
"""
import argparse
import collections
import random

from grid import N, entries, runs, connected, interlock


def runs_ok(layout):
    """Cheap feasibility test used during the walk: no run under three yet. A run
    of one or two also means unchecked squares, which are guesses, not
    deductions."""
    return all(len(cells) >= 3 for _, cells in runs(layout))

NEEDED_LENS = [10, 9, 6, 6, 5, 4, 4, 3]
MAX_THREES = 4


MAX_FOURS = 14        # NYT Fridays run well above ten; ten starved the fill
MAX_LONG = 1          # entries of 12+; stacked 15s are showcase grids, not Fridays
MAX_INTERLOCK = 34    # see grid.interlock: above ~38 nothing fills
LONG_FROM = 12


def profile(layout):
    ents = entries(layout)
    return len(ents), collections.Counter(len(e["cells"]) for e in ents)


def has_slots_for(lens):
    """The eight fixed answers need eight distinct slots of the right lengths."""
    pool = collections.Counter(lens)
    for want in NEEDED_LENS:
        if pool.get(want, 0) <= 0:
            return False
        pool[want] -= 1
    return True


def accept(layout, min_words, max_words, max_threes=MAX_THREES, max_fours=MAX_FOURS,
           max_interlock=MAX_INTERLOCK):
    """Final acceptance. Separate from the walk because some of these only become
    true as blocks go in: an empty grid is thirty 15-letter entries, so a cap on
    long entries would reject the very first block and the walk would never
    start."""
    words, lens = profile(layout)
    if not (min_words <= words <= max_words):
        return False
    if lens.get(3, 0) > max_threes or lens.get(4, 0) > max_fours:
        return False
    if sum(v for k, v in lens.items() if k >= LONG_FROM) > MAX_LONG:
        return False
    if interlock(layout) > max_interlock:
        return False
    return has_slots_for(lens)


def grow(rng, min_words, max_words, max_threes=MAX_THREES, max_fours=MAX_FOURS,
         max_interlock=MAX_INTERLOCK):
    """Add 180-degree block pairs in random order, keeping only the constraints
    that a partly built grid can satisfy. Blocks are never placed singly, so
    symmetry holds by construction; the filler is where it may have to give.

    Greedily packing blocks until the word count hits its maximum was the first
    thing tried and it is wrong: it maximises blocks, which means three-letter
    entries everywhere (30+) and no long slots left. Capping the short entries
    during the walk is what produces a spine."""
    layout = ["."] * (N * N)
    spots = list(range(N * N))
    rng.shuffle(spots)
    for i in spots:
        j = N * N - 1 - i
        if layout[i] == "#" or layout[j] == "#":
            continue
        layout[i] = layout[j] = "#"
        s = "".join(layout)
        if not runs_ok(s) or not connected(s):
            layout[i] = layout[j] = "."
            continue
        words, lens = profile(s)
        if words > max_words or lens.get(3, 0) > max_threes or lens.get(4, 0) > max_fours:
            layout[i] = layout[j] = "."
    s = "".join(layout)
    return s if accept(s, min_words, max_words, max_threes, max_fours, max_interlock) else None


def show(layout):
    for r in range(N):
        print("  " + " ".join("#" if layout[r * N + c] == "#" else "." for c in range(N)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=8)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--min-words", type=int, default=66)
    ap.add_argument("--max-threes", type=int, default=MAX_THREES)
    ap.add_argument("--max-fours", type=int, default=MAX_FOURS)
    ap.add_argument("--max-words", type=int, default=70)
    ap.add_argument("--attempts", type=int, default=400)
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    rng = random.Random(args.seed)
    found, seen = [], set()
    for _ in range(args.attempts):
        if len(found) >= args.count:
            break
        s = grow(rng, args.min_words, args.max_words, args.max_threes, args.max_fours)
        if s and s not in seen:
            seen.add(s)
            found.append(s)

    for s in found:
        ents = entries(s)
        lens = collections.Counter(len(e["cells"]) for e in ents)
        print(f"{s}")
        print(f"  words={len(ents)} threes={lens.get(3, 0)} blocks={s.count('#')} "
              f"lens={dict(sorted(lens.items()))}")
        if not args.quiet:
            show(s)
    if not found:
        print("no layout met the constraints; widen the word range or raise --attempts")
    return 0 if found else 1


if __name__ == "__main__":
    raise SystemExit(main())
