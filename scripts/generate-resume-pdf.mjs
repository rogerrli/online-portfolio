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

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(isoDate) {
  const [year, month] = isoDate.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

function formatRange(startDate, endDate) {
  return `${formatDate(startDate)} – ${endDate ? formatDate(endDate) : "Present"}`;
}

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 56, bottom: 56, left: 56, right: 56 },
  info: {
    Title: `${resume.basics.name} – Resume`,
    Author: resume.basics.name,
  },
});
doc.pipe(createWriteStream(path.join(REPO_ROOT, "public", "resume.pdf")));

const ACCENT = "#404040";
const MUTED = "#666666";

doc.font("Helvetica-Bold").fontSize(22).fillColor("black").text(resume.basics.name);
doc.font("Helvetica").fontSize(13).fillColor(ACCENT).text(resume.basics.label);
doc.moveDown(0.4);

const contactParts = [
  resume.basics.email,
  resume.basics.url?.replace(/^https?:\/\//, ""),
  ...resume.basics.profiles.map((p) => `${p.network}: ${p.username}`),
];
doc.font("Helvetica").fontSize(9.5).fillColor(MUTED).text(contactParts.join("   ·   "));
doc.moveDown(1);

if (resume.basics.summary) {
  doc.font("Helvetica").fontSize(10.5).fillColor("black").text(resume.basics.summary, {
    align: "left",
  });
  doc.moveDown(1.2);
}

function sectionHeading(title) {
  doc.font("Helvetica-Bold").fontSize(12).fillColor("black").text(title.toUpperCase(), {
    characterSpacing: 0.5,
  });
  doc
    .moveTo(doc.x, doc.y + 2)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
    .strokeColor("#cccccc")
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.6);
}

if (resume.work?.length) {
  sectionHeading("Experience");
  for (const job of resume.work) {
    const titleLine = job.name ? `${job.position} — ${job.name}` : job.position;

    doc.font("Helvetica-Bold").fontSize(11).fillColor("black").text(titleLine);
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(MUTED)
      .text(formatRange(job.startDate, job.endDate));

    doc.moveDown(0.2);
    if (job.summary) {
      doc.font("Helvetica").fontSize(10).fillColor("black").text(job.summary);
    }
    doc.moveDown(0.7);
  }
}

if (resume.education?.length) {
  sectionHeading("Education");
  for (const edu of resume.education) {
    const line = [edu.studyType, edu.area].filter(Boolean).join(" ");
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor("black").text(edu.institution);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(MUTED)
      .text(`${line} — ${formatDate(edu.endDate)}`);
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
  doc.moveDown(0.9);
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
    doc.moveDown(0.3);
  }
}

doc.end();
