#!/usr/bin/env node
/**
 * Builds the `STARS` block in public/ataliena/index.html — the real sky behind Orion.
 *
 * Source: the Yale Bright Star Catalog, 5th revised edition (BSC5), from Harvard's
 * Telescope Data Center. Public domain, and the canonical list of everything visible to
 * the naked eye.
 *
 * The gate freezes the sky at one instant — the moment Libra crosses the meridian, due south
 * and at its highest, seen from Boerum Hill. The whole celestial sphere is carried, below the
 * horizon as well as above it, so the sky never runs out, and the instant only decides what
 * the stderr line reports. What matters here is which stars to leave out.
 *
 *   node scripts/generate-star-field.mjs
 *
 * It prints the replacement for the `const STARS = ...` line. Paste it in.
 */

const SRC       = "http://tdc-www.harvard.edu/catalogs/bsc5.dat.gz";
const LATITUDE  = 40.7;   // Boerum Hill, Brooklyn
/* The sky is frozen on the sign crossing the meridian, which is just the mean right
   ascension of its stars — no solving needed, and nothing here depends on it anyway: the
   data is the whole sphere, and the instant only decides what the stderr line reports. */
const MERIDIAN  = 15.3377;
const MAG_LIMIT = 5.0;    // naked-eye, generously: fainter than this is scenery nobody reads
/* The whole sphere, not just the half that is up. Carrying only the risen half left the sky
   dead below the horizon line, which shrank the search and read as broken when she tilted
   down — and it threw away the far southern stars, the ones that never clear the horizon at
   Brooklyn's latitude, which are exactly the unfamiliar sky worth sweeping through. */

/* Libra is carried separately in the page, by name, because the figure's lines need to know
   which star is which. Matching on position rather than catalogue number keeps this honest:
   these are the same coordinates CAT holds, so anything that lands on one of them is one of
   the scales and would otherwise be drawn twice. */
const SIGN = [
  [14.8480, -16.04], [15.2834,  -9.38], [15.5921, -14.79], [15.0678, -25.28], [15.8971, -16.73],
];
const isSign = (ra, dec) =>
  SIGN.some(([r, d]) => Math.abs(ra - r) < 0.004 && Math.abs(dec - d) < 0.06);

const DEG = Math.PI / 180, PHI = LATITUDE * DEG;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function altaz(ra, dec, lst) {
  const H = (lst - ra) * 15 * DEG, d = dec * DEG;
  const sh = Math.sin(PHI) * Math.sin(d) + Math.cos(PHI) * Math.cos(d) * Math.cos(H);
  return Math.asin(clamp(sh, -1, 1)) / DEG;
}

const text = await fetch(SRC)
  .then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status} fetching ${SRC}`)))
  .then(async buf => {
    const ds = new DecompressionStream("gzip");
    const stream = new Blob([buf]).stream().pipeThrough(ds);
    return new Response(stream).text();
  });

const stars = [];
for (const line of text.split("\n")) {
  /* Some BSC5 rows carry no position or magnitude at all — novae that faded, entries kept
     for numbering. Their fields are blank, and `+""` is 0, not NaN, so they sail through any
     isFinite check and land as a knot of fictitious bright stars at right ascension zero.
     The blank test has to come first. */
  const raF = line.slice(75, 83), decF = line.slice(83, 90), magF = line.slice(102, 107);
  if (!raF.trim() || !decF.trim() || !magF.trim()) continue;
  const rah = +line.slice(75, 77), ram = +line.slice(77, 79), ras = +line.slice(79, 83);
  const dd = +line.slice(84, 86), dm = +line.slice(86, 88), ds = +line.slice(88, 90);
  const mag = +magF;
  if (![rah, ram, ras, dd, dm, ds, mag].every(Number.isFinite)) continue;
  if (mag > MAG_LIMIT) continue;
  const ra = rah + ram / 60 + ras / 3600;
  const dec = (line[83] === "-" ? -1 : 1) * (dd + dm / 60 + ds / 3600);
  if (isSign(ra, dec)) continue;
  stars.push({ ra, dec, mag });
}

const lst = MERIDIAN;

const up = stars.sort((a, b) => a.mag - b.mag)
                .map(s => `${s.ra.toFixed(4)},${s.dec.toFixed(2)},${s.mag.toFixed(2)}`);

const risen = stars.filter(s => altaz(s.ra, s.dec, lst) > 0).length;
process.stderr.write(
  `${up.length} stars to mag ${MAG_LIMIT}; ${risen} of them above the horizon at LST ${lst.toFixed(4)}h\n`);

const body = [];
for (let i = 0; i < up.length; i += 6) body.push("  " + up.slice(i, i + 6).join(" "));
process.stdout.write(
  `/* The sky over Boerum Hill at the moment the scales cross the meridian: every star in the\n` +
  `   Yale Bright Star Catalog brighter than magnitude ${MAG_LIMIT.toFixed(1)}, as "right ascension in hours,\n` +
  `   declination in degrees, visual magnitude". The whole sphere, below the horizon as well as\n` +
  `   above it, so the sky never runs out and the far southern stars that never rise here are\n` +
  `   down there to sweep past. Libra itself is not in here — it is carried by name in CAT,\n` +
  `   because the figure's lines need to know which star is which. Regenerate with\n` +
  `   scripts/generate-star-field.mjs. */\n` +
  "const STARS = `\n" + body.join("\n") + "\n`.trim().split(/\\s+/).map(s => s.split(\",\").map(Number));\n");
