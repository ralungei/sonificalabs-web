import type { FindingType, TestScenario } from "./types";

export const LAB_STORAGE_KEY = "sonificalabs_lab_v3";
export const LAB_FINDINGS_KEY = "sonificalabs_lab_findings";
export const LAB_MAX_RUNS = 30;

export const TEST_SCENARIOS: TestScenario[] = [
  // Voces y dialogo
  { id: "podcast-interview", category: "Podcast", label: "Entrevista a 2 voces", complexity: "mid",
    prompt: "Podcast de 30 segundos: dos presentadores debaten si la IA reemplazara a los locutores de radio. Uno a favor, otro esceptico. Tono informal y dinamico con musica de fondo lofi." },
  { id: "news-flash", category: "Informativo", label: "Flash informativo", complexity: "mid",
    prompt: "Flash informativo de 20 segundos sobre el descubrimiento de agua en Marte. Voz seria y profesional, cabecera de noticiero, efectos de transicion." },
  { id: "audiobook-dragon", category: "Audiocuento", label: "Cuento infantil corto", complexity: "high",
    prompt: "Audiocuento de 30 segundos sobre un dragon que tenia miedo al fuego pero descubrio que podia hacer burbujas. Narrador calido, musica magica, efectos de burbujas." },
  // Comercial
  { id: "spot-pizza", category: "Spot", label: "Spot publicitario", complexity: "mid",
    prompt: "Spot de radio de 15 segundos para una pizzeria artesanal. Voz energetica, musica italiana alegre, efecto de horno." },
  { id: "trailer-thriller", category: "Trailer", label: "Trailer cinematico", complexity: "high",
    prompt: "Trailer de 20 segundos para una pelicula de thriller psicologico. Voz grave y misteriosa, musica de tension creciente, efectos de suspenso, silencios dramaticos." },
  // Ambient / Minimal
  { id: "meditation-rain", category: "Meditacion", label: "Meditacion guiada", complexity: "low",
    prompt: "Meditacion guiada de 20 segundos. Voz suave y pausada que invita a respirar profundamente. Sonido de lluvia suave de fondo, musica ambient minimalista." },
  { id: "intro-podcast", category: "Intro", label: "Intro de podcast", complexity: "low",
    prompt: "Intro de 10 segundos para un podcast de tecnologia llamado 'Codigo Fuente'. Voz dinamica, musica electronica corta, efecto whoosh." },
  // Edge cases
  { id: "sketch-comedy", category: "Sketch", label: "Sketch de humor", complexity: "high",
    prompt: "Sketch de humor de 25 segundos: un asistente de voz que se niega a poner la alarma porque 'tambien necesita dormir'. Dos voces con timing comico, efectos de sonido exagerados." },
  { id: "documental-nature", category: "Documental", label: "Documental naturaleza", complexity: "mid",
    prompt: "Fragmento de documental de 20 segundos sobre la migracion de las ballenas jorobadas. Narrador con voz profunda y reverente, musica orquestal emotiva, sonidos del oceano." },
  { id: "single-voice", category: "Minimal", label: "Solo voz, sin musica", complexity: "low",
    prompt: "Lectura dramatica de 15 segundos: 'El universo no tiene obligacion de tener sentido para ti'. Solo voz, sin musica ni efectos. Voz profunda con reverb sutil." },
];

export const LAB_MODELS: { model: string; tts: string; tag: string }[] = [
  { model: "gemini-3.1-flash-lite-preview", tts: "", tag: "Gemini 3.1 Flash Lite" },
];

export const LAB_CATEGORIES = [...new Set(TEST_SCENARIOS.map((s) => s.category))];

export const FINDING_STYLES: Record<FindingType, { bg: string; text: string; label: string }> = {
  bug: { bg: "bg-red-50", text: "text-red-700", label: "Bug" },
  improvement: { bg: "bg-blue-50", text: "text-blue-700", label: "Mejora" },
  "prompt-change": { bg: "bg-violet-50", text: "text-violet-700", label: "Cambio prompt" },
  observation: { bg: "bg-neutral-100", text: "text-neutral-600", label: "Observacion" },
};

export const MODEL_DOT_COLORS = ["bg-teal-500", "bg-violet-500"];

export const TRACK_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  voice:    { bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-500" },
  music:    { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  sfx:      { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500" },
  ambience: { bg: "bg-sky-50",    text: "text-sky-700",    dot: "bg-sky-500" },
  stinger:  { bg: "bg-rose-50",   text: "text-rose-700",   dot: "bg-rose-500" },
};

export const NONE = "\u2014";

export const STAT_THEMES: Record<string, { bg: string; iconName: string }> = {
  usuarios:     { bg: "bg-gradient-to-br from-neutral-800 to-neutral-950", iconName: "solar:users-group-rounded-bold" },
  producciones: { bg: "bg-gradient-to-br from-blue-500 to-indigo-600",    iconName: "solar:music-notes-bold" },
  creditos:     { bg: "bg-gradient-to-br from-violet-500 to-purple-600",  iconName: "solar:wallet-bold" },
  error:        { bg: "bg-gradient-to-br from-orange-400 to-rose-500",     iconName: "solar:danger-triangle-bold" },
};
