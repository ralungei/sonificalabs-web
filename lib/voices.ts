import type { PlanId } from "./types";

export interface VoiceDef {
  name: string;
  id: string;
  gender: "f" | "m";
  lang: string;
  desc: string;
  aliases?: string[];
  isDefault?: boolean;
  free?: boolean;
}

export const VOICES: VoiceDef[] = [
  // ── Women ──────────────────────────────────────────────────────
  { name: "Sara", id: "gD1IexrzCvsXPHUuT0s3", gender: "f", lang: "ES", desc: "publicidad", isDefault: true, free: true },
  { name: "Eva", id: "Oe0GElYvnDDV5qP1vbE2", gender: "f", lang: "ES", desc: "narracion/doblaje", free: true },
  { name: "Barbara", id: "oE9b8jFugLgWaRosYzRh", gender: "f", lang: "ES", desc: "voz pija/comica (usar solo para humor y parodia)" },
  { name: "Fiona", id: "ElGl0o9qwShv7sa2jOeA", gender: "f", lang: "ES", desc: "narracion con profundidad" },
  { name: "Isabel", id: "pkeOeCS8yf1MBLeQuQOU", gender: "f", lang: "ES", desc: "narracion profunda" },
  { name: "Claudia", id: "K8lgMMdmFr7QoEooafEf", gender: "f", lang: "ES", desc: "ASMR/susurro/meditación (voz suave y relajante, ideal para ASMR, meditaciones y contenido calmado)", free: true },
  { name: "Granny", id: "M9RTtrzRACmbUzsEMq8p", gender: "f", lang: "ES", desc: "personaje vieja" },
  { name: "Ophelia", id: "eRS3faIyd3KSRjzmhPxE", gender: "f", lang: "ES", desc: "personaje llorona" },
  { name: "Norah", id: "kcQkGnn0HAT2JRDQ4Ljp", gender: "f", lang: "LATAM", desc: "conversacional", free: true },
  { name: "Celeste", id: "4wDRKlxcHNOFO5kBvE81", gender: "f", lang: "AR", desc: "conversacional" },
  { name: "Malena", id: "p7AwDmKvTdoHTBuueGvP", gender: "f", lang: "AR", desc: "dinamica" },
  { name: "Cristina", id: "2VUqK4PEdMj16L6xTN4J", gender: "f", lang: "AN", desc: "conversacional" },

  // ── Men ────────────────────────────────────────────────────────
  { name: "Daniel", id: "qUPtETgSYRhCRb2pfOla", gender: "m", lang: "ES", desc: "narracion/informativos", free: true },
  { name: "Dani", id: "CdAqYBLnsNjmTqYgD5Ha", gender: "m", lang: "ES", desc: "conversacional", free: true },
  { name: "Martin Osborne", id: "Vpv1YgvVd6CHIzOTiTt8", gender: "m", lang: "ES", desc: "narracion", aliases: ["martin"] },
  { name: "Enrique", id: "Pc51tQpUBlUP7gybDfkb", gender: "m", lang: "ES", desc: "documental" },
  { name: "Arconte", id: "QtPMrakdgePQIUwOX7Ut", gender: "m", lang: "ES", desc: "voz grave epica", free: true },
  { name: "Loren", id: "XjH5RKDOGNZertWZPiTJ", gender: "m", lang: "ES", desc: "personaje comico/parodico (usar solo para sketches y humor)" },
  { name: "Rafael", id: "orF2qy9215xjwqqxqsWW", gender: "m", lang: "ES", desc: "teatral/dramatico" },
  { name: "Victor", id: "5egO01tkUjEzu7xSSE8M", gender: "m", lang: "ES", desc: "voz profunda/misteriosa, narracion madura", aliases: ["victor"] },
  { name: "Hector", id: "Rl2JPHsuEWSfwCD4ZHIQ", gender: "m", lang: "LATAM", desc: "narracion profunda", free: true },
  { name: "Tomar", id: "QK4xDwo9ESPHA4JNUpX3", gender: "m", lang: "AR", desc: "conversacional" },
  { name: "Dylan", id: "kWjdIkuzqBCnHbyAOYlF", gender: "m", lang: "EN-US", desc: "dinamica", free: true },
  { name: "Blaze", id: "e79twtVS2278lVZZQiAD", gender: "m", lang: "EN-US", desc: "jovial/intensa" },
  { name: "Declan", id: "1BfrkuYXmEwp8AWqSLWk", gender: "m", lang: "EN-US", desc: "narrador de terror" },
  { name: "Eddie", id: "l7kNoIfnJKPg7779LI2t", gender: "m", lang: "EN-US", desc: "educacional/melodica" },
  { name: "Bea", id: "aHCytOTnUOgfGPn5n89j", gender: "m", lang: "EN-GB", desc: "informativa", free: true },
];

// ── Derived lookups ──────────────────────────────────────────────

/** Lowercase name/alias -> ElevenLabs ID */
export const VOICE_NAME_TO_ID: Record<string, string> = {};
for (const v of VOICES) {
  VOICE_NAME_TO_ID[v.name.toLowerCase()] = v.id;
  if (v.aliases) {
    for (const alias of v.aliases) {
      VOICE_NAME_TO_ID[alias.toLowerCase()] = v.id;
    }
  }
}

/** ElevenLabs ID -> display name (first definition wins) */
export const VOICE_ID_TO_NAME: Record<string, string> = {};
for (const v of VOICES) {
  if (!VOICE_ID_TO_NAME[v.id]) VOICE_ID_TO_NAME[v.id] = v.name;
}

/** Default voice ElevenLabs ID (Sara) */
export const DEFAULT_VOICE_ID = VOICES.find(v => v.isDefault)!.id;

// ── Plan-based voice filtering ──────────────────────────────────

/** Get voices available for a given plan */
export function getVoicesForPlan(plan: PlanId): VoiceDef[] {
  if (plan === "free") return VOICES.filter(v => v.free);
  return VOICES; // pro/studio get all voices
}

/** Set of valid voice IDs for a plan (for server-side validation) */
export function getVoiceIdsForPlan(plan: PlanId): Set<string> {
  return new Set(getVoicesForPlan(plan).map(v => v.id));
}

// ── Catalog builder (for Claude system prompt) ───────────────────

export function buildVoiceCatalog(voices?: VoiceDef[]): string {
  const list = voices ?? VOICES;
  const fmt = (v: VoiceDef) => {
    const tag = v.isDefault ? " [default]" : "";
    return `- ${v.name} (${v.id}): ${v.lang}, ${v.desc}${tag}`;
  };

  const women = list.filter(v => v.gender === "f").map(fmt);
  const men = list.filter(v => v.gender === "m").map(fmt);

  return [
    "VOCES DISPONIBLES:",
    "Mujeres:",
    ...women,
    "",
    "Hombres:",
    ...men,
  ].join("\n");
}
