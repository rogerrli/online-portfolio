# The /ataliena crossword

A crossword puzzle served at `https://liroger.com/ataliena`, handed out via a
printed QR code, behind a compass "Log in". Unlisted: nothing on the portfolio
links to it, and both pages carry `<meta name="robots" content="noindex, nofollow">`.

## The two pages

| File | Role |
| --- | --- |
| `public/ataliena/index.html` | The Cassiopeia login gate. |
| `public/ataliena/puzzle.html` | The crossword. |

`vercel.json` rewrites bare `/ataliena` to `index.html` and `/ataliena/puzzle` to
`puzzle.html`. Resolving a bare path would otherwise depend on host-specific
directory-index behaviour, and `/ataliena` is baked into a printed QR code that
can't be reissued, so it's stated explicitly.

The puzzle is deliberately *not* ported to React — it stays a single dependency-free
file, edited in place.

## Crossword interaction

Modelled on the NYT app:

- Tapping a square selects its clue in the current direction; tapping that square again
  flips direction, as does the spacebar. Tapping the clue bar does one of two things: with
  the keyboard down it only summons it (flipping there moved you to the crossing clue just
  for asking for the keyboard), and with the keyboard already up it flips direction. Focus
  on the hidden `#kb` input is the signal, read on `mousedown` because by click time the
  tap has already moved it; that same handler calls `preventDefault` so focus stays put and
  the keyboard doesn't dismiss and re-summon. Arrows at either end of the
  bar step through the entries, and span its full height — they are tap targets, so they
  are sized like one (~51x53px). They walk the clue *lists* (every Across, then every
  Down), not `entries[]`, which is built in grid order and interleaves the two: stepping
  through it sent you from 1 Across straight to 1 Down. The bar shows only the clue text;
  the highlighted word in the grid is what tells you the direction.
- **Switching clue always lands on that clue's first empty square**, whether you got there
  by arrow, by the clue list, or by flipping direction. `firstEmpty()` is deliberately not
  folded into `toggle()`: tapping a *different* square should leave you on the square you
  tapped, and `curEntry()` flips direction only to find a valid entry.
- Every `:hover` rule is behind `@media (hover:hover)`. A phone leaves `:hover` stuck on
  whatever it last tapped, which read as the button staying selected after a tap.
- **The clue bar is pinned above the keyboard on a phone.** The on-screen keyboard covers
  the bottom of the *layout* viewport but not the *visual* one, so the gap between them is
  the keyboard's height; a `visualViewport` listener writes that into `--kb` and the bar
  lifts by it. Without this the bar sits underneath the keyboard. On a desktop there is no
  keyboard to ride above, so it goes back to being a block above the grid.
- Each clue in the list shows the answer so far, redrawn only when it actually changed —
  `render()` runs on every keystroke and there are ~160 entries.
- **Squares are a fixed size.** Both axes are `repeat(15, minmax(0,1fr))`. With no explicit
  `grid-template-rows` the rows were implicit and content-sized, so one letter took its row
  from 21px to 38px while the rest shrank; a bare `1fr` is not enough either, since it still
  floors at min-content.
- The arrows skip entries that are already full, so running off the end of the unsolved
  Acrosses lands on the first unsolved Down, and vice versa. Because `navOrder` wraps, the
  "no unsolved clues the other way" case falls out for free. (In this grid every square is
  checked both ways, so that case can't actually arise — a gap always unsolves both its
  Across and its Down.)
- Clearing the puzzle sits alone at the very bottom, error-themed, behind a confirm().

## The clock

Time spent lives under its own key, `…-v2-time`, deliberately separate from the grid:
**clearing the puzzle starts the grid over but not the time already spent on it.** It only
counts while the tab is actually in front (`visibilitychange`), and stops for good once
every square is right, turning gold — so it reads as a solve time rather than a stopwatch
left running. It is written to storage once a second, so a crash costs at most a second.

The gate navigates to the puzzle by **absolute** path (`/ataliena/puzzle.html`), and must
keep doing so. The QR points at `/ataliena` with no trailing slash, so a relative
`puzzle.html` resolves against `/` and lands on `/puzzle.html` — nowhere. Loading the gate
as `/ataliena/index.html` hides the bug, because the relative form resolves correctly from
there; test the bare URL.

## The gate

### Daylight

If the device explicitly reports light mode, the gate holds her at the door: the title, a
washed-out constellation, and *"It's a bit light out to see the stars."* No instruction —
the faded stars are the hint. Nothing is armed while it's up, so no sensors run and no
permission is requested. It's plain CSS plus one `matchMedia` listener, so turning dark
mode on swaps straight to the night sky with no reload, which is the reward for working it
out. "No preference" is not light, and falls through to the sky as normal.

There is no password and no text input. **The login is pointing the phone north.**

1. **Tap to start.** Nothing but the words, on the starfield. This screen exists
   because iOS will not hand over compass data outside a user gesture —
   `DeviceOrientationEvent.requestPermission()` must be called from a real tap. Every
   platform shows it so the experience doesn't fork; on Android the tap just starts it.
2. **Log in.** The title and a dim Cassiopeia. No instructions, by design.
3. **The hold.** Heading within **±10°** of north, tilt within **±25°** of flat, both
   sustained for **3 seconds**.
4. **The payoff.** Stars go to full brightness, the constellation lines draw in, and a
   **Next** button appears. Nothing auto-advances.

### How she is meant to work it out

The stars are the only feedback, and they answer continuously: brightness ramps from
70° off north up to the tolerance, and is damped to a fraction of that while the phone
is tilted. Getting warmer is visible without a word being written, which is what makes
a wordless gate solvable rather than merely opaque.

### Platform notes

- iOS exposes `webkitCompassHeading` (degrees clockwise from north). Android has no
  such property and needs the `deviceorientationabsolute` event, where the heading is
  `360 - alpha`. Both are handled; readings are smoothed, since raw compass output
  jitters by several degrees.
- Requiring the phone to be level is not only flavour — heading derived from `alpha` is
  unstable when the device is upright, so insisting on flat genuinely improves accuracy.
- A reading older than 900ms doesn't count toward the hold, so a stalled sensor or a
  backgrounded page can't let a stale "pointing north" quietly finish the login.
- Compensating for screen rotation is **not** implemented; the gate assumes she is
  holding the phone in portrait.

### There is no way past it

The gate is absolute: pointing north is the only way in. If the compass is denied or
missing, the page says so and stops there — no bypass, no escape hatch. The only
recovery is granting motion & orientation access and reloading.

## Progress, and why the origin is fixed

The puzzle saves itself: on every keystroke it writes `{fill: [...]}` to `localStorage`
under `gift-crossword-first-impressions-v2`, and rehydrates on load.

**The login is deliberately not remembered.** Every visit goes through the constellation
again — the gate stores nothing and there is no "already unlocked" shortcut. Her crossword
answers are untouched by this: that is a separate key, written by the puzzle itself, so
she re-earns the way in but never loses a square.

The grid is per-origin, with two consequences:

- **The origin must not change once the QR is printed.** Moving the puzzle orphans every
  saved grid.
- It doesn't follow her across devices, browsers, or a private window, and clearing site
  data wipes it. Cross-device sync would need a backend; for one recipient it isn't worth one.

## Test hooks

Query parameters on the gate, none of which appear in the QR:

| Param | Effect |
| --- | --- |
| `?debug=1` | Live readout of event name, heading, beta, gamma, glow and hold time. **Use this to field-test on a real phone.** |
| `?preview=1` | Plays the success animation without a compass. |
| `?force=1` | Skips the mobile-only check (desktop has no compass, so it will just sit there). |

## Regenerating the QR code

`docs/ataliena-qr.svg` is vector, so it scales to any print size. Reissue it only if the
URL changes — which also orphans saved progress, see above:

```bash
npx -y qrcode@1 -t svg -o docs/ataliena-qr.svg -e M -m 4 "https://liroger.com/ataliena"
```

`-e M` is ~15% error correction, enough to survive ordinary print and scuffing. Verify
any regenerated code actually decodes before printing it.
