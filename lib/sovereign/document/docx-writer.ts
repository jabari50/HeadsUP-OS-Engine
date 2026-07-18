/**
 * SOVEREIGN — DOCX Editable Draft Writer
 * Generates .docx advisory drafts for Tier 2 escalation outputs
 * that Jabari can review, annotate, and send directly.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  HeadingLevel,
  Header,
  Footer,
  PageNumber,
} from "docx";

const HU_GOLD = "C9A84C";
const HU_BLACK = "0A0A0A";
const HU_GRAY = "4A4A4A";
const HU_LIGHT = "F5F5F5";

export interface DraftDocxInput {
  title: string;
  athleteName?: string;
  userRole: string;
  advisoryText: string;
  confidenceBand: string;
  riskFlags?: string[];
  tierReason?: string;
  escalationId?: string;
  generatedAt?: string;
}

function divider(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: HU_GOLD, space: 1 } },
    spacing: { after: 200 },
    children: [],
  });
}

function metaTable(input: DraftDocxInput): Table {
  const cellBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  const rows: [string, string][] = [
    ["Role", input.userRole],
    ["Confidence Band", input.confidenceBand],
    ["Generated", input.generatedAt ?? new Date().toISOString().split("T")[0]],
  ];
  if (input.athleteName) rows.unshift(["Sovereign Asset", input.athleteName]);
  if (input.escalationId) rows.push(["Escalation ID", input.escalationId.slice(0, 8) + "..."]);

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              borders,
              width: { size: 2400, type: WidthType.DXA },
              shading: { fill: HU_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, bold: true, size: 18, font: "Arial", color: HU_GRAY })],
                }),
              ],
            }),
            new TableCell({
              borders,
              width: { size: 6960, type: WidthType.DXA },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: value, size: 18, font: "Arial", color: HU_BLACK })],
                }),
              ],
            }),
          ],
        })
    ),
  });
}

function buildAdvisoryParagraphs(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const blocks = text.split(/\n\n+/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Section header detection
    if (/^[A-Z][A-Z\s&:–—-]{4,}$/.test(trimmed) || /^[A-Z].{0,60}:$/.test(trimmed)) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: trimmed, bold: true, size: 22, font: "Arial", color: HU_BLACK })],
        })
      );
      continue;
    }

    // Bullet lines
    if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
      for (const line of trimmed.split("\n")) {
        const content = line.replace(/^[•\-*]\s*/, "").trim();
        if (!content) continue;
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: content, size: 20, font: "Arial", color: HU_BLACK })],
          })
        );
      }
      continue;
    }

    // Multi-line block — split by newline
    for (const line of trimmed.split("\n")) {
      const l = line.trim();
      if (!l) continue;
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: l, size: 20, font: "Arial", color: HU_BLACK })],
        })
      );
    }
  }

  return paragraphs;
}

export async function generateAdvisoryDocx(input: DraftDocxInput): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // Brand header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "HEADSUP OS  ·  THE HEADS UP! FOUNDATION  ·  DALLAS, TX", size: 16, font: "Arial", color: HU_GRAY }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: "ADVISORY INTELLIGENCE — NOT LEGAL COUNSEL", size: 16, bold: true, font: "Arial", color: HU_GOLD }),
      ],
    })
  );

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [new TextRun({ text: input.title, bold: true, size: 36, font: "Arial", color: HU_BLACK })],
    })
  );

  // Meta table
  children.push(metaTable(input));
  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  children.push(divider());

  // Risk flags
  if (input.riskFlags?.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: "RISK FLAGS IDENTIFIED", bold: true, size: 22, font: "Arial", color: HU_BLACK })],
      })
    );
    for (const flag of input.riskFlags) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [new TextRun({ text: flag, size: 20, font: "Arial", color: HU_GRAY })],
        })
      );
    }
    if (input.tierReason) {
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Escalation reason: ", bold: true, italics: true, size: 18, font: "Arial", color: HU_GRAY }),
            new TextRun({ text: input.tierReason, italics: true, size: 18, font: "Arial", color: HU_GRAY }),
          ],
        })
      );
    }
    children.push(divider());
  }

  // Advisory body
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: "ADVISORY OUTPUT", bold: true, size: 22, font: "Arial", color: HU_BLACK })],
    })
  );
  children.push(...buildAdvisoryParagraphs(input.advisoryText));

  // Disclaimer
  children.push(divider());
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: "Advisory intelligence only — not legal counsel. NCAA eligibility must be verified through the NCAA Eligibility Center at eligibilitycenter.org. No output constitutes a binding recommendation, contract, or legal opinion.",
          size: 16,
          font: "Arial",
          color: HU_GRAY,
          italics: true,
        }),
      ],
    })
  );

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 20 } } },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, font: "Arial", color: HU_BLACK },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: "Arial", color: HU_BLACK },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: HU_GOLD, space: 1 } },
                children: [
                  new TextRun({ text: "SOVEREIGN  ·  HU-OS ADVISORY BRIEF", size: 16, font: "Arial", color: HU_GRAY }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: HU_GOLD, space: 1 } },
                children: [
                  new TextRun({ text: "© 2026 The Heads Up! Foundation  ·  Page ", size: 16, font: "Arial", color: HU_GRAY }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: HU_GRAY }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
