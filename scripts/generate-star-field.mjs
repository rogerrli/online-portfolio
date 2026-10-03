#!/usr/bin/env node
/**
 * Builds the `STARS` block in public/ataliena/index.html — the real sky behind Orion.
 *
 * Source: the Yale Bright Star Catalog, 5th revised edition (BSC5), from Harvard's
 * Telescope Data Center. Public domain, and the canonical list of everything visible to
 * the naked eye.
 *
 * The gate freezes the sky at one instant — the moment Orion's belt clears the horizon in
 * the east, seen from Boerum Hill. The whole celestial sphere is carried, below the horizon
 * as well as above it, so the sky never runs out. The constants below must match the ones
 * in the page; change LATITUDE or BELT_ALT there and this needs running again.
 *
 *   node scripts/generate-star-field.mjs
 *
 * It prints the replacement for the `const STARS = ...` line. Paste it in.
 */

const SRC       = "http://tdc-www.harvard.edu/catalogs/bsc5.dat.gz";
const LATITUDE  = 40.7;   // Boerum Hill, Brooklyn
const BELT_ALT  = 2;      // where Alnilam is caught, degrees above the horizon
const MAG_LIMIT = 5.0;    // naked-eye, generously: fainter than this is scenery nobody reads
/* The whole sphere, not just the half that is up. Carrying only the risen half left the sky
   dead below the horizon line, which shrank the search and read as broken when she tilted
   down — and it threw away the far southern stars, the ones that never clear the horizon at
   Brooklyn's latitude, which are exactly the unfamiliar sky worth sweeping through. */

/* Orion is carried separately in the page, by name, because the figure's lines need to know
   which star is which. Matching on position rather than catalogue number keeps this honest:
   these are the same coordinates CAT holds, so anything that lands on one of them is one of
   Orion's and would otherwise be drawn twice. */
const ORION = [
  [5.9200,  7.41], [5.4183,  6.35], [5.5850,  9.93], [5.5333, -0.30],
  [5.6033, -1.20], [5.6800, -1.94], [5.2417, -8.20], [5.7967, -9.67],
];
const isOrion = (ra, dec) =>
  ORION.some(([r, d]) => Math.abs(ra - r) < 0.004 && Math.abs(dec - d) < 0.06);

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
  if (isOrion(ra, dec)) continue;
  stars.push({ ra, dec, mag });
}

// the sidereal time at which Alnilam (RA 5h36.2m, Dec -1.2) sits BELT_ALT up, rising
let lo = -3, hi = 0.3, lst = 0;
for (let i = 0; i < 60; i++) {
  lst = (lo + hi) / 2;
  if (altaz(5.6033, -1.2, lst) < BELT_ALT) lo = lst; else hi = lst;
}

const up = stars.sort((a, b) => a.mag - b.mag)
                .map(s => `${s.ra.toFixed(4)},${s.dec.toFixed(2)},${s.mag.toFixed(2)}`);

const risen = stars.filter(s => altaz(s.ra, s.dec, lst) > 0).length;
process.stderr.write(
  `${up.length} stars to mag ${MAG_LIMIT}; ${risen} of them above the horizon at LST ${lst.toFixed(4)}h\n`);

const body = [];
for (let i = 0; i < up.length; i += 6) body.push("  " + up.slice(i, i + 6).join(" "));
process.stdout.write(
  `/* The sky over Boerum Hill at the moment the belt clears the horizon: every star in the\n` +
  `   Yale Bright Star Catalog brighter than magnitude ${MAG_LIMIT.toFixed(1)}, as "right ascension in hours,\n` +
  `   declination in degrees, visual magnitude". The whole sphere, below the horizon as well as\n` +
  `   above it, so the sky never runs out and the far southern stars that never rise here are\n` +
  `   down there to sweep past. Orion itself is not in here — it is carried by name in CAT,\n` +
  `   because the figure's lines need to know which star is which. Regenerate with\n` +
  `   scripts/generate-star-field.mjs. */\n` +
  "const STARS = `\n" + body.join("\n") + "\n`.trim().split(/\\s+/).map(s => s.split(\",\").map(Number));\n");
