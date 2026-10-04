/**
 * Turns an attached document into plain text in the browser. The API takes
 * text only, so the file never leaves the device: its text joins the prompt
 * like a long paste. The PDF and Word readers are loaded on demand.
 */

export const ATTACH_ACCEPT = ".pdf,.docx,.txt,.md";

export class UnsupportedFileError extends Error {}

async function pdfText(file: File): Promise<string> {
  // Registers the worker on the main thread (pdf.js "fake worker"): no worker
  // file to host, and a one-off extraction does not need a thread of its own.
  await import("pdfjs-dist/build/pdf.worker.min.mjs");
  const pdfjs = await import("pdfjs-dist");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    pages.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" ").replace(/\s+/g, " ").trim());
  }
  return pages.filter(Boolean).join("\n\n");
}

async function docxText(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser.min.js");
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value;
}

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  let text: string;
  if (name.endsWith(".pdf")) text = await pdfText(file);
  else if (name.endsWith(".docx")) text = await docxText(file);
  else if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) text = await file.text();
  else throw new UnsupportedFileError(file.name);
  return text.replace(/\n{3,}/g, "\n\n").trim();
}
