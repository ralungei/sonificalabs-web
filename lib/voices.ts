import type { PlanId } from "./types";

export interface VoiceDef {
  name: string;
  id: string;
  gender: "f" | "m";
  lang: string;
  desc: string;
  free?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Cached voices from backend
let cachedVoices: VoiceDef[] | null = null;
let fetchPromise: Promise<VoiceDef[]> | null = null;

/** Fetch voices from backend (cached after first call) */
export async function fetchVoices(): Promise<VoiceDef[]> {
  if (cachedVoices) return cachedVoices;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(`${API_URL}/voices`)
    .then(r => r.json())
    .then((voices: VoiceDef[]) => {
      cachedVoices = voices;
      // Rebuild lookup maps
      rebuildLookups(voices);
      return voices;
    })
    .catch(() => {
      // Fallback: return whatever we have (empty if never loaded)
      return cachedVoices || [];
    })
    .finally(() => { fetchPromise = null; });

  return fetchPromise;
}

/** Get cached voices (empty array if not yet loaded) */
export function getVoices(): VoiceDef[] {
  return cachedVoices || [];
}

// ── Derived lookups (rebuilt after fetch) ──────────────────────

export let VOICE_ID_TO_NAME: Record<string, string> = {};

function rebuildLookups(voices: VoiceDef[]) {
  VOICE_ID_TO_NAME = {};
  for (const v of voices) {
    if (!VOICE_ID_TO_NAME[v.id]) VOICE_ID_TO_NAME[v.id] = v.name;
  }
}

// ── Plan-based voice filtering ──────────────────────────────────

export function getVoicesForPlan(plan: PlanId): VoiceDef[] {
  const voices = getVoices();
  if (plan === "free") return voices.filter(v => v.free);
  return voices;
}
