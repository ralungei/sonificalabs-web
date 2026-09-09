import type { TimelineTrack } from "@/components/studio/types";

export interface ShowViewProps {
  jobId: string;
  audioUrl: string;
  tracks: TimelineTrack[];
  prompt: string;
  /** AI-generated short title (may be empty for old jobs; frontend falls back to prompt slice). */
  title?: string;
  durationMs: number;
  currentTimeMs: number;
  isPlaying: boolean;
  togglePlay: () => void;
  /** Seek to a normalized 0..1 position within the audio. */
  seek: (ratio: number) => void;
  userPlan: string;
  /** A frequency-domain analyser node (only available when playing). Optional. */
  analyser?: AnalyserNode | null;
}
