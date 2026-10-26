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
// pdfkit's default leading and mixes flush-right dates into title lines.
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

// The date column rides slightly above the title line it shares.
const DATE_NUDGE = -0.7;

// Advance the drawn arrow occupies, measured off the approved title.
const ARROW_EM = 0.857;

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
  eduToCerts: 10.5,
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
  margins: { top: 40, bottom: 34, left: 45.6, right: 45.6 },
  info: {
    Title: `${resume.basics.name} Resume`,
    Author: resume.basics.name,
  },
});
doc.pipe(createWriteStream(path.join(REPO_ROOT, "public", "resume.pdf")));

// The resume is meant to fit on a single page. If content grows past it, fail
// the build rather than quietly shipping a two-page PDF.
doc.on("pageAdded", () => {
  throw new Error(
    "resume.pdf overflowed onto a second page. Trim resume.json or tighten the layout in scripts/generate-resume-pdf.mjs.",
  );
});

const LEFT = doc.page.margins.left;
const RIGHT = doc.page.width - doc.page.margins.right;
const CONTENT_WIDTH = RIGHT - LEFT;

/** Top of the next line to draw. Every helper reads and advances this. */
let y = GAP.top;

const pick = (font, size) => doc.font(font).fontSize(size);

/**
 * Keeps hyphenated words whole when a line wraps. pdfkit breaks lines with the
 * Unicode UAX #14 algorithm, which treats a hyphen as a break opportunity, so
 * "API-layer" can land as "API-" / "layer" across two lines. The approved
 * layout breaks on spaces only, so the wrapping is done here instead.
 *
 * pdfkit breaks lines with the Unicode UAX #14 algorithm, which treats a hyphen
 * as a break opportunity and would strand "API-layer" as "API-" / "layer". The
 * usual escapes don't survive the standard fonts: a word joiner (U+2060) isn't
 * in WinAnsi, so pdfkit substitutes a visible glyph into the page.
 */
function wrapToLines(text, width, font, size) {
  pick(font, size);
  const lines = [];
  let current = "";
  for (const word of text.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && doc.widthOfString(candidate) > width) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Draws wrapped text and returns the top of its *last* line, since every gap
 * in the spec is measured from there.
 */
function wrapped(text, x, {
  size = SIZE.body,
  font = "Helvetica",
  color = "black",
  width = RIGHT - x,
  leading = LEADING.body,
  top = y,
} = {}) {
  const lines = wrapToLines(text, width, font, size);
  lines.forEach((text, i) => {
    pick(font, size)
      .fillColor(color)
      .text(text, x, top + i * leading, { lineBreak: false });
  });
  doc.x = LEFT;
  return top + (lines.length - 1) * leading;
}

/** Draws a single line that must not wrap, and returns its top. */
function line(text, x, { size = SIZE.body, font = "Helvetica", color = "black", top = y } = {}) {
  pick(font, size).fillColor(color).text(text, x, top, { lineBreak: false });
  doc.x = LEFT;
  return top;
}

/**
 * A muted date range set flush right, sharing the line a title starts on.
 * `nudge` overrides the default rise for the taller company-group heading.
 */
function dateAt(dates, top, nudge = DATE_NUDGE) {
  pick("Helvetica", SIZE.date)
    .fillColor(MUTED)
    .text(dates, LEFT, top + nudge, {
      width: CONTENT_WIDTH,
      align: "right",
      lineBreak: false,
    });
  doc.x = LEFT;
}

/**
 * Draws U+2192 as a vector path, and returns the advance it occupies. pdfkit's
 * standard Helvetica is WinAnsi-encoded and has no arrow glyph — it renders one
 * as "!'" — and embedding a font for this single character would change the
 * metrics of every title around it. The stroke is inset inside the advance the
 * way a real glyph's side bearings would be.
 */
function drawArrow(x, baseline, size) {
  const advance = size * ARROW_EM;
  const inset = size * 0.06;
  const head = size * 0.21;
  const mid = baseline - size * 0.27;
  const len = advance - inset * 2;
  x += inset;
  doc
    .save()
    .strokeColor("black")
    .lineWidth(size * 0.08)
    .lineJoin("round")
    .lineCap("round")
    .moveTo(x, mid)
    .lineTo(x + len, mid)
    .moveTo(x + len - head, mid - head * 0.75)
    .lineTo(x + len, mid)
    .lineTo(x + len - head, mid + head * 0.75)
    .stroke()
    .restore();
  return advance;
}

/** A bold title, drawn as runs around a vector arrow when it contains one. */
function title(text, x, size, top = y) {
  if (!text.includes(ARROW)) {
    return line(text, x, { size, font: "Helvetica-Bold", top });
  }
  const [before, after] = text.split(new RegExp(`\\s*${ARROW}\\s*`));
  pick("Helvetica-Bold", size);
  const space = doc.widthOfString(" ");
  const beforeEnd = x + doc.widthOfString(before);
  line(before, x, { size, font: "Helvetica-Bold", top });
  // The baseline sits one ascender below the line's top edge.
  const baseline = top + pick("Helvetica-Bold", size).currentLineHeight(false) * 0.775;
  const arrowLen = drawArrow(beforeEnd + space, baseline, size);
  line(after, beforeEnd + space + arrowLen + space, { size, font: "Helvetica-Bold", top });
  return top;
}

/** Draws a bulleted list and returns the top of its last line. */
function bullets(highlights, x) {
  let last = y;
  for (const highlight of highlights) {
    line("•", x + INDENT.bullet, { top: y });
    last = wrapped(highlight, x + INDENT.bulletText, {
      width: RIGHT - x - INDENT.bulletText,
      top: y,
    });
    y = last + LEADING.body;
  }
  return last;
}

/** Draws a section heading with its rule, and returns its top. */
function sectionHeading(text) {
  const top = y;
  pick("Helvetica-Bold", SIZE.heading)
    .fillColor("black")
    .text(text.toUpperCase(), LEFT, top, {
      characterSpacing: 0.5,
      lineBreak: false,
    });
  const ruleY = top + SIZE.heading + 1.5;
  doc.moveTo(LEFT, ruleY).lineTo(RIGHT, ruleY).strokeColor(RULE).lineWidth(1).stroke();
  doc.x = LEFT;
  return top;
}

/** A title line with a flush-right date range. Returns the title's last line. */
function entry(text, dates, { x = LEFT, size = SIZE.title } = {}) {
  if (dates) dateAt(dates, y);
  return title(text, x, size);
}

// --- Header -----------------------------------------------------------------

line(resume.basics.name, LEFT, { size: SIZE.name, font: "Helvetica-Bold" });
y += GAP.nameToLabel;
line(resume.basics.label, LEFT, { size: SIZE.label, color: ACCENT });
y += GAP.labelToContact;

const contact = [
  resume.basics.email,
  resume.basics.url?.replace(/^https?:\/\//, ""),
  ...resume.basics.profiles.map((p) => `${p.network}: ${p.username}`),
].join(" · ");
line(contact, LEFT, { size: SIZE.contact, color: MUTED });

if (resume.basics.summary) {
  y += GAP.contactToSummary;
  y = wrapped(resume.basics.summary, LEFT, { width: CONTENT_WIDTH });
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
  const start = new Date(roles.at(-1).startDate);
  const end = new Date(roles[0].endDate ?? Date.now());
  return Math.round((end - start) / (365.25 * 24 * 60 * 60 * 1000));
}

if (resume.work?.length) {
  y += GAP.toHeading;
  y = sectionHeading("Experience") + GAP.headingToEntry;

  const groups = groupByEmployer(resume.work);
  for (const [g, group] of groups.entries()) {
    if (g > 0) {
      y += groups[g - 1].roles.length > 1 ? GAP.groupExitToTitle : GAP.bulletToTitle;
    }

    // A single-role employer reads as one plain entry.
    if (group.roles.length === 1) {
      const job = group.roles[0];
      y = entry(
        job.name ? `${job.position}, ${job.name}` : job.position,
        formatRange(job.startDate, job.endDate),
      );
      y += GAP.titleToBullet;
      y = bullets(job.highlights ?? [], LEFT);
      continue;
    }

    // Several roles at one employer: a company heading carrying the whole
    // span, then the roles indented behind a thin left rule so the group
    // reads as one continuous stretch of time rather than three jobs.
    dateAt(formatRange(group.roles.at(-1).startDate, group.roles[0].endDate), y, 0.5);
    pick("Helvetica-Bold", SIZE.companyName)
      .fillColor("black")
      .text(group.name, LEFT, y, { lineBreak: false, continued: true })
      .font("Helvetica")
      .fontSize(SIZE.roleCount)
      .fillColor(MUTED)
      .text(`  ${group.roles.length} roles over ${spanYears(group.roles)} years`, {
        lineBreak: false,
      });
    doc.x = LEFT;
    y += GAP.companyToNestedTitle;

    const groupTop = y;
    const groupX = LEFT + INDENT.group;
    for (const [r, job] of group.roles.entries()) {
      if (r > 0) y += GAP.bulletToNestedTitle;
      dateAt(formatRange(job.startDate, job.endDate), y);
      title(job.position, groupX, SIZE.nestedRole);
      y += GAP.titleToBullet;
      y = bullets(job.highlights ?? [], groupX);
    }
    doc
      .moveTo(LEFT + INDENT.rule, groupTop - 1)
      .lineTo(LEFT + INDENT.rule, y + LEADING.body - 2)
      .strokeColor(GROUP_RULE)
      .lineWidth(0.9)
      .stroke();
    doc.x = LEFT;
  }
}

// --- Projects ---------------------------------------------------------------

if (resume.projects?.length) {
  y += GAP.toHeading;
  y = sectionHeading("Projects") + GAP.headingToEntry;

  for (const [i, project] of resume.projects.entries()) {
    if (i > 0) y += GAP.bulletToTitle;
    pick("Helvetica-Bold", SIZE.title)
      .fillColor("black")
      .text(project.name, LEFT, y, { lineBreak: false, continued: !!project.keywords?.length });
    if (project.keywords?.length) {
      doc
        .font("Helvetica")
        .fillColor(MUTED)
        .text(`  ${project.keywords.join(", ")}`, { lineBreak: false });
    }
    doc.x = LEFT;
    y += GAP.titleToBullet;
    y = bullets(project.highlights ?? [], LEFT);
  }
}

// --- Education & certifications ---------------------------------------------

if (resume.education?.length || resume.certificates?.length) {
  y += GAP.toHeading;
  y = sectionHeading(
    resume.certificates?.length ? "Education & Certifications" : "Education",
  ) + GAP.headingToEntry;

  for (const [i, edu] of (resume.education ?? []).entries()) {
    if (i > 0) y += GAP.eduToCerts;
    const degree = [edu.studyType, edu.area].filter(Boolean).join(" ");
    y = entry(
      [degree, edu.institution].filter(Boolean).join(", "),
      edu.endDate ? formatYears(edu.startDate, edu.endDate) : null,
    );
  }

  if (resume.certificates?.length) {
    y += GAP.eduToCerts;
    y = line(resume.certificates.map((c) => c.name).join(" · "), LEFT, {
      size: SIZE.certs,
    });
  }
}

// --- Skills -----------------------------------------------------------------

if (resume.skills?.length) {
  y += GAP.toHeading;
  y = sectionHeading("Skills") + GAP.headingToEntry;

  for (const [i, group] of resume.skills.entries()) {
    if (i > 0) y += LEADING.skills;
    pick("Helvetica-Bold", SIZE.skills)
      .fillColor("black")
      .text(`${group.name}: `, LEFT, y, { lineBreak: false, continued: true })
      .font("Helvetica")
      .fillColor(MUTED)
      .text(group.keywords.join(", "), { lineBreak: false });
    doc.x = LEFT;
  }
}

doc.end();

const used = y + SIZE.body;
const filled =
  (used - doc.page.margins.top) /
  (doc.page.height - doc.page.margins.top - doc.page.margins.bottom);
console.log(`resume.pdf: 1 page, ${Math.round(filled * 100)}% filled`);
