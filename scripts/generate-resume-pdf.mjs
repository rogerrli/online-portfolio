// Renders public/resume.json into public/resume.pdf so recruiters/ATS tools
// have a plain PDF to grab, while resume.json stays the single source of truth.
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

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(isoDate) {
  return MONTH_YEAR.format(new Date(isoDate));
}

function formatRange(startDate, endDate) {
  return `${formatDate(startDate)} - ${endDate ? formatDate(endDate) : "Present"}`;
}

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 56, bottom: 50, left: 54, right: 54 },
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
    "resume.pdf overflowed onto a second page. Trim resume.json or tighten the layout in this script.",
  );
});

const ACCENT = "#404040";
const MUTED = "#666666";

const LEFT = doc.page.margins.left;
const CONTENT_WIDTH =
  doc.page.width - doc.page.margins.left - doc.page.margins.right;
const DATE_SIZE = 9;
// Room for the widest date range ("Oct 2019 - Present") at DATE_SIZE.
const DATE_COLUMN = 90;

// Draws a bold title on the left and a muted date range flush right, sharing one
// line. Stacking them cost ~13pt per entry, which is what pushed the PDF over.
function entryRow(title, dates, titleSize) {
  const top = doc.y;
  doc
    .font("Helvetica")
    .fontSize(DATE_SIZE)
    .fillColor(MUTED)
    .text(dates, LEFT, top + (titleSize - DATE_SIZE) * 0.7, {
      width: CONTENT_WIDTH,
      align: "right",
      lineBreak: false,
    });
  doc
    .font("Helvetica-Bold")
    .fontSize(titleSize)
    .fillColor("black")
    .text(title, LEFT, top, { width: CONTENT_WIDTH - DATE_COLUMN });
  doc.x = LEFT;
}

doc.font("Helvetica-Bold").fontSize(22).fillColor("black").text(resume.basics.name);
doc.font("Helvetica").fontSize(13).fillColor(ACCENT).text(resume.basics.label);
doc.moveDown(0.4);

const contactParts = [
  resume.basics.email,
  resume.basics.url?.replace(/^https?:\/\//, ""),
  ...resume.basics.profiles.map((p) => `${p.network}: ${p.username}`),
];
doc.font("Helvetica").fontSize(9.5).fillColor(MUTED).text(contactParts.join("   ·   "));
doc.moveDown(0.9);

if (resume.basics.summary) {
  doc.font("Helvetica").fontSize(10.5).fillColor("black").text(resume.basics.summary, {
    align: "left",
  });
  doc.moveDown(1.1);
}

function sectionHeading(title) {
  doc.font("Helvetica-Bold").fontSize(12).fillColor("black").text(title.toUpperCase(), {
    characterSpacing: 0.5,
  });
  doc
    .moveTo(LEFT, doc.y + 2)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
    .strokeColor("#cccccc")
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.65);
}

if (resume.work?.length) {
  sectionHeading("Experience");
  for (const job of resume.work) {
    const titleLine = job.name ? `${job.position}, ${job.name}` : job.position;

    entryRow(titleLine, formatRange(job.startDate, job.endDate), 11);

    if (job.summary) {
      doc.font("Helvetica").fontSize(10).fillColor("black").text(job.summary);
    }
    doc.moveDown(0.8);
  }
}

if (resume.education?.length) {
  sectionHeading("Education");
  for (const edu of resume.education) {
    const line = [edu.studyType, edu.area].filter(Boolean).join(" ");
    entryRow(edu.institution, formatDate(edu.endDate), 10.5);
    doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(line);
    doc.moveDown(0.5);
  }
}

if (resume.certificates?.length) {
  sectionHeading("Certificates");
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("black")
    .text(resume.certificates.map((c) => c.name).join("   ·   "));
  doc.moveDown(1.0);
}

if (resume.skills?.length) {
  sectionHeading("Skills");
  for (const group of resume.skills) {
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("black")
      .text(`${group.name}: `, { continued: true })
      .font("Helvetica")
      .fillColor(MUTED)
      .text(group.keywords.join(", "));
    doc.moveDown(0.4);
  }
}

doc.end();

const filled =
  (doc.y - doc.page.margins.top) /
  (doc.page.height - doc.page.margins.top - doc.page.margins.bottom);
console.log(`resume.pdf: 1 page, ${Math.round(filled * 100)}% filled`);
