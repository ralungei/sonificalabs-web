import type { LabResult, LabTestRun, LabFinding, QACheck, EscaletaTrack } from "./types";
import { LAB_STORAGE_KEY, LAB_FINDINGS_KEY, LAB_MAX_RUNS, NONE } from "./constants";

export function loadLabRuns(): LabTestRun[] {
  try {
    const raw = localStorage.getItem(LAB_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveLabRuns(runs: LabTestRun[]) {
  localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(runs.slice(0, LAB_MAX_RUNS)));
}

export function loadFindings(): LabFinding[] {
  try {
    const raw = localStorage.getItem(LAB_FINDINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveFindings(findings: LabFinding[]) {
  localStorage.setItem(LAB_FINDINGS_KEY, JSON.stringify(findings));
}

// ── Auto-scoring & Coherence ────────────────────────────────────

export function analyzeResult(prompt: string, result: LabResult): { score: number; checks: QACheck[] } {
  const checks: QACheck[] = [];
  const esc = result.escaleta;
  if (!esc || !esc.tracks?.length) {
    return { score: 0, checks: [{ label: "Escaleta", pass: false, detail: "Sin escaleta", weight: 1 }] };
  }

  const tracks = esc.tracks;
  const voices = tracks.filter((t) => t.type === "voice");
  const music = tracks.filter((t) => t.type === "music");
  const sfx = tracks.filter((t) => t.type === "sfx");
  const ambience = tracks.filter((t) => t.type === "ambience");
  const pl = prompt.toLowerCase();

  // 1. Has voice tracks
  checks.push({ label: "Voces", pass: voices.length > 0, detail: `${voices.length} track${voices.length !== 1 ? "s" : ""} de voz`, weight: 2 });

  // 2. Voice tracks have text
  const voicesWithText = voices.filter((v) => v.text && v.text.trim().length > 5);
  checks.push({ label: "Texto en voces", pass: voicesWithText.length === voices.length, detail: `${voicesWithText.length}/${voices.length} con texto`, weight: 1.5 });

  // 3. Has background (music or ambience) - unless prompt says "sin musica"
  const wantsNoMusic = /sin m[uú]sica|sin efectos|solo voz/i.test(pl);
  if (wantsNoMusic) {
    checks.push({ label: "Sin musica (pedido)", pass: music.length === 0 && ambience.length === 0, detail: music.length > 0 ? `Tiene ${music.length} tracks de musica (no deberia)` : "Correcto", weight: 2 });
  } else {
    checks.push({ label: "Musica/ambience", pass: music.length + ambience.length > 0, detail: `${music.length} musica, ${ambience.length} ambience`, weight: 1.5 });
  }

  // 4. SFX presence (if prompt suggests actions/effects)
  const wantsSfx = /efecto|sonido|whoosh|explosion|transicion|burbujas|horno/i.test(pl);
  if (wantsSfx) {
    checks.push({ label: "SFX (pedidos)", pass: sfx.length > 0, detail: sfx.length > 0 ? `${sfx.length} efectos` : "Sin SFX (el prompt los pide)", weight: 1.5 });
  }

  // 5. Voice count coherence
  const voiceCountMatch = pl.match(/(\d+)\s*(voces|presentadores|personas|locutores|narradores)/i);
  const wantsTwoVoices = /dos (voces|presentadores)|a 2 voces|dos locutores/i.test(pl);
  const expectedVoices = wantsTwoVoices ? 2 : voiceCountMatch ? parseInt(voiceCountMatch[1]) : null;
  if (expectedVoices) {
    checks.push({ label: `${expectedVoices} voces pedidas`, pass: voices.length >= expectedVoices, detail: `Tiene ${voices.length}`, weight: 2 });
  }

  // 6. Track variety (not all same file)
  const files = tracks.filter((t) => t.file).map((t) => t.file);
  const uniqueFiles = new Set(files).size;
  if (files.length > 1) {
    checks.push({ label: "Variedad de archivos", pass: uniqueFiles > 1, detail: `${uniqueFiles}/${files.length} unicos`, weight: 1 });
  }

  // 7. No empty voice texts
  const emptyVoices = voices.filter((v) => !v.text || v.text.trim().length === 0);
  if (emptyVoices.length > 0) {
    checks.push({ label: "Voces vacias", pass: false, detail: `${emptyVoices.length} voz sin texto`, weight: 1.5 });
  }

  // Calculate weighted score
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const passWeight = checks.filter((c) => c.pass).reduce((s, c) => s + c.weight, 0);
  const score = totalWeight > 0 ? Math.round((passWeight / totalWeight) * 100) : 0;

  return { score, checks };
}

export function productionTimeMs(result: LabResult): number | null {
  if (!result.startedAt || !result.finishedAt) return null;
  return new Date(result.finishedAt).getTime() - new Date(result.startedAt).getTime();
}

export function formatProdTime(ms: number | null): string {
  if (ms == null) return NONE;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function qaScoreClass(score: number): string {
  if (score >= 80) return "bg-emerald-50 text-emerald-700";
  if (score >= 50) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

export function isTestEmail(email: string): boolean {
  return /^(integration-test|auth-|adv-integration|no-stripe|test-)/i.test(email);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return NONE;
  return new Date(dateStr).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatDuration(ms: number | null): string {
  if (ms == null || ms <= 0) return NONE;
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function parsePromptMeta(prompt: string) {
  const durMatch = prompt.match(/\[Duraci[oó]n:\s*([^\]]+)\]/i);
  const tipoMatch = prompt.match(/\[Tipo:\s*([^\]]+)\]/i);
  const persMatch = prompt.match(/\[Personajes:\s*(\d+)\]/i);
  return {
    requestedDuration: durMatch ? durMatch[1].trim() : null,
    requestedType: tipoMatch ? tipoMatch[1].trim() : null,
    requestedPersonajes: persMatch ? parseInt(persMatch[1], 10) : null,
    cleanPrompt: prompt.replace(/\[[^\]]+\]\s*/g, "").trim(),
  };
}

export function parseDurationToMs(dur: string): number {
  return dur.includes("min")
    ? parseInt(dur, 10) * 60000
    : parseInt(dur, 10) * 1000;
}

export function shortModel(model: string | null): string {
  if (!model) return NONE;
  return model.replace("gemini-3.1-", "g3.").replace("-preview", "").replace("claude-", "c.").replace("sonnet-", "s");
}

export function val(v: unknown): string {
  if (v == null || v === "") return NONE;
  return String(v);
}
