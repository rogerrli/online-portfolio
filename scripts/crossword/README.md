# Crossword construction tools

Built for the beta rework of the `/ataliena` puzzle (#123). Alpha's difficulty was
capped by its grid, not its clues: 24 of its 77 entries were three letters, and short
entries fall from one or two crossings however slyly they are clued.

A language model cannot do this part. Every square answers to two entries at once, so
a grid generated a word at a time reads as plausible and has broken crossings that only
a check of all ~64 entries would catch. These three scripts search for the grid and
prove the result instead.

## The word list is not committed

4MB, and CC BY-NC-SA 4.0. Fetch it where the tools can see it:

```bash
curl -sLO https://www.spreadthewordlist.com/downloads/spreadthewordlist_caps.dict
```

[Spread the Word(list)](https://www.spreadthewordlist.com/) — 304,410 answers, scored:
50-55 is good fill, 40-45 questionable, 30 and below stale, thematic or worse. It
includes phrases (PUTITON, GOTTAGO) and proper nouns (DISNEY), which a system
dictionary does not. Default threshold here is 50.

RIVERWALK and SAKURA are absent from it and are injected by `fill.py` as `SEEDED`:
they are the gift, not vocabulary.

## Pipeline

```bash
python3 gen_layout.py --count 6 --seed 23 --quiet          # candidate block patterns
python3 fill.py --layout "<LAYOUT>" --wordlist stwl.dict   # letters for one pattern
python3 verify.py --html ../../public/ataliena/puzzle-beta.html
```

- **`grid.py`** — numbering, entries, runs, symmetry, connectivity. Reproduces the
  derivation in `puzzle.html` exactly, so what the tools measure is what the page
  renders. Keep the numbering rule in step with the page's loop.
- **`gen_layout.py`** — walks 180-degree block pairs, so symmetry holds by
  construction. Targets 58-70 words, at most four three-letter entries and ten
  four-letter, and checks slots exist for the eight fixed answers.
- **`fill.py`** — backtracking over slots, most constrained first, forward checking on
  crossings, random restarts, with the eight answers pinned.
- **`verify.py`** — the gate. Proves every across and down is a real word, and reports
  word count, length histogram, symmetry, scores, unchecked squares and whether
  `MARKED`/`SPECIAL` match where the fixed answers actually landed. Exit 1 on failure.

## Three things that went wrong, so they are not repeated

**Greedy block packing is backwards.** Adding blocks until the word count hits its
maximum maximises blocks, which means 30+ three-letter entries and no long slots left.
Capping *short* entries during the walk is what produces a spine.

**A cap on long entries cannot be enforced during the walk.** An empty 15x15 is thirty
15-letter entries, so the cap rejects the first block and the walk never starts. It
belongs in final acceptance, with the word count.

**MRV must not materialise candidate lists.** Building and filtering every slot's whole
candidate list at every node ran at 22 nodes/second. Counting from the pattern-keyed
cache instead: ~12,000.

Also: `fill.py`'s `BRANCH` cap makes the search incomplete, so a failure means "not
found within these limits", never "no fill exists".
