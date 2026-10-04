// Browser builds imported on demand by lib/extract-text.ts.
declare module "mammoth/mammoth.browser.min.js" {
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
}
declare module "pdfjs-dist/build/pdf.worker.min.mjs";
