#!/usr/bin/env python3
"""Fill a layout from a scored word list, with the eight fixed answers pinned.

This exists because a language model cannot do it. Every square answers to two
entries at once, so a grid generated a word at a time reads as plausible and has
broken crossings that only a check of all ~64 entries would catch. Here the
search either produces a grid where every across and down is a real word, or it
reports failure; verify.py then proves it independently.

Method: backtracking over slots, choosing the most constrained slot first,
with forward checking on crossings, and random restarts. Candidate sets come
from an index keyed by (length, position, letter), intersected per slot and
cached by pattern.

Usage:
  fill.py --layout LAYOUT --wordlist stwl.dict [--seconds 120] [--min-score 50]
"""
import argparse
import collections
import math
import random
import sys
import time

from grid import N, entries, load_wordlist, is_block

# The eight that must appear. RIVERWALK and SAKURA are not in the word list, so
# they are seeded: they are the gift, not vocabulary.
REQUIRED = ["VIEWFINDER", "RIVERWALK", "SAKURA", "DISNEY", "ROGER", "EAST", "STAR", "EMU"]
SEEDED = {"RIVERWALK": 60, "SAKURA": 60}

# Candidates tried per slot. This cap makes the search incomplete, so a False
# means "not found within these limits", never "no fill exists" — which is why
# the driver restarts with a fresh pin arrangement rather than concluding.
BRANCH = 150
LCV_SAMPLE = 24        # candidates ranked by what they leave the crossings
BLANK = "."


class Filler:
    def __init__(self, layout, words, rng, deadline):
        self.layout = layout
        self.rng = rng
        self.deadline = deadline
        self.slots = [e["cells"] for e in entries(layout)]
        self.keys = [e["key"] for e in entries(layout)]
        self.grid = [None if is_block(layout, i) else BLANK for i in range(N * N)]

        self.by_len = collections.defaultdict(list)
        for w, s in words.items():
            self.by_len[len(w)].append((w, s))
        for L in self.by_len:
            self.by_len[L].sort(key=lambda ws: -ws[1])
        self.idx = {}
        for L, ws in self.by_len.items():
            d = collections.defaultdict(set)
            for k, (w, _) in enumerate(ws):
                for p, ch in enumerate(w):
                    d[(p, ch)].add(k)
            self.idx[L] = d

        # Which slots cross which, so a placement can be checked against its
        # neighbours without rescanning the grid.
        cell_slots = collections.defaultdict(list)
        for si, cells in enumerate(self.slots):
            for p, i in enumerate(cells):
                cell_slots[i].append((si, p))
        self.cross = collections.defaultdict(list)
        for i, lst in cell_slots.items():
            for a, pa in lst:
                for b, pb in lst:
                    if a != b:
                        self.cross[a].append((pa, b, pb))

        self.assigned = {}
        self.used = set()
        self.cache = {}
        self.nodes = 0

    # ---- candidates -------------------------------------------------------
    def pattern(self, si):
        return "".join(self.grid[i] for i in self.slots[si])

    def candidates(self, si):
        pat = self.pattern(si)
        L = len(pat)
        key = (L, pat)
        hit = self.cache.get(key)
        if hit is None:
            known = [(p, ch) for p, ch in enumerate(pat) if ch != BLANK]
            pool = self.by_len.get(L, [])
            if not known:
                hit = list(range(len(pool)))
            else:
                sets = []
                for p, ch in known:
                    s = self.idx[L].get((p, ch))
                    if not s:
                        hit = []
                        break
                    sets.append(s)
                else:
                    sets.sort(key=len)
                    acc = set(sets[0])
                    for s in sets[1:]:
                        acc &= s
                        if not acc:
                            break
                    hit = sorted(acc)
            self.cache[key] = hit
        return hit

    def words_for(self, si):
        L = len(self.slots[si])
        pool = self.by_len.get(L, [])
        return [pool[k][0] for k in self.candidates(si) if pool[k][0] not in self.used]

    # ---- search -----------------------------------------------------------
    def place(self, si, word):
        old = []
        for p, i in enumerate(self.slots[si]):
            old.append(self.grid[i])
            self.grid[i] = word[p]
        self.assigned[si] = word
        self.used.add(word)
        return old

    def unplace(self, si, word, old):
        for p, i in enumerate(self.slots[si]):
            self.grid[i] = old[p]
        del self.assigned[si]
        self.used.discard(word)

    def pick_slot(self):
        """Most constrained first: fewest candidates, longest as the tie-break.
        Choosing the easy slots first is what makes this kind of search appear to
        work and then wall into a corner it cannot back out of.

        Counts come from candidates(), which is cached per (length, pattern).
        Calling words_for() here instead — building and filtering every slot's
        whole candidate list at every node — ran at 22 nodes/second."""
        best, best_n = None, None
        for si in range(len(self.slots)):
            if si in self.assigned:
                continue
            n = len(self.candidates(si))
            if n == 0:
                return si, []
            if best_n is None or (n, -len(self.slots[si])) < best_n:
                best, best_n = si, (n, -len(self.slots[si]))
        if best is None:
            return None, None
        return best, self.words_for(best)

    def ok_after(self, si):
        """Crossings only, and counted from the cache. Ignoring `used` here means
        a slot whose sole candidate is already placed is not pruned now; the
        search catches it one level down, which is cheaper than filtering."""
        for _, b, _ in self.cross[si]:
            if b not in self.assigned and not self.candidates(b):
                return False
        return True

    def solve(self):
        if time.time() > self.deadline:
            raise TimeoutError
        si, cands = self.pick_slot()
        if si is None:
            return True
        if not cands:
            return False
        self.nodes += 1
        tier = cands[:BRANCH]
        self.rng.shuffle(tier)
        for w in self.order(si, tier):
            old = self.place(si, w)
            if self.ok_after(si) and self.solve():
                return True
            self.unplace(si, w, old)
        return False

    def order(self, si, tier):
        """Least-constraining value: try the word that leaves its crossings the most
        room. Score ordering alone picks the best *word* and ignores what it does to
        six neighbours, which is how the search ends up thrashing in open grids.

        Only a sample is ranked, since scoring a candidate costs a placement plus a
        pattern lookup per crossing. The sample is whatever the shuffle put in front,
        so restarts rank different subsets.
        """
        if len(tier) <= 2:
            return tier
        head, tail = tier[:LCV_SAMPLE], tier[LCV_SAMPLE:]
        scored = []
        for w in head:
            old = self.place(si, w)
            room = 0
            dead = False
            for _, b, _ in self.cross[si]:
                if b in self.assigned:
                    continue
                n = len(self.candidates(b))
                if n == 0:
                    dead = True
                    break
                room += math.log(n)
            self.unplace(si, w, old)
            if not dead:
                scored.append((room, w))
        scored.sort(key=lambda rw: -rw[0])
        return [w for _, w in scored] + tail

    def solution(self):
        return "".join(ch for ch in self.grid if ch is not None)


def friction(filler, si):
    """How hostile a slot is to an awkward word: how much long crossing it imposes.

    The eight fixed answers are not ordinary fill. RIVERWALK and SAKURA are not even
    in the word list, so every letter they write has to be absorbed by a crossing
    word, and a K or a W landing mid-grid is where a fill dies. Dropped into random
    slots they made three otherwise easy layouts unfillable — those same layouts
    filled in one or two attempts with no pins at all. So the awkward answers go
    where the crossings are shortest and most forgiving.
    """
    return sum(len(filler.slots[b]) - 2 for _, b, _ in filler.cross[si])


def pin(filler, rng, tries=400, friendly=4):
    """Put the eight fixed answers into slots of matching length.

    Drawing eight slots at random and placing them blind does not work: where two
    pinned answers cross, their shared square has to agree, and a random draw
    almost never agrees — the search then died in three nodes. So each placement
    is checked as it goes, both for the letters it writes and for whether every
    crossing slot still has a candidate, and the whole arrangement is redrawn
    when it does not work out.

    Longest first, because the long slots are nearly forced: one 10 and one 9."""
    by_len = collections.defaultdict(list)
    for si, cells in enumerate(filler.slots):
        by_len[len(cells)].append(si)
    rank = {si: friction(filler, si) for si in range(len(filler.slots))}
    order = sorted(REQUIRED, key=len, reverse=True)
    for _ in range(tries):
        placed = []
        for w in order:
            opts = [si for si in by_len[len(w)] if si not in {p[0] for p in placed}]
            # Friendliest few, then shuffled: biased to the gentlest slots while
            # still varying between restarts.
            opts.sort(key=lambda si: rank[si])
            opts = opts[:friendly] if len(opts) > friendly else opts
            rng.shuffle(opts)
            for si in opts:
                pat = filler.pattern(si)
                if any(c != BLANK and c != w[k] for k, c in enumerate(pat)):
                    continue                      # disagrees with a crossing already pinned
                old = filler.place(si, w)
                if filler.ok_after(si):
                    placed.append((si, w, old))
                    break
                filler.unplace(si, w, old)
            else:
                break
        if len(placed) == len(order):
            return True
        for si, w, old in reversed(placed):
            filler.unplace(si, w, old)
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--layout", required=True)
    ap.add_argument("--wordlist", default="stwl.dict")
    ap.add_argument("--min-score", type=int, default=50)
    ap.add_argument("--seconds", type=float, default=120)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--restarts", type=int, default=200)
    args = ap.parse_args()

    words = load_wordlist(args.wordlist, min_score=args.min_score)
    words.update(SEEDED)
    # Two-letter answers are not entries here, and 15s are rare enough to keep.
    print(f"word list: {len(words)} entries at score >= {args.min_score}", file=sys.stderr)

    deadline = time.time() + args.seconds
    rng = random.Random(args.seed)
    attempts = 0
    while time.time() < deadline and attempts < args.restarts:
        attempts += 1
        f = Filler(args.layout, words, random.Random(rng.randrange(1 << 30)), deadline)
        if not pin(f, f.rng):
            print("layout has no slot for one of the fixed answers", file=sys.stderr)
            return 1
        try:
            if f.solve():
                print(f.solution())
                print(f"filled on attempt {attempts} after {f.nodes} nodes", file=sys.stderr)
                return 0
        except TimeoutError:
            pass
    print(f"no fill after {attempts} attempt(s)", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
