# The /ataliena crossword

A crossword puzzle served at `https://liroger.com/ataliena`, handed out via a
printed QR code, behind a star-sighting "Log in". Unlisted: nothing on the portfolio
links to it, and both pages carry `<meta name="robots" content="noindex, nofollow">`.

## The two pages

| File | Role |
| --- | --- |
| `public/ataliena/index.html` | The Orion login gate. |
| `public/ataliena/puzzle.html` | The crossword. |

`vercel.json` rewrites bare `/ataliena` to `index.html` and `/ataliena/puzzle` to
`puzzle.html`. Resolving a bare path would otherwise depend on host-specific
directory-index behaviour, and `/ataliena` is baked into a printed QR code that
can't be reissued, so it's stated explicitly.

The puzzle is deliberately *not* ported to React — it stays a single dependency-free
file, edited in place.

## Alpha and beta

`public/ataliena/puzzle-alpha.html` is a frozen copy of the puzzle as it stood once the
clue-difficulty pass finished, served at `/ataliena/puzzle-alpha`. It exists so a harder
rework can be attempted without risking the version that is known to work: if the rework
never lands, the gate keeps pointing at `puzzle.html` and nothing is lost. Git tag
`puzzle-alpha` marks the same state.

Alpha is not maintained. Fixes to the engine go into `puzzle.html`; alpha is a fallback,
not a second product.

**A reworked grid must change `KEY`.** Restoring progress only checks the saved array's
length:

```js
if(s&&s.fill&&s.fill.length===N*N)fill=s.fill;
```

A new `LAYOUT` on the same 15x15 board produces a saved array of exactly the same length,
so old letters would be restored into cells that now mean something else — scattered
letters in a grid she never typed them into, with no error and nothing to explain it.
Any change to `LAYOUT` or `SOL_ENC` therefore needs a new `KEY` (`-v3`, and so on). Two
puzzles served from the same origin need different keys for the same reason: alpha keeps
`-v2`.

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

Where it sits in the hunt: the QR code leads here, the gate opens the crossword, and the
box with the message in it comes **later**. So the gate runs before the box, not after, and
it is deliberately *not* the box's own puzzle. The box's lid is Cassiopeia and Polaris; the
gate is Orion and the east. Same verb — aim the phone at where a constellation really sits —
different noun, so she arrives at the box already knowing that a lid full of dots is telling
her which way to turn, without having been handed the answer.

### Daylight

If the device explicitly reports light mode, the gate holds her at the door: the title, a
washed-out constellation, and *"It's a bit light out to see the stars."* No instruction —
the faded stars are the hint. Nothing is armed while it's up, so no sensors run and no
permission is requested. It's plain CSS plus one `matchMedia` listener, so turning dark
mode on swaps straight to the night sky with no reload, which is the reward for working it
out. "No preference" is not light, and falls through to the sky as normal.

There is no password and no text input. **The login is facing where Orion's Belt rises.**

1. **Tap to start.** Nothing but the words, on the starfield. This screen exists
   because iOS will not hand over compass data outside a user gesture —
   `DeviceOrientationEvent.requestPermission()` must be called from a real tap. Every
   platform shows it so the experience doesn't fork; on Android the tap just starts it.
2. **Log in.** The title, a small ring at the centre of the screen, and a sky. No
   instructions, by design.
3. **The hold.** Heading within **±10°** and elevation within **±10°** of the belt, for
   **5 seconds** — accumulated, not consecutive. See *Holding still on a shaky reading*.
4. **The payoff.** Stars go to full brightness, the whole figure is drawn, and a **Next**
   button appears. Nothing auto-advances.

### A window, not a dial

The screen is a window onto the sky rather than a meter. Orion is pinned to its real
position: turn and the stars pan the other way, tilt and they slide, roll the phone and they
counter-rotate so the horizon stays level. Face the wrong way and the hunter is simply not
on screen.

And the sky he is hiding in is the **real** one — see *The star field* — so sweeping past is
sweeping past Taurus and the Pleiades, Auriga, Pegasus. Below the horizon line there is
nothing at all, because below the horizon there is ground.

The phone is held at a **comfortable angle**, not bolt upright. Which way the view points
out of the phone is a dial, `SIGHT_DEG`: 90° is straight out of the back, 0° is along the
top edge. See *The sighting axis* — getting this wrong is what made the first version
unusable in the hand.

### Where Orion is put, and why

`CAT` holds the real catalogue — right ascension, declination, magnitude — and the page
solves for the sidereal time at which Alnilam sits `BELT_ALT` above the horizon while
rising, then places every star where it actually is at that moment. Doing the spherical
maths rather than eyeballing a shape is what earns the picture: the hunter comes out lying
on his side with the belt standing upright, Rigel just above the horizon and Saiph still
under it, which is how Orion really rises at this latitude.

It also lands Alnilam on azimuth **92.5° — due east**, which is the answer she is being
asked for. `BELT_ALT` is 2°, high enough that all three belt stars are clear of the horizon;
raising it further would drag the belt south of east, because a rising star climbs on a
slant.

Both compass sources read from **magnetic** north, so the whole sky is shifted by the 13°W
declination at Boerum Hill once, at setup. There is then only one set of angles in the file.

### The sighting axis

The first build sighted straight out of the back of the phone, which is the obvious reading
of "a window onto the sky". On a real phone it was unusable: the heading twitched and could
not be held.

The cause is not the puzzle but the hardware. Core Location derives its heading from the
**device's top edge**, projected onto the horizontal plane. Sighting out of the back puts
the horizon on screen only when the phone is upright — and upright is exactly when that top
edge points at the zenith, leaving no horizontal projection for the heading to be computed
from. The gate was asking her to stand in the one place the compass cannot see.

Leaning the sight toward the top edge fixes it. At `SIGHT_DEG` **45°** the horizon arrives
on screen with the phone held at an ordinary reading angle, the top edge has plenty of
horizontal to point along, and the dead zone is nowhere near. `trust` in the debug readout
is `|cos(beta)|`, the length of that horizontal projection: 1.00 flat, **0.71 at the 45°
sight**, 0.00 at the upright pose the gate used to demand.

Nothing about the puzzle changes. She still faces where the belt rises, the belt still lands
in the sight, the sky is still a window she pans by turning. Only the wrist angle moves.

`?sight=N` overrides the dial, so the sweet spot can be found on her actual phone without a
deploy. Worth knowing while testing: **landscape is the steadiest pose of all**, because
rolling the phone on its side lays the top edge flat and `trust` goes to 1.00.

### Holding still on a shaky reading

Two things stop a noisy heading from making the gate unwinnable.

**The hold accumulates rather than restarting.** It used to zero the instant a single frame
fell outside the tolerance, which is brutal against a twitchy compass: simulated at 60fps,
with only **2%** of frames flicking out of tolerance the old rule finished a 5-second hold
on just a quarter of attempts, median 52 seconds — and at 5% it never finished at all. The
accumulator unwinds at `UNWIND` (2.5×) the rate it fills, so a blip costs a moment and
turning away still properly loses it: 6.1s at 5% noise, 7.6s at 10%, and it only becomes
unwinnable past about 28%.

**The smoothing follows how much the heading deserves belief.** The slerp time constant
scales with `trust`, from `EASE_MS` (70ms) with the top edge flat to `SHAKY_MS` (520ms) with
it vertical, so readings are damped hardest exactly where they are worst. Lag is a far
smaller annoyance than jitter when what she has been asked to do is hold still.

`?debug=1` reports `wobble`, the spread of the heading over the last ~90 frames, so "it
twitches" can be read as a number rather than argued about.

### The star field

`STARS` is the **Yale Bright Star Catalog**, 5th revised edition (BSC5), from Harvard's
Telescope Data Center — public domain, and the canonical list of what the naked eye can see.
Everything in it brighter than magnitude 5.0 that is above the horizon at the frozen instant
is carried, placed through the same `LST` and the same magnetic shift as Orion. What she
sweeps is therefore the sky that was genuinely over Boerum Hill when the belt cleared the
horizon, not a scatter of dots with a constellation pasted on: Taurus and the Pleiades up
and north of the hunter, Auriga above them, Vega and Deneb and Altair round to the west.

**Every star is drawn by one law of magnitude** — `sizeOf`, `alphaOf`, and the same twinkle —
Orion's eight included. That is the whole point: a constellation quietly drawn a little
larger or brighter than its neighbours is a constellation that has been pointed at. Until
she is close, `orion()` draws nothing whatsoever; the hunter is just more sky, and the only
thing that distinguishes him is that he is a shape worth recognising.

Only the half of the catalogue above the horizon is embedded, which is why the data has to
be rebuilt if `LATITUDE` or `BELT_ALT` ever move. See *Regenerating the star field*.

### Put on your seatbelt

One clue, once per visit. After the opening tap the screen holds **"Put on your seatbelt."**
alone for `BUCKLE_MS`, then it dissolves as the sky comes up.

It names the belt without naming Orion and without pointing anywhere, so it stays a riddle
rather than an instruction — which is what lets the gate itself stay wordless. The sensors
start at the beginning of the beat rather than the end, so the sky is already tracking by the
time she sees it and never arrives frozen and then lurching.

### How she is meant to work it out

**The sky is honest, and that is the puzzle.** Orion is drawn at its real relative
magnitudes in the same plain starlight as everything else, so far from the target it reads
as what it actually is — the brightest stars up there — and not as the one thing the page
has picked out for her. Finding it means recognising the sky, which is the entire fiction of
this page.

An earlier version gave itself away twice over. Orion was gold against a white starfield,
which marked the answer before she knew there was a question, and the brightness ramped
from **70°** out, which turned the whole thing into a hot-and-cold gradient you could follow
to the finish without ever noticing you were looking at a constellation.

Now nothing helps until she is within `HELP_FROM`, **30°**. Inside that the stars warm to
gold and the halos bloom — so warmth is no longer a search tool but confirmation she has
found it. Outside it the page is a sky, a horizon, a title and the sight.

### The sight says nothing

A ring at the middle of the screen, `FRAME_DEG` **4°** across — a little more than the belt
is long — at a constant opacity and a constant colour.

It is deliberately **not** feedback. For a while it faded up with the warmth instead of
sitting there from the first frame, on the reasoning that an empty frame in the middle of
the screen announces this is a game of aiming. That traded one giveaway for a worse one: a
mark that *materialises as she closes in* doesn't say "aim at something", it says "you're
nearly there", which is the single most valuable thing the page has to keep to itself. A
mark that is simply always there says far less. It is furniture, not a signal, and nothing
about how close she is reaches it.

The difficulty is therefore all in the first discovery, which is where it belongs: once she
knows what the page is, it is turn east, tilt, hold. That matters because **the login is
deliberately not remembered**, so she walks through it on every visit; a puzzle that was
hard every time would be a tax, and a puzzle that explains itself in the first three seconds
was never a puzzle.

`?help=N` dials the distance for testing. `?help=70` is roughly the old, far more generous
behaviour.

**The hold indicator is the constellation lines drawing themselves in.** They pay out along
the figure as a single thread, belt first, so holding steady visibly knits the hunter
together and letting go unpicks him. The fill is `p ** 2.5` — slow at first, rushing at the
end — so the last second feels like the thing closing rather than a bar ticking over. No
arrows, no timed text hints, and no word anywhere on the page that isn't "Log in" or "Next".

### Orientation maths

The view is carried as a quaternion from first to last. The original reason still stands:
at `beta` 90° the orientation angles are degenerate and `alpha` and `gamma` trade against
each other freely while the phone barely moves — measured on that lock line, raw `alpha` can
swing 16° with the phone essentially still.

That is **Euler** gimbal lock, and it is a different problem from the compass one above.
Carrying a quaternion fixes the first and cannot touch the second: no amount of care with
the maths rescues a north reference that is itself noise. Moving the sighting axis is what
fixes that one.

- `alpha`/`beta`/`gamma` build a rotation; the camera-out direction is taken from it, and
  heading and elevation are read back out of that vector at the very end. Through that same
  16° swing of `alpha`, the computed heading does not move at all.
- Stars are projected through the camera basis, so roll falls out for free: there is no
  separate horizon-levelling step, and so nothing to get out of step.
- `screen.orientation.angle` is folded into the same quaternion, so auto-rotate never jumps
  the sky. Rolled 90° into landscape the view is identical to portrait, to the pixel.
  Locking the orientation instead is not an option — it needs fullscreen on Android and
  does not exist on iOS.
- **The screen rotation is applied before the sight is tilted, about the device's own z
  axis** (which is `y` in the frame the Euler angles land in). While the sight pointed
  straight out of the back the two were the same rotation and the order did not matter; a
  leaning sight has to lean toward whichever edge is currently up, and getting this wrong
  aims 50° off and 30° low the moment the phone is turned to landscape. At `SIGHT_DEG` 90
  the form reduces exactly to the roll-about-the-view-axis it used to be.
- Smoothing is a **slerp on the quaternion**, not a filter on the angles. Smoothing angles
  is what sends the sky the long way round when the heading crosses north.

A canvas is a replaced element, so `inset: 0` alone leaves it at its intrinsic 300×150 and
the sky draws into a box in the corner. Its width and height are explicit for that reason.

### Platform notes

- iOS exposes `webkitCompassHeading` (degrees clockwise from magnetic north); the page uses
  `360 - webkitCompassHeading` as a north-referenced `alpha`. Android has no such property
  and needs the `deviceorientationabsolute` event, whose `alpha` is already absolute.
- **Field test, first build: the heading twitched and could not be held.** That is what the
  sighting axis is for; see above. If 45° still is not enough on her phone, the next lever
  is to calibrate a north offset against the raw gyro-led `alpha` and coast on it while
  `trust` is low, rather than believing `webkitCompassHeading` moment to moment.
- A constant compass bias would not actually lock her out — she finds east by watching the
  stars, not by being right about magnetic north. It would only make the gate less honest.
- A reading older than 900ms doesn't count toward the hold, so a stalled sensor or a
  backgrounded page can't let a stale "facing east" quietly finish the login.
- `prefers-reduced-motion` only stops the stars twinkling. The sky tracking is the puzzle.

### There is no way past it

The gate is absolute: facing the belt is the only way in. If the compass is denied or
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
| `?sight=N` | Overrides the sighting angle, 0–90. Use this to find the angle that holds steadiest in the hand; 90 is the original out-of-the-back behaviour. |
| `?help=N` | How close before the page starts helping, in degrees. Lower is harder and more secretive; 70 is roughly the old behaviour, where the glow led her in from most of a turn away. |

## Regenerating the star field

`scripts/generate-star-field.mjs` downloads BSC5, keeps everything brighter than magnitude
5.0 that is above the horizon at the frozen instant, drops Orion's own eight (they are
carried by name in `CAT`, because the figure's lines need to know which star is which), and
prints the replacement for the `const STARS = ...` block:

```bash
node scripts/generate-star-field.mjs > /tmp/stars.js
```

Paste the output over the existing block. The script's `LATITUDE` and `BELT_ALT` must match
the page's, and a BSC5 row with blank coordinates parses as `0`, not `NaN` — the script
rejects blank fields before converting, and skipping that check lands a knot of fictitious
bright stars at right ascension zero.

## Regenerating the QR code

`docs/ataliena-qr.svg` is vector, so it scales to any print size. Reissue it only if the
URL changes — which also orphans saved progress, see above:

```bash
npx -y qrcode@1 -t svg -o docs/ataliena-qr.svg -e M -m 4 "https://liroger.com/ataliena"
```

`-e M` is ~15% error correction, enough to survive ordinary print and scuffing. Verify
any regenerated code actually decodes before printing it.
