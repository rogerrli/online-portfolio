"""Shared grid mechanics for the /ataliena crossword tools.

The puzzle itself derives numbering, entries and crossings from LAYOUT at load
time. These functions reproduce that derivation exactly, so what the tools
measure is what the page will render. Keep them in step: the numbering rule in
`entries()` mirrors the loop in public/ataliena/puzzle.html.
"""

N = 15
BLOCK = "#"


def is_block(layout, i):
    return layout[i] == BLOCK


def entries(layout, n=N):
    """Numbered entries, in the same order and with the same numbers as the page.

    An entry starts where a run begins and the run is at least two cells long,
    which is the page's rule: a cell starts an Across if nothing is to its left
    and something is to its right, and likewise downward.
    """
    out = []
    num = 0
    for r in range(n):
        for c in range(n):
            i = r * n + c
            if is_block(layout, i):
                continue
            starts_a = (c == 0 or is_block(layout, i - 1)) and c < n - 1 and not is_block(layout, i + 1)
            starts_d = (r == 0 or is_block(layout, i - n)) and r < n - 1 and not is_block(layout, i + n)
            if not (starts_a or starts_d):
                continue
            num += 1
            if starts_a:
                cells = []
                x = c
                while x < n and not is_block(layout, r * n + x):
                    cells.append(r * n + x)
                    x += 1
                out.append({"key": f"{num}A", "n": num, "dir": "A", "cells": cells})
            if starts_d:
                cells = []
                y = r
                while y < n and not is_block(layout, y * n + c):
                    cells.append(y * n + c)
                    y += 1
                out.append({"key": f"{num}D", "n": num, "dir": "D", "cells": cells})
    return out


def runs(layout, n=N):
    """Every maximal white run in both directions, including length-1 and -2 ones.

    entries() skips runs shorter than two cells the way the page does, which
    would hide a stray single white square. The verifier wants to see those.
    """
    out = []
    for r in range(n):
        row = [r * n + c for c in range(n)]
        out.extend(_split(layout, row, "A"))
    for c in range(n):
        col = [r * n + c for r in range(n)]
        out.extend(_split(layout, col, "D"))
    return out


def _split(layout, line, d):
    out, cur = [], []
    for i in line:
        if is_block(layout, i):
            if cur:
                out.append((d, cur))
            cur = []
        else:
            cur.append(i)
    if cur:
        out.append((d, cur))
    return out


def symmetry(layout, n=N):
    """How close the block pattern is to 180-degree rotational symmetry.

    Returns (matched, total, unmatched_indices). Symmetry is a nice-to-have
    here, so this reports a number rather than passing or failing.
    """
    total = n * n
    bad = [i for i in range(total) if is_block(layout, i) != is_block(layout, total - 1 - i)]
    return total - len(bad), total, bad


def connected(layout, n=N):
    """True when all white cells form one region. A detached pocket is unsolvable
    in practice: nothing in it crosses anything the rest of the grid reaches."""
    white = [i for i in range(n * n) if not is_block(layout, i)]
    if not white:
        return True
    seen, stack = {white[0]}, [white[0]]
    while stack:
        i = stack.pop()
        r, c = divmod(i, n)
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            rr, cc = r + dr, c + dc
            if 0 <= rr < n and 0 <= cc < n:
                j = rr * n + cc
                if j not in seen and not is_block(layout, j):
                    seen.add(j)
                    stack.append(j)
    return len(seen) == len(white)


def spans(layout, n=N):
    """Per white cell, the length of its Across and Down entry."""
    sp = {}
    for e in entries(layout, n):
        for i in e["cells"]:
            sp.setdefault(i, {})[e["dir"]] = len(e["cells"])
    return sp


def slot_friction(layout, cells, direction, sp=None):
    """How much long crossing a slot imposes on whatever goes in it.

    This is the number that decides whether the gift answers can be placed.
    RIVERWALK and SAKURA are not in any word list, so every letter they write has
    to be absorbed by a crossing word. Alpha hosts RIVERWALK at friction 19, which
    is why its K and W work; dropped into friction-25 slots the same word made
    otherwise easy grids unfillable.
    """
    sp = sp or spans(layout, n=N)
    other = "D" if direction == "A" else "A"
    return sum(sp[i].get(other, 0) - 2 for i in cells)


def host_friction(layout, length, n=N):
    """The gentlest slot of a given length, or None if there is none."""
    sp = spans(layout, n)
    vals = [slot_friction(layout, e["cells"], e["dir"], sp)
            for e in entries(layout, n) if len(e["cells"]) == length]
    return min(vals) if vals else None


def interlock(layout, n=N, minlen=6):
    """Squares where both the Across and the Down entry are at least `minlen` long.

    This is what predicts whether a grid can be filled, and nothing else measured
    here came close. Alpha scores 25 and fills on the first attempt; generated
    grids scoring 40 to 52 never filled, across every cap setting and both score
    thresholds. Long entries are not the problem — long entries crossing other
    long entries are, because each one has to agree with six or more neighbours
    at once.
    """
    span = {}
    for e in entries(layout, n):
        for i in e["cells"]:
            span.setdefault(i, {})[e["dir"]] = len(e["cells"])
    return sum(1 for d in span.values()
               if d.get("A", 0) >= minlen and d.get("D", 0) >= minlen)


def load_wordlist(path, min_score=0):
    """Spread the Word(list) format: WORD;SCORE per line, uppercase A-Z only."""
    words = {}
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line or ";" not in line:
                continue
            w, _, s = line.partition(";")
            w = w.strip().upper()
            if not w.isalpha():
                continue
            try:
                score = int(s)
            except ValueError:
                continue
            if score < min_score:
                continue
            if words.get(w, -1) < score:
                words[w] = score
    return words
