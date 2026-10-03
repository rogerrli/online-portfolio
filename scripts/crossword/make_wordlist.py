#!/usr/bin/env python3
"""Curate the fill vocabulary, because "valid" and "good" are different things.

The first grid that verified was full of TESSIE, UDALL, LARISSA, SAAB, REALID and
HARRISON — every one a real entry scoring exactly 50, the bottom of Spread the
Word(list)'s "likely good" band, and every one a proper noun or a brand. A puzzle
made of those is hard in the cheap way: the solver is not outwitted, just
out-trivia'd.

Raising the floor to 55 does remove them, and also removes so much vocabulary that
nothing filled at all: 0 of 22 layouts, against 1 of 32 at floor 50. So the floor is
the wrong instrument.

Instead: keep everything at 55 and above, and from the 50 tier keep only what a
dictionary recognises as an English word. That bans the names and brands while
keeping EOCENE and ENURE — crosswordese, but the ordinary kind a solver can reason
about. The result is *larger* than the 55-and-above list (97k against 93k), so it
fills more easily and more cleanly at the same time.

Proper nouns are not banned outright: well-known ones score 55 and above and survive,
which is where DISNEY-grade fill lives.

Usage:
  make_wordlist.py --in stwl.dict --out curated.dict [--dict /usr/share/dict/words]
"""
import argparse
import sys

from grid import load_wordlist

KEEP_ABOVE = 55        # "likely good" and better, kept whatever it is
CHECK_TIER = 50        # kept only if a dictionary knows the word
VOCAB = "vocab"        # banned.txt and approved.txt — Roger's calls


def read_list(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return {l.strip().upper() for l in fh
                    if l.strip() and not l.lstrip().startswith("#")}
    except OSError:
        return set()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="src", default="stwl.dict")
    ap.add_argument("--out", required=True)
    ap.add_argument("--dict", default="/usr/share/dict/words")
    args = ap.parse_args()

    words = load_wordlist(args.src)
    try:
        with open(args.dict, encoding="utf-8", errors="replace") as fh:
            known = {l.strip().upper() for l in fh if l.strip().isalpha()}
    except OSError as e:
        print(f"cannot read {args.dict}: {e}", file=sys.stderr)
        return 1

    import os
    banned_words = read_list(os.path.join(VOCAB, "banned.txt"))
    approved = read_list(os.path.join(VOCAB, "approved.txt"))
    print(f"{len(banned_words)} banned, {len(approved)} approved by hand", file=sys.stderr)

    kept, banned = {}, 0
    for w, s in words.items():
        if w in banned_words:
            continue
        if w in approved or s >= KEEP_ABOVE or (s >= CHECK_TIER and w in known):
            kept[w] = s
        elif s >= CHECK_TIER:
            banned += 1

    with open(args.out, "w", encoding="utf-8") as fh:
        for w in sorted(kept):
            fh.write(f"{w};{kept[w]}\n")
    print(f"{len(kept)} kept, {banned} names and brands dropped from the {CHECK_TIER} tier",
          file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
