/**
 * Demo productions shown on the landing and on /examples. Every entry has a
 * real MP3 in public/demos/es; English has only some of them, so the rest fall
 * back to the Spanish take instead of a 404.
 */

export type DemoCategory = "tv" | "fiction" | "commercial" | "podcast" | "creators" | "wellness";

export interface DemoEntry {
  id: string;
  /** Key under `home.demos` in the messages files. */
  key: string;
  filename: string;
  category: DemoCategory;
  /** Looping video behind the play button, when there is one. */
  texture?: string;
}

export const DEMOS: DemoEntry[] = [
  { id: "informativo", key: "informativo", filename: "demo-noticiero.mp3", category: "tv", texture: "/textures/informativo.mp4" },
  { id: "documental", key: "documental", filename: "demo-documental.mp3", category: "tv", texture: "/textures/documental.mp4" },
  { id: "paso-publicidad", key: "pasoPublicidad", filename: "demo-paso-publicidad.mp3", category: "tv" },
  { id: "avance-programacion", key: "avanceProgramacion", filename: "demo-avance-programacion.mp3", category: "tv" },
  { id: "cabecera-magazine", key: "cabeceraMagazine", filename: "demo-cabecera-magazine.mp3", category: "tv" },
  { id: "cortinilla-late-night", key: "cortinillaLateNight", filename: "demo-cortinilla-late-night.mp3", category: "tv" },
  { id: "thriller", key: "thriller", filename: "demo-thriller.mp3", category: "fiction", texture: "/textures/thriller.mp4" },
  { id: "trailer", key: "trailer", filename: "demo-trailer.mp3", category: "fiction", texture: "/textures/trailer.mp4" },
  { id: "pizzeria", key: "pizzeria", filename: "demo-spot-pizzeria.mp3", category: "commercial", texture: "/textures/pizzeria.mp4" },
  { id: "espera-telefonica", key: "esperaTelefonica", filename: "demo-espera-telefonica.mp3", category: "commercial" },
  { id: "locucion-aeropuerto", key: "locucionAeropuerto", filename: "demo-locucion-aeropuerto.mp3", category: "commercial" },
  { id: "tour-inmobiliaria", key: "tourInmobiliaria", filename: "demo-tour-inmobiliaria.mp3", category: "commercial" },
  { id: "contestador", key: "contestador", filename: "demo-contestador.mp3", category: "commercial" },
  { id: "guia-turistica", key: "guiaTuristica", filename: "demo-guia-turistica.mp3", category: "commercial" },
  { id: "despedida-podcast", key: "despedidaPodcast", filename: "demo-despedida-podcast.mp3", category: "podcast" },
  { id: "hablando-a-mares", key: "hablandoAMares", filename: "demo-hablando-a-mares.mp3", category: "podcast" },
  { id: "podcast-cosas-raras", key: "podcastCosasRaras", filename: "demo-podcast-cosas-raras.mp3", category: "podcast" },
  { id: "intro-youtube", key: "introYoutube", filename: "demo-intro-youtube.mp3", category: "creators" },
  { id: "outro-suscribete", key: "outroSuscribete", filename: "demo-outro-suscribete.mp3", category: "creators" },
  { id: "intro-reels", key: "introReels", filename: "demo-intro-reels.mp3", category: "creators" },
  { id: "intro-docu-youtube", key: "introDocuYoutube", filename: "demo-intro-docu-youtube.mp3", category: "creators" },
  { id: "audio-elearning", key: "audioElearning", filename: "demo-audio-elearning.mp3", category: "creators" },
  { id: "intro-webinar", key: "introWebinar", filename: "demo-intro-webinar.mp3", category: "creators" },
  { id: "meditacion", key: "meditacion", filename: "demo-meditacion-asmr.mp3", category: "wellness", texture: "/textures/meditacion.mp4" },
  { id: "audiocuento", key: "audiocuento", filename: "demo-audiocuento.mp3", category: "wellness", texture: "/textures/audiocuento.mp4" },
];

/** Category order, colour and tint, as in the design. */
export const DEMO_CATEGORIES: { id: DemoCategory; color: string; tint: string }[] = [
  { id: "tv", color: "#0e7fa6", tint: "#e3f1f7" },
  { id: "fiction", color: "#5b4bb7", tint: "#efecfb" },
  { id: "commercial", color: "#9a6b2f", tint: "#f6efe4" },
  { id: "podcast", color: "#0d9488", tint: "#e6f6f3" },
  { id: "creators", color: "#b4475d", tint: "#fbecef" },
  { id: "wellness", color: "#3f7d4e", tint: "#eaf4ec" },
];

const ENGLISH_TAKES = new Set([
  "demo-audiocuento.mp3", "demo-cabecera-magazine.mp3", "demo-cortinilla-late-night.mp3",
  "demo-despedida-podcast.mp3", "demo-documental.mp3", "demo-hablando-a-mares.mp3",
  "demo-intro-docu-youtube.mp3", "demo-intro-reels.mp3", "demo-meditacion-asmr.mp3",
  "demo-noticiero.mp3", "demo-podcast-cosas-raras.mp3", "demo-spot-pizzeria.mp3",
  "demo-thriller.mp3", "demo-trailer.mp3",
]);

export function demoSrc(locale: string, filename: string): string {
  const lang = locale === "en" && ENGLISH_TAKES.has(filename) ? "en" : "es";
  return `/demos/${lang}/${filename}`;
}

export function findDemo(id: string): DemoEntry {
  const d = DEMOS.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown demo ${id}`);
  return d;
}
