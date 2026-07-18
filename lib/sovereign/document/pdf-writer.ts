/**
 * SOVEREIGN — PDF Advisory Brief Writer
 * Generates formatted PDF output from SOVEREIGN advisory text.
 * Uses pdfkit (server-side, no browser dependency).
 *
 * Format: HeadsUp OS branded advisory brief — black + gold accent.
 */

import PDFDocument from "pdfkit";

const HU_GOLD = "#C9A84C";
const HU_BLACK = "#0A0A0A";
const HU_GRAY = "#4A4A4A";
const HU_LIGHT = "#F5F5F5";

export interface AdvisoryBriefInput {
  title: string;
  athleteName?: string;
  userRole: string;
  advisoryText: string;
  confidenceBand: string;
  tierReason?: string;
  riskFlags?: string[];
  escalationId?: string;
  generatedAt?: string;
}

export async function generateAdvisoryPdf(input: AdvisoryBriefInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      info: {
        Title: input.title,
        Author: "SOVEREIGN — HU-OS Super Agent",
        Subject: "Advisory Intelligence Brief",
        Creator: "HeadsUp OS v3.0.0",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 144; // content width at 1" margins

    // ── Header bar ──
    doc.rect(72, 36, pageWidth, 3).fill(HU_GOLD);

    // ── Logo / brand line ──
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(HU_GRAY)
      .text("HEADSUP OS  ·  THE HEADS UP! FOUNDATION  ·  DALLAS, TX", 72, 50, { align: "center" });

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(HU_GOLD)
      .text("ADVISORY INTELLIGENCE — NOT LEGAL COUNSEL", 72, 62, { align: "center" });

    // ── Title block ──
    doc.moveDown(2);
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(HU_BLACK)
      .text(input.title, { align: "left" });

    if (input.athleteName) {
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor(HU_GRAY)
        .text(`Sovereign Asset: ${input.athleteName}`, { align: "left" });
    }

    // ── Meta row ──
    doc.moveDown(0.5);
    const meta = [
      `Role: ${input.userRole}`,
      `Confidence: ${input.confidenceBand}`,
      `Generated: ${input.generatedAt ?? new Date().toISOString().split("T")[0]}`,
      input.escalationId ? `Escalation ID: ${input.escalationId.slice(0, 8)}...` : null,
    ]
      .filter(Boolean)
      .join("   ·   ");

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(HU_GRAY)
      .text(meta, { align: "left" });

    // ── Divider ──
    doc.moveDown(0.75);
    doc.moveTo(72, doc.y).lineTo(72 + pageWidth, doc.y).strokeColor(HU_GOLD).lineWidth(1).stroke();
    doc.moveDown(0.75);

    // ── Risk flags (Tier 2 only) ──
    if (input.riskFlags?.length) {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(HU_BLACK)
        .text("RISK FLAGS IDENTIFIED", { align: "left" });

      doc.moveDown(0.25);
      for (const flag of input.riskFlags) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(HU_GRAY)
          .text(`• ${flag}`, { indent: 16 });
      }

      if (input.tierReason) {
        doc.moveDown(0.25);
        doc
          .font("Helvetica-Oblique")
          .fontSize(9)
          .fillColor(HU_GRAY)
          .text(`Escalation reason: ${input.tierReason}`);
      }

      doc.moveDown(0.75);
      doc.moveTo(72, doc.y).lineTo(72 + pageWidth, doc.y).strokeColor(HU_LIGHT).lineWidth(0.5).stroke();
      doc.moveDown(0.75);
    }

    // ── Advisory body ──
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(HU_BLACK)
      .text("ADVISORY OUTPUT", { align: "left" });

    doc.moveDown(0.5);

    // Render advisory text — preserve paragraph breaks
    const paragraphs = input.advisoryText.split(/\n\n+/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Detect section headers (ALL CAPS lines or lines ending with colon)
      if (/^[A-Z][A-Z\s&:–—-]{4,}$/.test(trimmed) || /^[A-Z].{0,60}:$/.test(trimmed)) {
        doc.moveDown(0.5);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(HU_BLACK)
          .text(trimmed);
        doc.moveDown(0.25);
      } else if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(HU_GRAY)
          .text(trimmed, { indent: 16 });
      } else {
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(HU_BLACK)
          .text(trimmed, { lineGap: 2 });
        doc.moveDown(0.4);
      }
    }

    // ── Footer ──
    doc.moveDown(1.5);
    doc.moveTo(72, doc.y).lineTo(72 + pageWidth, doc.y).strokeColor(HU_GOLD).lineWidth(1).stroke();
    doc.moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(HU_GRAY)
      .text(
        "This document is produced by SOVEREIGN, the HU-OS Super Agent. " +
        "Advisory intelligence only — not legal counsel. " +
        "NCAA eligibility must be verified through the NCAA Eligibility Center at eligibilitycenter.org. " +
        "No output constitutes a binding recommendation, contract, or legal opinion.",
        { align: "left", lineGap: 2 }
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(HU_GOLD)
      .moveDown(0.5)
      .text("© 2026 The Heads Up! Foundation · Dallas, TX · CONFIDENTIAL", { align: "center" });

    doc.end();
  });
}
