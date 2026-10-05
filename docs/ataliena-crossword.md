# The /ataliena crossword

A crossword puzzle served at `https://liroger.com/ataliena`, handed out via a
printed QR code, behind a star-sighting "Log in". Unlisted: nothing on the portfolio
links to it, and both pages carry `<meta name="robots" content="noindex, nofollow">`.

## The two pages

| File | Role |
| --- | --- |
| `public/ataliena/index.html` | The Libra login gate. |
| `public/ataliena/puzzle.html` | The crossword. |

`vercel.json` rewrites bare `/ataliena` to `index.html` and `/ataliena/puzzle` to
`puzzle.html`. Resolving a bare path would otherwise depend on host-specific
directory-index behaviour, and `/ataliena` is baked into a printed QR code that
can't be reissued, so it's stated explicitly.

The puzzle is deliberately *not* ported to React — it stays a single dependency-free
file, edited in place.

## Alpha and beta

`public/ataliena/puzzle-alpha.html` is a frozen copy of the puzzle as it stood once the
clue-difficulty pass finished, served at `/ataliena/puzzle-alpha`. Git tag `puzzle-alpha`
marks the same state.

**The beta rework landed, so `puzzle.html` is now the beta**: a rebuilt grid of 66 words
with 6 three-letter entries, against alpha's 77 and 24. The gate is unchanged and still
navigates to `/ataliena/puzzle.html`, which is what the printed QR depends on. Alpha stays
reachable at `/ataliena/puzzle-alpha` as the fallback it was always meant to be.

Beta carries `KEY` `-v3` and alpha keeps `-v2`, so the two cannot overwrite each other.

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
gate is Libra, her own sign. Same verb — aim the phone at where a constellation really sits —
different noun, so she arrives at the box already knowing that a lid full of dots is telling
her which way to turn, without having been handed the answer.

### Daylight

If the device explicitly reports light mode, the gate holds her at the door: the title, a
washed-out constellation, and *"It's a bit light out to see the stars."* No instruction —
the faded stars are the hint. Nothing is armed while it's up, so no sensors run and no
permission is requested. It's plain CSS plus one `matchMedia` listener, so turning dark
mode on swaps straight to the night sky with no reload, which is the reward for working it
out. "No preference" is not light, and falls through to the sky as normal.

There is no password and no text input. **The login is facing her sign, due south.**

1. **Tap to start.** Nothing but the words, on the starfield. This screen exists
   because iOS will not hand over compass data outside a user gesture —
   `DeviceOrientationEvent.requestPermission()` must be called from a real tap. Every
   platform shows it so the experience doesn't fork; on Android the tap just starts it.
2. **Log in.** The title, a small ring at the centre of the screen, and a sky. No
   instructions, by design.
3. **The hold.** The ring over some part of Libra — a star, or the figure between two of
   them — for **5 seconds**, accumulated rather than consecutive. See *The sight is the
   tolerance* and *Holding still on a shaky reading*.
4. **The payoff.** Stars go to full brightness, the whole figure is drawn, and a **Next**
   button appears. Nothing auto-advances.

### A window, not a dial

The screen is a window onto the sky rather than a meter. Libra is pinned to its real
position: turn and the stars pan the other way, tilt and they slide, roll the phone and they
counter-rotate so the horizon stays level. Face the wrong way and the scales are simply not
on screen.

And the sky he is hiding in is the **real** one — see *The star field* — so sweeping past is
sweeping past Virgo and Spica, Scorpius coming up behind. Below the horizon line there is
nothing at all, because below the horizon there is ground.

The phone is held at a **comfortable angle**, not bolt upright. Which way the view points
out of the phone is a dial, `SIGHT_DEG`: 90° is straight out of the back, 0° is along the
top edge. See *The sighting axis* — getting this wrong is what made the first version
unusable in the hand.

### Why Libra, and where it is put

The gate asked for Orion for a long time, because Orion is easy to recognise. It asks for
**Libra** now, because that is her sign — 5 October — and the point of a birthday present is
that it is hers.

That is knowingly much harder, and the numbers are worth writing down:

| | brightest star | stars in the sky brighter than that |
| --- | --- | --- |
| Orion | mag 0.12 (Rigel) | 6 |
| Libra | mag 2.61 (Zubeneschamali) | **101** |

Orion had seven stars brighter than magnitude 2.3. Libra has two brighter than 2.8, and it is
the least conspicuous constellation on the zodiac — a faint quadrilateral with no bright
anchor — sitting in a sky of 1621 others. Nothing marks it, nothing warms until she is
already holding still on it, and there is no text. That is the intent, chosen with the
numbers above in view.

**The figure**, as NOIRLab and the usual star charts draw it: a **triangle** of the three
brightest — Zubeneschamali at the apex, Zubenelakrab and Zubenelgenubi below — with two cords
hanging off the lower corners, one to Brachium and one down through υ to **τ Lib**. Which is
a balance: a frame held at the top, two arms, a weight on the end of each.

Worth recording, because it cost two goes. The first version closed a triangle the wrong way
and had no cords at all. The second was checked against **Stellarium**, which draws Libra as
a quadrilateral closing σ back to γ with a tail out to θ and no υ or τ — a perfectly real
convention, and not the one on the charts she will have seen. Constellation lines are
convention rather than fact, so "checked against a source" is worth nothing unless it is the
*right* source.

**The moment.** The sky is frozen on the sign crossing the meridian — due south, at its
highest. A star is on the meridian when the sidereal time equals its right ascension, so
`LST` is simply the mean right ascension of the figure's stars. Everything lands around 33°
altitude on true azimuth 180.0°.

Three things come out of that, all about her rather than about elegance. Due south is a
direction she can reason about. On the meridian the figure stands in the orientation a star
chart draws it, north up, rather than tipped on its side the way it is while rising. And it
is the only place a natural aim keeps the compass out of trouble — see *The sight does not
lean any more*.

Both compass sources read from **magnetic** north, so the whole sky is shifted by the 13°W
declination at Boerum Hill once, at setup. There is then only one set of angles in the file.

### The sight does not lean any more

`SIGHT_DEG` is **90**: straight out of the back of the phone, which is how anybody points a
phone at a thing.

It leaned 45° for a while. Sighting out of the back only puts a target that sits *on the
horizon* on screen when the phone is bolt upright, and upright is where Core Location's
heading dies — it reads from the device's top edge projected onto the horizontal, and upright
that edge points at the zenith with nothing left to project. The lean bought a sane wrist
angle at the price of **aiming 45° below whatever she was looking at**, which fights somebody
who already knows where the constellations are.

It stops being a trade once the target is not on the horizon. With the sign caught at the
meridian, 33° up, a natural aim tips the phone back *past* vertical and swings the top edge
away from the zenith again. `trust` — `|cos(beta)|`, the length of that horizontal
projection — goes from **0.14** aiming straight at something on the horizon to **0.54** here.
And the flip that made upright unusable is fixed at the source now; see below.

`?sight=N` still overrides it.

### The sky used to flip through vertical

The one that made it feel broken. `webkitCompassHeading` is the bearing of the device's **top
edge projected onto the horizontal plane**. Hold the phone upright and that projection
collapses; tip it past vertical and it **reverses**, so the reading jumps 180° and anything
driven straight off it spins. Going from looking down to looking up span the sky right round.

iOS also reports `alpha`, which is gyro-led: continuous, smooth, with no such discontinuity —
just measured from an arbitrary start rather than from north. So the view is driven from
`alpha`, and the compass is demoted to supplying one number, `northOff`, the offset between
them.

That offset is a **constant** by construction. She can turn all she likes and it does not
move, because turning moves `alpha` and the compass together. So when it does move, that is
the instrument and not her:

- a jump of about 180° is the flip. Correct it rather than following it.
- anything else is drift, folded in slowly and weighted by how much horizontal the top edge
  has left to point along — believed where it is worth believing, coasted on where it is not.
  The gyro holds a heading perfectly well across the few seconds of a hold.

Simulated against a compass that reverses at vertical, sweeping the phone from 30° below the
horizon to 60° above: the compass jumps the full 180°, and the computed heading moves **0.00°
at every step**.

With a smooth input the heavy smoothing that was hiding the jitter is pure lag, so `SHAKY_MS`
comes down from 520ms to 190ms.

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
Everything in it brighter than magnitude 5.0 is carried — the whole celestial sphere, below
the horizon as well as above it — placed through the same `LST` and the same magnetic shift
as the sign. What she
sweeps is therefore the sky that was genuinely over Boerum Hill when the scales cleared the
horizon, not a scatter of dots with a constellation pasted on: Virgo and Spica round to the
west of them, Scorpius and Antares coming up behind.

**Every star is drawn by one law of magnitude** — `sizeOf`, `alphaOf`, and the same twinkle —
Libra's four included. That is the whole point: a constellation quietly drawn a little
larger or brighter than its neighbours is a constellation that has been pointed at. Until
she has held it, `sign()` draws nothing whatsoever; the scales are just more sky, and the
only thing that distinguishes them is that they are a shape worth recognising.

Carrying only the risen half, as an earlier version did, left the sky dead below the horizon
line: tilt down and there was nothing, which shrank the search and read as broken. It also
threw away the far southern stars — the ones that never clear the horizon at this latitude —
which are exactly the unfamiliar sky worth sweeping through. 1621 stars, about 32 KB.

### No clue on the page

There was one, for a while: after the opening tap the screen held **"Put on your seatbelt."**
for a beat before the sky came up. It named Orion's belt without naming Orion, which made it
a riddle rather than an instruction.

It is gone. It is wrong for Libra, and more to the point the page should not be clueing
itself at all — the opening tap goes straight to the sky. The daylight screen keeps its line,
because that one explains why there is nothing to see with the lights on, which is a
different gate and not a hint about this one.

### How she is meant to work it out

**The sky is honest, and that is the puzzle.** Libra is drawn at its real relative
magnitudes in the same plain starlight as everything else, so far from the target it reads
as what it actually is — the brightest stars up there — and not as the one thing the page
has picked out for her. Finding it means recognising the sky, which is the entire fiction of
this page.

An earlier version gave itself away twice over. The constellation was gold against a white starfield,
which marked the answer before she knew there was a question, and the brightness ramped
from **70°** out, which turned the whole thing into a hot-and-cold gradient you could follow
to the finish without ever noticing you were looking at a constellation. Pulling that ramp
in to 30° made it slower to notice but no less of a tell: proximity warmth is a gradient you
can walk up, and the distance it starts at only changes how long that takes.

**So nothing brightens until she has held it for `GLOW_AFTER`, one second.** Warmth is no
longer a search signal at all — it is the page noticing she has *stopped*, which is the one
thing it is fair to tell her. Until then the page is a sky, a horizon, a title and the
sight, and moving around in it is answered by nothing but the sky moving.

### The sight is the tolerance

A ring at the middle of the screen, `FRAME_DEG` **4°** across, at a constant opacity and a
constant colour.

It is deliberately **not** feedback. For a while it faded up with the warmth instead of
sitting there from the first frame, on the reasoning that an empty frame in the middle of
the screen announces this is a game of aiming. That traded one giveaway for a worse one: a
mark that *materialises as she closes in* doesn't say "aim at something", it says "you're
nearly there", which is the single most valuable thing the page has to keep to itself. A
mark that is simply always there says far less. It is furniture, not a signal, and nothing
about how close she is reaches it.

**And it is now the actual target.** The unlock used to be a ±10° box on heading and
elevation around the figure's centre — twenty degrees across, five times the ring — so it
fired with the constellation nowhere near the sight and the ring was decoration rather than
the thing being asked for. `toFigure()` now measures the angular distance from the middle of
the screen to **the figure itself**: the eight stars and the arcs drawn between them, the
nearest point on each arc found by projecting the view onto the plane of its two ends and
falling back to whichever end is closer when that projection lands outside the span. A star
in the ring counts, and so does the space between two stars, because the arc runs through
it.

`GRAB_DEG` is the ring's own radius, **2°**, and no more — there is no padding around it.
The quadrilateral's **own interior counts too**. Correcting the figure gave Libra a real
enclosed area for the first time, and without that the dead centre of the constellation reads
2.4° from anything and does not register, which is a daft way to miss. It is not padding — it
is the shape's own area, which is what "a star, or the space between two stars" meant. That
brings the target to about **344 square degrees**, shaped like Libra, against roughly 400 for
the old box that was not. `?grab=N` widens it for field
testing, which matters because the compass is not quiet and 2° is a small thing to hold.

The difficulty is therefore all in the first discovery, which is where it belongs: once she
knows what the page is, it is turn east, tilt, hold. That matters because **the login is
deliberately not remembered**, so she walks through it on every visit; a puzzle that was
hard every time would be a tax, and a puzzle that explains itself in the first three seconds
was never a puzzle.

**The hold indicator is the constellation lines drawing themselves in.** They pay out along
the figure as a single thread, the beam first, so holding steady visibly draws the scales and
letting go unpicks them. The fill is `p ** 2.5` — slow at first, rushing at the
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

### The scales, at the end

Once she is in, the figure stops being a shape and becomes the thing it has been all along: a
ring is drawn above Zubeneschamali, where a balance hangs from, and a pan under each of
Zubenelakrab and Zubenelgenubi, the two arms. `SCALES` is built in degrees around the real
stars and converted to sky directions once, so it stays pinned to them, with "down" meaning
toward the horizon so the pans hang the way pans do.

**It is tied to one frozen moment and does not survive moving it.** The first attempt put the
post on the midpoint of an edge and the pans under the wrong two stars, because it was
designed for the shape Libra makes while *rising*, which is nothing like the kite it makes on
the meridian.

### There is no way past it

The gate is absolute: finding her sign is the only way in. If the compass is denied or
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
| `?grab=N` | How near the middle of the screen has to be to the figure, in degrees. The default is the sight's own radius, 2. Raise it if the compass is too restless to hold something that small. |
| `?hint=1` | **Practice mode.** Turns the gate into something that can actually be tested — see below. |

## Regenerating the star field

`scripts/generate-star-field.mjs` downloads BSC5, keeps everything brighter than magnitude
5.0, drops Libra's own four (they are carried by name in `CAT`, because the figure's lines
need to know which star is which), and prints the replacement for the `const STARS = ...`
block:

```bash
node scripts/generate-star-field.mjs > /tmp/stars.js
```

Paste the output over the existing block. The script's `LATITUDE` and `CLEAR_ALT` are only
used to report how many stars happen to be up at that moment — the data itself is the whole
sphere and does not depend on them. A BSC5 row with blank coordinates parses as `0`, not `NaN` — the script
rejects blank fields before converting, and skipping that check lands a knot of fictitious
bright stars at right ascension zero.

## Regenerating the QR code

Two files, same code: `docs/ataliena-qr.svg` is the one to print, because it is vector and
scales to any size, and `docs/ataliena-qr.png` is the one that opens anywhere without
argument.

The SVG carries an explicit `width` and `height` as well as its `viewBox`. It was written
with the `viewBox` alone, which left it with no intrinsic size — renderers either drew it
37 pixels square or refused it, and it could not be opened at all in most viewers. The
`viewBox` still governs scaling; the dimensions only give it a size to fall back on.

Reissue either only if the URL changes — which also orphans saved progress, see above:

```bash
npx -y qrcode@1 -t svg -o docs/ataliena-qr.svg -e M -m 4 "https://liroger.com/ataliena"
npx -y qrcode@1 -t png -o docs/ataliena-qr.png -e M -m 4 -w 1024 "https://liroger.com/ataliena"
```

The SVG comes out without `width`/`height`; add them back.

`-e M` is ~15% error correction, enough to survive ordinary print and scuffing.

**Verify by decoding, not by looking.** Both current files were read back with jsQR and
return `https://liroger.com/ataliena` exactly. A code that renders is not evidence of a
code that scans, and the URL is baked into a printed card that cannot be reissued.


### Practice mode

The gate is built to give nothing away, which makes it very hard to test from the outside.
Libra's brightest star is magnitude 2.61 and a hundred and one stars beat it; nothing on the
page moves until the sight has been held on the figure for a full second; and the sight never
reacts. So from behind the phone there is no way to tell a near miss from facing the wrong
wall. `?hint=1` turns on three things, and nothing else turns them on:

- **The figure, dashed, at all times.** Dashed rather than solid so it reads as scaffolding
  and not as the thing the hold draws — which is still underneath it, filling in as normal,
  so the hold can be watched working.
- **A pointer, when the figure is off screen.** Drawn from the target in camera space, so
  its x and y give the way to swing even when z is negative and the sign is flat behind her;
  there is no separate case for that.
- **A sight that answers.** It goes gold the instant the middle of the screen lands on the
  figure, and the warmth starts from the same instant rather than after the one-second wait
  (`GLOW_AFTER` is zero under the flag).

None of it is mentioned on the page, and the real run is bit-for-bit what it was: with the
flag off, the middle of the screen dead on the figure leaves the sight at its constant
`rgba(226,232,245,.26)`, draws nothing, and reports `lit 0.00`.


### The landing

The payoff used to stop dead the moment the scales finished, with the figure left wherever
she happened to be holding it — often half off the edge. Now it lands, over the ~1.2s after
the drawing completes.

**It centres.** The view eases to `Q_LAND` over 900ms. That direction is not `TARGET_V`:
that is the *triangle's* centroid, chosen for the aiming tolerance, and the scales hang a
long way below it, so landing on it leaves the whole drawing low with the pans down by the
Next button. `Q_LAND` is the centroid of everything that ends up drawn — the six stars and
every point of the scales — so it is derived from the same catalogue positions as the rest
of the sky and moves with them. Nothing about it is a screen coordinate.

The ease is a slerp, which needs that direction as a quaternion rather than three basis
vectors; lerping those would need re-orthonormalising every frame and would still swing the
horizon the long way round. `qFromBasis` inverts what `basisFrom` builds, and was checked by
round-tripping 4000 random views, which exercises all four branches of the matrix-to-
quaternion conversion: worst basis error 1.2e-15.

**A splash of sparks.** Seven per star over 1200ms, each leaving its star along a great
circle — out quickly, then coasting, fading as it goes, with its own small delay so they
don't all go together. They live in the sky, not on the screen, because the view is still
easing underneath them and anything held in screen coordinates would slide with it. Travel
is 1.7–4.5 degrees of sky, so it scales with the field of view rather than with the pixels.

`prefers-reduced-motion` keeps the sparks and snaps the view instead of easing it.


### The sky tracks the calendar

`LST` used to be the mean right ascension of the sign's stars — by definition the moment
Libra crosses the meridian, so the sky was frozen there: always due south, always 36 degrees
up, every night of the year. Always solvable, never true. It now comes from the device's
clock through `lstAt()`, the IAU mean-sidereal-time polynomial plus the longitude.

**The sky keeps turning while she stands there.** Rather than replacing 1621 stars every
frame, everything is placed once at load and then rotated as one rigid body about the
celestial pole — which is exactly what the sky does. One quaternion a frame instead of a
catalogue. Checked against a full `altaz` recomputation over 10 stars and 7 time offsets from
one minute to twenty-four hours: worst position error **1.5e-15**, machine epsilon.

**There are two frames now.** `R/U/F` is the view in the *sky's* frame — every star, the
figure, the scales and the unlock test live there, where the figure never moves. `Re/Ue/Fe`
is the same view in the *earth's* frame: the horizon is drawn through it, and the heading and
elevation are read from it, because that is what a compass measures.

**She will be aiming at the floor.** Libra is a spring constellation; on 5 October it sets as
the sky gets dark, so from about 20:15 it is below the horizon for the rest of the night, and
by midnight it is 44 degrees down. The gate does not mind — the unlock tests the camera's
forward vector and never looks at the sign of the altitude, and aiming downward is the
*better* compass pose, since trust is `|cos(beta)|` and the phone comes back toward flat
(0.69 at 44 degrees down, against 0.59 for the old meridian aim). Stars below the horizon
are drawn at `GROUND` = 0.4 so the ground reads as ground. Not zero: the sky has to stay
continuous to be worth sweeping, and the sign itself is down there.

### The azimuth bug this uncovered

`altaz` computed its azimuth as `atan2(-cos(dec)sin(H), sin(dec) - sin(phi)sin(alt))`. That
denominator is the correct one multiplied by `cos(phi)`, and scaling only the denominator of
an `atan2` squashes the angle. At this latitude it cost **up to 8 degrees of azimuth** — four
times the grab tolerance.

It had been there since the Orion version and never showed, because the error is *exactly
zero at H = 0*, and the sky was frozen on the meridian, where the sign's hour angle is zero
by construction. Only a live sky puts the figure at other hour angles.

Checked three ways: against the textbook identity
`cos(alt)cos(az) = cos(phi)sin(dec) - sin(phi)cos(dec)cos(H)`; against an independent
construction of the star's vector in the hour-angle frame, which agrees to the last digit at
every hour angle; and indirectly by the rigid-rotation test above, which only reaches machine
epsilon if the placement really is a rotation of itself — a wrong `altaz` cannot pass it.
