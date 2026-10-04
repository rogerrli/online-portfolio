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

`polish.py` is gone. It cleared a weak entry's neighbourhood and re-searched it from the
clean vocabulary, and replaced nothing at either radius — the finding survives in the
table above, which is all it was ever worth.

## What the search actually found, in order

Every plausible-sounding constraint added here made things worse. Recorded so the
same ground is not re-walked:

| Tried | Result |
| --- | --- |
| Score floor 55 (93k words) | 0 fills in 22 layouts |
| Curated list, names dropped (97k) | 0 fills in 18 layouts |
| Local repair of weak entries | 0 of 9 replaced, at radius 1 and radius 2 |
| Clean-first candidate ordering | 0 fills in 33 layouts |
| Host friction capped at 22 | excluded candidate 1, the only grid that filled |
| Full list, floor 50, 6 threes, ranked after | **fills** |

The lesson is the same each time: **the names and brands are load-bearing.** TESSIE and
UDALL are holding up the grid that the good fill sits in, so removing them as a class
removes the fill. They have to be competed down by ranking many fills, not forbidden.

Two numbers that are real constraints rather than preferences:

- Total entry length is twice the white-square count, so ~180 white squares at 68
  words forces a 5.2-letter average. **A high word count and few short entries are
  mutually exclusive.** The first target here (70 words, 4 threes) was unsatisfiable.
- Short entries are where the junk lives: the score-50 non-dictionary tier is mostly
  three- and four-letter abbreviations. Going from 6 threes to 10 roughly doubled the
  names in a fill (9 to 19). Fewer short entries is both the harder grid and the
  cleaner one — they do not trade off.

## Vetting vocabulary

`vocab/banned.txt` and `vocab/approved.txt` hold Roger's calls on individual words, so
the same question is not asked twice and a rebuild cannot reintroduce a rejected word.
Banning a named handful costs no fillability; banning a category costs all of it.

Three tiers, not two:

- **banned** — dropped from the filler's vocabulary outright. Words Roger would never
  accept. Cheap for a named handful, ruinous for a category.
- **in neither list** — usable, but counted against a fill's quality score, so the
  search reaches for it only where a slot leaves no alternative. This is where "fine
  if need be" lives, and where the whole unvetted score-50 tier sits by default.
- **approved** — treated as ordinary vocabulary, no penalty, preferred as readily as
  dictionary words.

Workflow: take the lowest-name fill, review its names one at a time, sort them into
those three, re-run. Each round's calls are permanent, so the floor drops every time.
Chasing a name-free grid did not converge; this does.

## The shipped grid is frozen

`shipped-grid.json` records a SHA-256 of the live `LAYOUT`, `SOL_ENC` and `KEY`, and
`verify.py --frozen-only` fails if the page stops matching. CI runs it on every pull
request; it needs no word list.

This exists because one of those three fails silently. Restoring saved progress checks
only the array's length, so a different block pattern on the same 15x15 board puts her
letters back into cells that now mean something else — a scrambled grid, with nothing
on screen to explain it. The other two are merely bad: a changed `SOL_ENC` makes correct
squares wrong, a changed `KEY` orphans her progress on her own device.

Everything else is fair game while she solves: CSS, the clue bar, keyboard handling,
`MARKED`, `SPECIAL` and all clue text. Her progress is in `localStorage`, not in the
deployed file.

Replacing the grid deliberately means regenerating `shipped-grid.json` — which should
be a deliberate act, and is now impossible to do by accident.

## Where the grid actually lives

`public/ataliena/puzzle.html`, in `LAYOUT` and `SOL_ENC`, and nowhere else. The ten
candidate files this search produced are gone, including the winner: it held the same
layout and solution as the page, which makes it a copy that can drift from the thing it
copies. `verify.py --html` and `clues.py` both read the page, so the page is the source
of truth and the only place a grid is stored.

A future grid comes out of `build.py` as JSON and goes straight into a page via
`emit.py`. There is no reason for it to be kept on disk afterwards.

## Emitting

`emit.py` writes LAYOUT, the encoded solution and the `MARKED`/`SPECIAL` keys into the
page. Those keys must not be typed by hand: **clue numbers move with the block
pattern**, so alpha's 16A/37A/67A/46D/48D/52D/56D mean nothing in a new grid, and a
stale number puts a film icon on the wrong clue and breaks the gift path.

`puzzle-beta.html` carries its own storage key (`-v3`) and deliberately does not inherit
alpha's clue list: 41 of beta's clue numbers collide with alpha's, so inheriting them
would show alpha's clue against beta's answer — wrong, while still looking right.
