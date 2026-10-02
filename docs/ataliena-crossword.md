# The /ataliena crossword

A self-contained crossword puzzle served at `https://liroger.com/ataliena`, handed
out via a printed QR code. Unlisted: nothing on the portfolio links to it, and the
page carries `<meta name="robots" content="noindex, nofollow">`.

## How it's wired

- `public/ataliena/index.html` — the whole puzzle. One file: inline CSS, inline JS,
  two Google Fonts. Vite copies `public/` into `dist/` untouched, so there is no
  build step and nothing to keep in sync.
- `vercel.json` — rewrites bare `/ataliena` to `/ataliena/index.html`. Without this
  the path depends on host-specific directory-index behaviour, and the URL is baked
  into a printed QR code that can't be reissued. The rewrite makes it explicit.

Deliberately *not* ported to React. It's a finished puzzle that works as-is;
re-implementing it as components would risk breaking it for no gain.

## Progress persistence

The puzzle saves itself. On every keystroke it writes `{fill: [...]}` to
`localStorage` under `gift-crossword-first-impressions-v2`, and rehydrates from that
key on load, so a visitor can close the tab and come back to a half-finished grid.

This is per-browser and per-origin, which carries two consequences:

- **The origin must not change once the QR is printed.** Moving the puzzle to a
  different domain orphans everyone's saved progress — the old origin's
  `localStorage` is unreachable from the new one.
- Progress does not follow a visitor across devices, browsers, or a private window,
  and clearing site data wipes it. Cross-device sync would need a backend; for a
  single-recipient gift it isn't worth one.

## Regenerating the QR code

`docs/ataliena-qr.svg` is vector, so it scales to any print size. To reissue it
(only necessary if the URL changes — which also orphans saved progress, see above):

```bash
npx -y qrcode@1 -t svg -o docs/ataliena-qr.svg -e M -m 4 "https://liroger.com/ataliena"
```

`-e M` is ~15% error correction, enough to survive ordinary print and scuffing.
Verify any regenerated code actually decodes before printing it.

## Prerequisites outside this repo

Both are Vercel dashboard / DNS changes, not code:

1. **Deployment Protection must be off.** With Vercel Authentication enabled, every
   deployment 302s to `vercel.com/login` and only logged-in team members can open the
   puzzle. Project Settings → Deployment Protection.
2. **`liroger.com` must point at Vercel** (#9). It served an expired Squarespace site
   until that cutover.
