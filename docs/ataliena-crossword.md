# The /ataliena crossword

A crossword puzzle served at `https://liroger.com/ataliena`, handed out via a
printed QR code, behind a compass "Log in". Unlisted: nothing on the portfolio
links to it, and both pages carry `<meta name="robots" content="noindex, nofollow">`.

## The two pages

| File | Role |
| --- | --- |
| `public/ataliena/index.html` | The Cassiopeia login gate. |
| `public/ataliena/puzzle.html` | The crossword, untouched. |

`vercel.json` rewrites bare `/ataliena` to `index.html` and `/ataliena/puzzle` to
`puzzle.html`. Resolving a bare path would otherwise depend on host-specific
directory-index behaviour, and `/ataliena` is baked into a printed QR code that
can't be reissued, so it's stated explicitly.

The puzzle is deliberately *not* ported to React, and the gate deliberately does not
touch it. It's a finished, dependency-free file that works as-is.

The gate navigates to the puzzle by **absolute** path (`/ataliena/puzzle.html`), and must
keep doing so. The QR points at `/ataliena` with no trailing slash, so a relative
`puzzle.html` resolves against `/` and lands on `/puzzle.html` — nowhere. Loading the gate
as `/ataliena/index.html` hides the bug, because the relative form resolves correctly from
there; test the bare URL.

## The gate

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
