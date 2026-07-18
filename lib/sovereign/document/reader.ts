/**
 * SOVEREIGN — Document Reader
 * Parses PDF, JSON, and DOCX inputs submitted for review.
 * ZHR: returns null for any field that cannot be confirmed from source bytes.
 * All parsing is server-side — no client exposure.
 */

import type { DocumentType } from "../system-prompt";

export type SupportedMimeType =
  | "application/pdf"
  | "application/json"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface ParsedDocument {
  documentType: DocumentType;
  mimeType: SupportedMimeType;
  fileName: string;
  textContent: string;
  pageCount: number | null;
  characterCount: number;
  extractedAt: string;
  parseWarnings: string[];
}

function detectDocumentType(fileName: string, mimeType: string): DocumentType {
  const lower = fileName.toLowerCase();
  if (lower.includes("nil") && (lower.includes("contract") || lower.includes("agreement"))) return "NIL_CONTRACT";
  if (lower.includes("loi") || lower.includes("letter-of-intent") || lower.includes("letter_of_intent")) return "LOI";
  if (lower.includes("partnership") || lower.includes("sponsor")) return "PARTNERSHIP_AGREEMENT";
  if (mimeType === "application/json") return "OTHER";
  return "OTHER";
}

export async function parsePdf(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  const warnings: string[] = [];

  // Dynamic import — pdf-parse is CJS; cast to callable via unknown
  const pdfParse = (await import("pdf-parse")).default as unknown as (buf: Buffer) => Promise<{ text: string; numpages: number }>;

  let result: { text: string; numpages: number };
  try {
    result = await pdfParse(buffer);
  } catch (err) {
    warnings.push(`PDF parse error: ${(err as Error).message}`);
    return {
      documentType: detectDocumentType(fileName, "application/pdf"),
      mimeType: "application/pdf",
      fileName,
      textContent: "",
      pageCount: null,
      characterCount: 0,
      extractedAt: new Date().toISOString(),
      parseWarnings: warnings,
    };
  }

  // Normalize whitespace — PDF parsers often produce excessive line breaks
  const text = result.text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!text) warnings.push("PDF extracted with no readable text — may be image-based or encrypted.");

  return {
    documentType: detectDocumentType(fileName, "application/pdf"),
    mimeType: "application/pdf",
    fileName,
    textContent: text,
    pageCount: result.numpages ?? null,
    characterCount: text.length,
    extractedAt: new Date().toISOString(),
    parseWarnings: warnings,
  };
}

export async function parseJson(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  const warnings: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(buffer.toString("utf-8"));
  } catch {
    warnings.push("Invalid JSON — could not parse.");
    return {
      documentType: "OTHER",
      mimeType: "application/json",
      fileName,
      textContent: "",
      pageCount: null,
      characterCount: 0,
      extractedAt: new Date().toISOString(),
      parseWarnings: warnings,
    };
  }

  const text = JSON.stringify(parsed, null, 2);
  return {
    documentType: detectDocumentType(fileName, "application/json"),
    mimeType: "application/json",
    fileName,
    textContent: text,
    pageCount: null,
    characterCount: text.length,
    extractedAt: new Date().toISOString(),
    parseWarnings: warnings,
  };
}

export async function parseDocx(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  const warnings: string[] = [];

  // Extract text from DOCX (ZIP containing word/document.xml)
  const JSZip = (await import("jszip")).default;
  let zip: InstanceType<typeof JSZip>;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    warnings.push("Could not unzip DOCX — file may be corrupted.");
    return {
      documentType: detectDocumentType(fileName, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileName,
      textContent: "",
      pageCount: null,
      characterCount: 0,
      extractedAt: new Date().toISOString(),
      parseWarnings: warnings,
    };
  }

  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) {
    warnings.push("word/document.xml not found in DOCX archive.");
    return {
      documentType: detectDocumentType(fileName, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileName,
      textContent: "",
      pageCount: null,
      characterCount: 0,
      extractedAt: new Date().toISOString(),
      parseWarnings: warnings,
    };
  }

  // Extract text runs from XML
  const textRuns = Array.from(docXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g));
  const paragraphs = Array.from(docXml.matchAll(/<w:p[ >]([\s\S]*?)<\/w:p>/g));

  // Reconstruct paragraph-level text
  const lines: string[] = [];
  for (const [, pContent] of paragraphs) {
    const runs = Array.from(pContent.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g));
    const line = runs.map(([, t]) => t).join("").trim();
    if (line) lines.push(line);
  }

  // Fallback to raw text runs if paragraph parsing yields nothing
  const text = lines.length > 0
    ? lines.join("\n")
    : textRuns.map(([, t]) => t).join(" ").trim();

  if (!text) warnings.push("DOCX extracted with no readable text.");

  return {
    documentType: detectDocumentType(fileName, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileName,
    textContent: text,
    pageCount: null,
    characterCount: text.length,
    extractedAt: new Date().toISOString(),
    parseWarnings: warnings,
  };
}

export async function parseDocument(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedDocument> {
  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    return parsePdf(buffer, fileName);
  }
  if (mimeType === "application/json" || fileName.endsWith(".json")) {
    return parseJson(buffer, fileName);
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    return parseDocx(buffer, fileName);
  }

  return {
    documentType: "OTHER",
    mimeType: mimeType as SupportedMimeType,
    fileName,
    textContent: "",
    pageCount: null,
    characterCount: 0,
    extractedAt: new Date().toISOString(),
    parseWarnings: [`Unsupported file type: ${mimeType}`],
  };
}
