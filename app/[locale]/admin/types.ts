// ── Types ────────────────────────────────────────────────────────

export interface ProductionListItem {
  id: string;
  email: string;
  prompt: string | null;
  status: string;
  track_count: number;
  credits_used: number;
  created_at: string;
  ai_model: string | null;
  tts_model: string | null;
  duration_ms: number | null;
  error: string | null;
  audio_url: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface EscaletaTrack {
  type: "voice" | "music" | "sfx" | "ambience" | "stinger";
  text?: string;
  voice_id?: string;
  file?: string;
  volume?: number;
  loop?: boolean;
  speed?: number;
  effects?: { duck_on_voice?: boolean; pan?: number; eq_preset?: string };
}

export interface SerializedTrack {
  index: number;
  type: "voice" | "music" | "sfx" | "ambience" | "stinger";
  label: string;
  start_ms: number;
  duration_ms: number;
  volume: number;
  audioFile: string;
  lufs: number | null;
  text?: string;
  sourceFile?: string;
  loop?: boolean;
}

export interface TimingDecision {
  track_index: number;
  start_ms: number;
  trim_start?: number;
  trim_end?: number;
  fade_in_ms?: number;
  fade_out_ms?: number;
}

export interface AIPrompt { system: string; user: string }

export interface ProductionDetail extends ProductionListItem {
  escaleta: { tracks: EscaletaTrack[] } | null;
  timing: TimingDecision[] | null;
  tracks: SerializedTrack[] | null;
  escaleta_prompt: string | null; // JSON string of AIPrompt
  timing_prompt: string | null;   // JSON string of AIPrompt
}

export interface User {
  email: string;
  name: string | null;
  avatar: string | null;
  plan: string;
  credits_used: number;
  productions_used: number;
  created_at: string;
  deleted_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  pending_plan: string | null;
}

export interface StatsData {
  totalUsers: number;
  totalProductions: number;
  productionsToday: number;
  productionsThisWeek: number;
  totalCreditsUsed: number;
  recentProductions: ProductionListItem[];
  users: User[];
}

export type View =
  | { type: "overview" }
  | { type: "user"; email: string }
  | { type: "production"; id: string; fromUser?: string };

export type ConsoleTab = "dashboard" | "lab";

// ── Lab Types ───────────────────────────────────────────────────

export interface LabResult {
  id: string;
  model: string;
  tts: string;
  status: "queued" | "working" | "done" | "error";
  progress?: string;
  audioUrl: string | null;
  durationMs: number | null;
  error: string | null;
  rating: number | null;
  notes: string;
  startedAt: string | null;
  finishedAt: string | null;
  // Production detail (fetched after completion)
  escaleta: { tracks: EscaletaTrack[] } | null;
  timing: TimingDecision[] | null;
  tracks: SerializedTrack[] | null;
}

export interface LabTestRun {
  id: string;
  scenario: string;
  prompt: string;
  results: LabResult[];
  createdAt: string;
  // Blind A/B
  blindOrder?: number[];
  blindWinner?: number | null;
}

export type FindingType = "bug" | "improvement" | "prompt-change" | "observation";

export interface LabFinding {
  id: string;
  type: FindingType;
  title: string;
  description: string;
  relatedScenario: string;
  relatedModel: string;
  createdAt: string;
  resolved: boolean;
}

export type LabTab = "pipeline" | "tests" | "results" | "blind" | "findings";

export interface TestScenario {
  id: string;
  category: string;
  label: string;
  prompt: string;
  complexity: "low" | "mid" | "high";
}

export interface QACheck {
  label: string;
  pass: boolean;
  detail: string;
  weight: number;
}
