export interface TimelineTrack {
  index: number;
  type: "voice" | "music" | "sfx" | "ambience" | "stinger";
  label: string;
  start_ms: number;
  duration_ms: number;
  volume: number;
  effects: Record<string, unknown>;
  audioFile: string;
  audioUrl: string;
  loop?: boolean;
}

export const STYLE: Record<string, { accent: string; bg: string; label: string }> = {
  voice:    { accent: "#f59e0b", bg: "rgba(245,158,11,0.6)", label: "VOZ" },
  music:    { accent: "#3b82f6", bg: "rgba(59,130,246,0.6)", label: "MUSICA" },
  sfx:      { accent: "#f43f5e", bg: "rgba(244,63,94,0.6)",  label: "SFX" },
  ambience: { accent: "#10b981", bg: "rgba(16,185,129,0.6)", label: "AMBIENTE" },
  stinger:  { accent: "#a855f7", bg: "rgba(168,85,247,0.6)", label: "STINGER" },
};

export const PREVIEW_GAIN: Record<string, number> = {
  voice: 1.0,
  music: 0.35,
  ambience: 0.35,
  sfx: 0.7,
  stinger: 0.7,
};

export const PEAK_RES = 800;
