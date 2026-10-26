// Renders public/resume.json into public/resume.pdf so recruiters/ATS tools
// have a plain PDF to grab, while resume.json stays the single source of truth.
//
// The layout reproduces the approved resume: one Letter page, Helvetica
// throughout. Every SIZE and GAP below was measured off that PDF, so treat them
// as a spec rather than taste — each gap is top-of-line to top-of-line, and
// changing one shifts everything under it toward the one-page guard below.
//
// Positions are tracked in an explicit `y` cursor rather than pdfkit's own
// doc.y, because the approved layout sets a tighter baseline rhythm than
// pdfkit's default leading and mixes flush-right dates into title lines. Every
// drawing helper leaves `y` on the top of the last line it drew, and call sites
// advance it by one of the measured gaps.
import { createWriteStream, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const resume = JSON.parse(
  readFileSync(path.join(REPO_ROOT, "public", "resume.json"), "utf8"),
);

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// En dash, matching the approved resume's date ranges.
const DASH = "–";
const ARROW = "→";
const ARROW_SPLIT = new RegExp(`\\s*${ARROW}\\s*`);

const formatDate = (iso) => {
  const [year, month] = iso.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
};

const formatRange = (start, end) =>
  `${formatDate(start)} ${DASH} ${end ? formatDate(end) : "Present"}`;

const formatYears = (start, end) =>
  `${start.slice(0, 4)} ${DASH} ${end.slice(0, 4)}`;

// --- Layout spec, measured from the approved PDF ----------------------------

const SIZE = {
  name: 21,
  label: 11.5,
  contact: 9,
  body: 8.9,
  heading: 10.25,
  title: 9.6, // role, project and degree titles
  nestedRole: 9.2,
  companyName: 10.2,
  roleCount: 8,
  certs: 9,
  skills: 8.96,
  date: 8.32,
};

// How far the flush-right date rides above the top of the title line it shares.
// The approved resume does not baseline-align these, so both are measured
// values rather than one derived rule.
const DATE_TOP = { title: -0.7, companyName: 0.5 };

// Advance the drawn arrow occupies, measured off the approved title.
const ARROW_EM = 0.857;

// Where Helvetica's baseline sits below a line's top edge, from the standard
// font's own metrics: ascender / (ascender - descender).
const BASELINE_FRACTION = 718 / (718 + 207);

// Skills groups name this many keywords before falling back to a count.
const SKILLS_PREVIEW = 8;

// Baseline rhythm: top-of-line to top-of-line within a wrapped block.
const LEADING = { body: 10.7, skills: 11.2 };

// Gaps between blocks, each measured top-of-line to top-of-line.
const GAP = {
  top: 40.7,
  nameToLabel: 21.3,
  labelToContact: 16.2,
  contactToSummary: 15.1,
  toHeading: 15.3,
  headingToEntry: 17.1,
  titleToBullet: 11.5,
  bulletToTitle: 14.9,
  groupExitToTitle: 15.9,
  bulletToNestedTitle: 13.8,
  companyToNestedTitle: 14.5,
  withinEducation: 10.5, // degree to degree, and the last degree to the certs
};

const INDENT = {
  bullet: 1, // the bullet glyph, nudged off the margin
  bulletText: 10, // hanging indent for wrapped bullet lines
  group: 9, // the nested company-group block
  rule: 3.2, // the group's thin left rule
};

const ACCENT = "#404040";
const MUTED = "#666666";
const RULE = "#cccccc";
const GROUP_RULE = "#bbbbbb";

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 40, bottom: 32, left: 45.6, right: 45.6 },
  info: {
    Title: `${resume.basics.name} Resume`,
    Author: resume.basics.name,
  },
});
doc.pipe(createWriteStream(path.join(REPO_ROOT, "public", "resume.pdf")));

const LEFT = doc.page.margins.left;
const RIGHT = doc.page.width - doc.page.margins.right;
const CONTENT_WIDTH = RIGHT - LEFT;
const BOTTOM = doc.page.height - doc.page.margins.bottom;

// Belt to the braces at the bottom of this file. Most draws here are positioned
// explicitly, which leaves pdfkit's own flow cursor parked and this event
// silent; it still fires for the flush-right dates, which do flow.
doc.on("pageAdded", () => {
  throw new Error(
    "resume.pdf overflowed onto a second page. Trim resume.json or tighten the layout in scripts/generate-resume-pdf.mjs.",
  );
});

/** Top of the line being drawn. Helpers leave it on their own last line. */
let y = GAP.top;

const pick = (font, size) => doc.font(font).fontSize(size);

/**
 * Greedy wrap on spaces only, which is how the approved layout breaks.
 *
 * pdfkit breaks lines with the Unicode UAX #14 algorithm, which treats a hyphen
 * as a break opportunity and would strand "API-layer" as "API-" / "layer". The
 * usual escapes don't survive the standard fonts: a word joiner (U+2060) isn't
 * in WinAnsi, so pdfkit substitutes a visible glyph into the page.
 */
function wrapToLines(text, width, font, size) {
  pick(font, size);
  const lines = [];
  // null rather than "" so that a leading space — the empty first token of
  // " Engineering Lead" — joins the line instead of being mistaken for an
  // empty line and dropped, which would shift the run left by a space.
  let current = null;
  for (const word of text.split(" ")) {
    // Nothing downstream can break a single word, so it would silently run off
    // the page rather than wrap.
    if (doc.widthOfString(word) > width) {
      throw new Error(
        `"${word}" is wider than its ${Math.round(width)}pt column in resume.pdf and would run off the page.`,
      );
    }
    const candidate = current === null ? word : `${current} ${word}`;
    if (current !== null && doc.widthOfString(candidate) > width) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  return current === null ? [] : [...lines, current];
}

/** Draws text wrapped to `width`, leaving `y` on its last line. */
function wrapped(text, x, {
  size = SIZE.body,
  font = "Helvetica",
  color = "black",
  width = RIGHT - x,
  leading = LEADING.body,
} = {}) {
  const lines = wrapToLines(text, width, font, size);
  pick(font, size).fillColor(color);
  lines.forEach((lineText, i) => {
    doc.text(lineText, x, y + i * leading, { lineBreak: false });
  });
  y += (lines.length - 1) * leading;
}

/** Draws one line that is never wrapped, leaving `y` where it was. */
function line(text, x, options = {}) {
  wrapped(text, x, { ...options, width: Infinity });
}

/** A bold label followed by a muted run, sharing one line. */
function runs(label, labelSize, rest, restSize = labelSize) {
  pick("Helvetica-Bold", labelSize)
    .fillColor("black")
    .text(label, LEFT, y, { lineBreak: false, continued: Boolean(rest) });
  if (rest) {
    pick("Helvetica", restSize).fillColor(MUTED).text(rest, { lineBreak: false });
  }
}

/** A muted date range set flush right, sharing the line a title starts on. */
function dateAt(dates, nudge = DATE_TOP.title) {
  pick("Helvetica", SIZE.date)
    .fillColor(MUTED)
    .text(dates, LEFT, y + nudge, {
      width: CONTENT_WIDTH,
      align: "right",
      lineBreak: false,
    });
}

/**
 * Draws U+2192 as a vector path, and returns the advance it occupies. pdfkit's
 * standard Helvetica is WinAnsi-encoded and has no arrow glyph — it renders one
 * as "!'". The stroke is inset inside the advance the way a real glyph's side
 * bearings would be.
 */
function drawArrow(x, baseline, size) {
  const advance = size * ARROW_EM;
  const inset = size * 0.06;
  const head = size * 0.21;
  const mid = baseline - size * 0.27;
  const len = advance - inset * 2;
  const start = x + inset;
  doc
    .save()
    .strokeColor("black")
    .lineWidth(size * 0.08)
    .lineJoin("round")
    .lineCap("round")
    .moveTo(start, mid)
    .lineTo(start + len, mid)
    .moveTo(start + len - head, mid - head * 0.75)
    .lineTo(start + len, mid)
    .lineTo(start + len - head, mid + head * 0.75)
    .stroke()
    .restore();
  return advance;
}

/** A bold title, drawn as runs around a vector arrow when it contains one. */
function title(text, x, size) {
  if (!text.includes(ARROW)) {
    line(text, x, { size, font: "Helvetica-Bold" });
    return;
  }
  const [before, after] = text.split(ARROW_SPLIT);
  const baseline = y + pick("Helvetica-Bold", size).currentLineHeight(false) * BASELINE_FRACTION;
  const arrowX = x + doc.widthOfString(`${before} `);
  // The spaces live in the drawn runs rather than only in the advance, so the
  // two titles stay separate words in the text layer itself. Extractors that
  // infer spacing from glyph positions (pdftotext does) read them apart either
  // way; this only helps a parser that concatenates runs blindly.
  line(`${before} `, x, { size, font: "Helvetica-Bold" });
  line(` ${after}`, arrowX + drawArrow(arrowX, baseline, size), {
    size,
    font: "Helvetica-Bold",
  });
}

/** Draws a bulleted list, leaving `y` on the last line of the last bullet. */
function bullets(highlights, x) {
  highlights.forEach((highlight, i) => {
    if (i > 0) y += LEADING.body;
    line("•", x + INDENT.bullet);
    wrapped(highlight, x + INDENT.bulletText, {
      width: RIGHT - x - INDENT.bulletText,
    });
  });
}

/** Draws a section heading with its rule, leaving `y` on the heading. */
function sectionHeading(text) {
  pick("Helvetica-Bold", SIZE.heading)
    .fillColor("black")
    .text(text.toUpperCase(), LEFT, y, {
      characterSpacing: 0.5,
      lineBreak: false,
    });
  const ruleY = y + SIZE.heading + 1.5;
  doc.moveTo(LEFT, ruleY).lineTo(RIGHT, ruleY).strokeColor(RULE).lineWidth(1).stroke();
}

/** A title line with a flush-right date range. */
function entry(text, dates, { x = LEFT, size = SIZE.title } = {}) {
  if (dates) dateAt(dates);
  title(text, x, size);
}

// --- Header -----------------------------------------------------------------

line(resume.basics.name, LEFT, { size: SIZE.name, font: "Helvetica-Bold" });
y += GAP.nameToLabel;
line(resume.basics.label, LEFT, { size: SIZE.label, color: ACCENT });
y += GAP.labelToContact;

// Location leads the contact line. The approved PDF has no location, but ATS
// and recruiter searches filter on it, and at SIZE.contact the line still runs
// well short of CONTENT_WIDTH, so this costs no vertical space on a full page.
const { city, region } = resume.basics.location ?? {};
const contact = [
  [city, region].filter(Boolean).join(", "),
  resume.basics.email,
  resume.basics.url?.replace(/^https?:\/\//, ""),
  ...resume.basics.profiles.map((p) => `${p.network}: ${p.username}`),
]
  .filter(Boolean)
  .join(" · ");
line(contact, LEFT, { size: SIZE.contact, color: MUTED });

if (resume.basics.summary) {
  y += GAP.contactToSummary;
  wrapped(resume.basics.summary, LEFT, { width: CONTENT_WIDTH });
}

// --- Experience -------------------------------------------------------------

/** Groups consecutive roles at the same employer, the way the resume reads. */
function groupByEmployer(work) {
  const groups = [];
  for (const job of work) {
    const last = groups.at(-1);
    if (last && last.name && last.name === job.name) last.roles.push(job);
    else groups.push({ name: job.name, roles: [job] });
  }
  return groups;
}

/** Whole years spanned by a group of roles, for its "N roles over M years". */
function spanYears(roles) {
  const months = (iso) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7));
  const start = months(roles.at(-1).startDate);
  const end = roles[0].endDate
    ? months(roles[0].endDate)
    : months(new Date().toISOString());
  return Math.round((end - start) / 12);
}

if (resume.work?.length) {
  y += GAP.toHeading;
  sectionHeading("Experience");
  y += GAP.headingToEntry;

  const groups = groupByEmployer(resume.work);
  for (const [g, group] of groups.entries()) {
    if (g > 0) {
      y += groups[g - 1].roles.length > 1 ? GAP.groupExitToTitle : GAP.bulletToTitle;
    }

    // A single-role employer reads as one plain entry.
    if (group.roles.length === 1) {
      const job = group.roles[0];
      entry(
        job.name ? `${job.position}, ${job.name}` : job.position,
        formatRange(job.startDate, job.endDate),
      );
      y += GAP.titleToBullet;
      bullets(job.highlights ?? [], LEFT);
      continue;
    }

    // Several roles at one employer: a company heading carrying the whole
    // span, then the roles indented behind a thin left rule so the group
    // reads as one continuous stretch of time rather than three jobs.
    dateAt(
      formatRange(group.roles.at(-1).startDate, group.roles[0].endDate),
      DATE_TOP.companyName,
    );
    runs(
      group.name,
      SIZE.companyName,
      `  ${group.roles.length} roles over ${spanYears(group.roles)} years`,
      SIZE.roleCount,
    );
    y += GAP.companyToNestedTitle;

    const groupTop = y;
    const groupX = LEFT + INDENT.group;
    for (const [r, job] of group.roles.entries()) {
      if (r > 0) y += GAP.bulletToNestedTitle;
      entry(job.position, formatRange(job.startDate, job.endDate), {
        x: groupX,
        size: SIZE.nestedRole,
      });
      y += GAP.titleToBullet;
      bullets(job.highlights ?? [], groupX);
    }
    doc
      .moveTo(LEFT + INDENT.rule, groupTop - 1)
      .lineTo(LEFT + INDENT.rule, y + LEADING.body - 2)
      .strokeColor(GROUP_RULE)
      .lineWidth(0.9)
      .stroke();
  }
}

// --- Projects ---------------------------------------------------------------

if (resume.projects?.length) {
  y += GAP.toHeading;
  sectionHeading("Projects");
  y += GAP.headingToEntry;

  for (const [i, project] of resume.projects.entries()) {
    if (i > 0) y += GAP.bulletToTitle;
    runs(
      project.name,
      SIZE.title,
      project.keywords?.length ? `  ${project.keywords.join(", ")}` : null,
    );
    y += GAP.titleToBullet;
    bullets(project.highlights ?? [], LEFT);
  }
}

// --- Education & certifications ---------------------------------------------

if (resume.education?.length || resume.certificates?.length) {
  y += GAP.toHeading;
  sectionHeading(
    resume.certificates?.length ? "Education & Certifications" : "Education",
  );
  y += GAP.headingToEntry;

  for (const [i, edu] of (resume.education ?? []).entries()) {
    if (i > 0) y += GAP.withinEducation;
    const degree = [edu.studyType, edu.area].filter(Boolean).join(" ");
    entry(
      [degree, edu.institution].filter(Boolean).join(", "),
      edu.endDate ? formatYears(edu.startDate, edu.endDate) : null,
    );
  }

  if (resume.certificates?.length) {
    y += GAP.withinEducation;
    line(resume.certificates.map((c) => c.name).join(" · "), LEFT, {
      size: SIZE.certs,
    });
  }
}

// --- Skills -----------------------------------------------------------------

/**
 * Names the best-known keywords in a group and counts the rest, so resume.json
 * can carry the whole list for anything reading it as data. The count rounds
 * down to a round number ("10+" for 13) so the claim survives the list growing.
 */
function skillLine(group) {
  const shown = group.keywords.slice(0, SKILLS_PREVIEW);
  const hidden = group.keywords.length - shown.length;
  if (hidden === 0) return shown.join(", ");
  const count = hidden >= 10 ? `${Math.floor(hidden / 10) * 10}+` : hidden;
  return `${shown.join(", ")}, and ${count} more`;
}

if (resume.skills?.length) {
  y += GAP.toHeading;
  sectionHeading("Skills");
  y += GAP.headingToEntry;

  for (const [i, group] of resume.skills.entries()) {
    if (i > 0) y += LEADING.skills;
    runs(`${group.name}: `, SIZE.skills, skillLine(group));
  }
}

// The resume is meant to fit on one page. Because the draws above are
// positioned explicitly, pdfkit's flow cursor never advances and its own
// pagination never triggers — so the check is against the cursor this script
// owns, before the document is finalised.
const used = y + pick("Helvetica", SIZE.body).currentLineHeight(false);
if (used > BOTTOM) {
  throw new Error(
    `resume.pdf overflowed its single page by ${Math.ceil(used - BOTTOM)}pt. ` +
      "Trim resume.json or tighten the layout in scripts/generate-resume-pdf.mjs.",
  );
}

doc.end();

const filled = (used - doc.page.margins.top) / (BOTTOM - doc.page.margins.top);
console.log(`resume.pdf: 1 page, ${Math.round(filled * 100)}% filled`);
