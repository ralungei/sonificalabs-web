"use client";

import { useEffect, useState } from "react";
import { apiFetch, apiUrl } from "@/lib/api";
import { Icon } from "@iconify/react";
import type { ProductionDetail, EscaletaTrack, SerializedTrack, TimingDecision } from "./types";
import { TRACK_COLORS, NONE } from "./constants";
import { formatDate, formatDuration, formatMs, val } from "./helpers";
import { StatusChip, BackButton, Spinner } from "./shared-components";

export function ProductionDetailView({ id, apiToken, onError, onBack, onSelectUser }: {
  id: string; apiToken: string | null; onError: (e: string) => void;
  onBack: () => void; onSelectUser: (email: string) => void;
}) {
  const [prod, setProd] = useState<ProductionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiToken) return;
    setLoading(true);
    apiFetch(`/admin/productions/${id}`, {}, apiToken)
      .then((r) => { if (!r.ok) throw new Error("Error"); return r.json(); })
      .then(setProd)
      .catch((e) => onError(e.message))
      .finally(() => setLoading(false));
  }, [id, apiToken, onError]);

  if (loading) return <Spinner />;
  if (!prod) return null;

  const audioSrc = prod.audio_url
    ? prod.audio_url.startsWith("http") ? prod.audio_url : apiUrl(prod.audio_url, apiToken)
    : null;

  const processingTime =
    prod.started_at && prod.finished_at
      ? Math.round((new Date(prod.finished_at).getTime() - new Date(prod.started_at).getTime()) / 1000)
      : null;

  const totalDuration = prod.tracks
    ? Math.max(...prod.tracks.map((t) => t.start_ms + t.duration_ms), 0)
    : prod.duration_ms || 0;

  return (
    <>
      <BackButton onClick={onBack} label="Volver" />

      {/* ROW 1: Header + Audio (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 mb-5">

        {/* Left: identity + key metrics (dark card) */}
        <div className="rounded-xl bg-neutral-900 p-5">
          {/* Top bar: ID + status */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 font-mono truncate">{prod.id}</p>
              <button onClick={() => onSelectUser(prod.email)}
                className="text-[15px] text-teal-400 hover:underline font-medium mt-0.5">{prod.email}</button>
            </div>
            <StatusChip status={prod.status} />
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-x-5 gap-y-3 pt-4 border-t border-neutral-800">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Creditos</p>
              <p className="text-[14px] mt-0.5 text-teal-400 font-semibold">{prod.credits_used}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Tracks</p>
              <p className="text-[14px] mt-0.5 text-white">{val(prod.track_count)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Duracion audio</p>
              <p className="text-[14px] mt-0.5 text-white">{formatDuration(totalDuration)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Tiempo proceso</p>
              <p className="text-[14px] mt-0.5 text-white">{processingTime != null ? `${processingTime}s` : NONE}</p>
            </div>
          </div>

          {/* Second row: dates + models */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-3 mt-4 pt-4 border-t border-neutral-800">
            <div><p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Creado</p><p className="text-[14px] mt-0.5 text-neutral-300">{formatDate(prod.created_at)}</p></div>
            <div><p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Inicio</p><p className="text-[14px] mt-0.5 text-neutral-300">{formatDate(prod.started_at)}</p></div>
            <div><p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Fin</p><p className="text-[14px] mt-0.5 text-neutral-300">{formatDate(prod.finished_at)}</p></div>
            <div><p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Modelo IA</p><p className="text-[14px] mt-0.5 text-neutral-300 font-mono text-sm">{val(prod.ai_model)}</p></div>
            <div><p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Modelo TTS</p><p className="text-[14px] mt-0.5 text-neutral-300 font-mono text-sm">{val(prod.tts_model)}</p></div>
            <div><p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Audio URL</p><p className="text-[14px] mt-0.5 text-neutral-300 font-mono text-sm truncate">{val(prod.audio_url)}</p></div>
          </div>
        </div>

        {/* Right: audio player + error */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-neutral-200 p-5 flex-1">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">Audio final</p>
            {audioSrc ? (
              <audio controls className="w-full" src={audioSrc} preload="metadata" />
            ) : (
              <p className="text-[13px] text-neutral-400">{NONE}</p>
            )}
          </div>
          <div className={`rounded-xl border p-5 ${prod.error ? "border-red-200 bg-red-50/50" : "border-neutral-200"}`}>
            <p className={`text-xs uppercase tracking-wider font-medium mb-2 ${prod.error ? "text-red-500" : "text-neutral-400"}`}>Error</p>
            {prod.error ? (
              <p className="text-[13px] text-red-600 font-mono whitespace-pre-wrap break-words">{prod.error}</p>
            ) : (
              <p className="text-[13px] text-neutral-400">Sin errores</p>
            )}
          </div>
        </div>
      </div>

      {/* ROW 2: Prompt + Timeline (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 p-5">
          <p className="text-xs text-teal-200/70 uppercase tracking-wider font-medium mb-3">Prompt del usuario</p>
          {prod.prompt ? (
            <p className="text-[14px] text-white whitespace-pre-wrap leading-relaxed">{prod.prompt}</p>
          ) : (
            <p className="text-[13px] text-teal-200/50">{NONE}</p>
          )}
        </div>
        <div className="rounded-xl border border-neutral-200 p-5">
          <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">Timeline</p>
          {prod.tracks && prod.tracks.length > 0 && totalDuration > 0 ? (
            <TimelineView tracks={prod.tracks} totalDuration={totalDuration} />
          ) : (
            <p className="text-[13px] text-neutral-400">{NONE}</p>
          )}
        </div>
      </div>

      {/* ROW 3: Escaleta (full width) */}
      <Section title="Escaleta (guion generado por IA)">
        {prod.escaleta?.tracks && prod.escaleta.tracks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prod.escaleta.tracks.map((track, i) => (
              <EscaletaTrackCard key={i} track={track} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-neutral-400">{NONE}</p>
        )}
      </Section>

      {/* ROW 4: Timing + Tracks (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Timing decisions */}
        <div className="rounded-xl border border-neutral-200 p-5">
          <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">Decisiones de timing (IA)</p>
          {prod.timing && Array.isArray(prod.timing) && prod.timing.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {(prod.timing as TimingDecision[]).map((td, i) => (
                <div key={i} className="rounded-lg bg-neutral-50 border border-neutral-100 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-400 font-mono">Track {td.track_index}</p>
                    <p className="text-sm text-text-primary tabular-nums font-mono font-medium">{formatMs(td.start_ms)}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-neutral-400">
                    {td.trim_start != null && <span>trim-in {td.trim_start}ms</span>}
                    {td.trim_end != null && <span>trim-out {td.trim_end}ms</span>}
                    {td.fade_in_ms ? <span>fade-in {td.fade_in_ms}ms</span> : null}
                    {td.fade_out_ms ? <span>fade-out {td.fade_out_ms}ms</span> : null}
                    {!td.fade_in_ms && !td.fade_out_ms && !td.trim_start && !td.trim_end && <span>sin modificaciones</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-neutral-400">{NONE}</p>
          )}
        </div>

        {/* Tracks data */}
        <div className="rounded-xl border border-neutral-200 p-5">
          <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">Tracks del mix</p>
          {prod.tracks && prod.tracks.length > 0 ? (
            <div className="space-y-2">
              {prod.tracks.map((track) => (
                <TrackDataCard key={track.index} track={track} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-neutral-400">{NONE}</p>
          )}
        </div>
      </div>

      {/* ROW 5: Raw AI responses (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <RawJSON title="Raw: Escaleta (pass 1)" data={prod.escaleta} prompt={prod.escaleta_prompt} />
        <RawJSON title="Raw: Timing (pass 2)" data={prod.timing} prompt={prod.timing_prompt} />
        <RawJSON title="Raw: Tracks (mix)" data={prod.tracks} />
      </div>
    </>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-5 mb-5">
      <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-4">{title}</p>
      {children}
    </div>
  );
}

export function EscaletaTrackCard({ track, index }: { track: EscaletaTrack; index: number }) {
  const colors = TRACK_COLORS[track.type] || TRACK_COLORS.sfx;
  return (
    <div className={`rounded-lg border border-neutral-200 overflow-hidden`}>
      {/* Header */}
      <div className={`${colors.bg} px-4 py-2 flex items-center gap-2`}>
        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
        <span className={`text-sm font-semibold ${colors.text}`}>
          {index + 1}. {track.type.charAt(0).toUpperCase() + track.type.slice(1)}
        </span>
        <span className="text-xs text-neutral-400 ml-auto font-mono">
          {track.type === "voice" ? track.voice_id || NONE : track.file || NONE}
        </span>
      </div>
      {/* Body */}
      <div className="px-4 py-3">
        {/* Content: texto para voice, archivo para el resto */}
        {track.type === "voice" && track.text ? (
          <p className="text-[13px] text-text-primary leading-relaxed mb-2 italic">&ldquo;{track.text}&rdquo;</p>
        ) : track.type !== "voice" ? (
          <p className="text-[13px] text-neutral-500 mb-2">{track.file || NONE}</p>
        ) : null}
        {/* Properties as a clean 2-col grid */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
          <div><span className="text-neutral-400">Volumen</span> <span className="text-text-primary font-mono ml-1">{track.volume != null ? Math.round(track.volume * 100) + "%" : NONE}</span></div>
          <div><span className="text-neutral-400">Speed</span> <span className="text-text-primary font-mono ml-1">{track.speed != null ? track.speed + "x" : "1x"}</span></div>
          <div><span className="text-neutral-400">Loop</span> <span className="text-text-primary ml-1">{track.loop ? "Si" : "No"}</span></div>
          <div><span className="text-neutral-400">Duck</span> <span className="text-text-primary ml-1">{track.effects?.duck_on_voice ? "Si" : "No"}</span></div>
          <div><span className="text-neutral-400">EQ</span> <span className="text-text-primary font-mono ml-1">{val(track.effects?.eq_preset)}</span></div>
          <div><span className="text-neutral-400">Pan</span> <span className="text-text-primary font-mono ml-1">{track.effects?.pan != null ? track.effects.pan : "0"}</span></div>
        </div>
      </div>
    </div>
  );
}

export function TimelineView({ tracks, totalDuration }: { tracks: SerializedTrack[]; totalDuration: number }) {
  const grouped = tracks.reduce<Record<string, SerializedTrack[]>>((acc, t) => {
    (acc[t.type] = acc[t.type] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-neutral-400 font-mono px-1 mb-1">
        <span>0:00</span>
        <span>{formatDuration(totalDuration / 4)}</span>
        <span>{formatDuration(totalDuration / 2)}</span>
        <span>{formatDuration((totalDuration * 3) / 4)}</span>
        <span>{formatDuration(totalDuration)}</span>
      </div>
      {Object.entries(grouped).map(([type, typeTracks]) => {
        const colors = TRACK_COLORS[type] || TRACK_COLORS.sfx;
        return (
          <div key={type} className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider w-16 shrink-0 text-right ${colors.text}`}>{type}</span>
            <div className="relative flex-1 h-7 rounded bg-neutral-50 border border-neutral-100">
              {typeTracks.map((t) => {
                const left = (t.start_ms / totalDuration) * 100;
                const width = Math.max((t.duration_ms / totalDuration) * 100, 0.5);
                return (
                  <div key={t.index} title={`${t.label} (${formatMs(t.start_ms)} - ${formatDuration(t.duration_ms)})`}
                    className={`absolute top-1 bottom-1 rounded-sm ${colors.dot} opacity-50`}
                    style={{ left: `${left}%`, width: `${width}%`, minWidth: "3px" }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TrackDataCard({ track }: { track: SerializedTrack }) {
  const colors = TRACK_COLORS[track.type] || TRACK_COLORS.sfx;
  return (
    <div className="rounded-lg border border-neutral-100 px-4 py-2.5 overflow-hidden">
      <div className="flex items-center gap-2 text-sm min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
        <span className={`${colors.text} shrink-0 font-semibold text-xs uppercase tracking-wider`}>{track.type}</span>
        <span className="text-text-primary truncate font-medium">{track.label}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-xs">
        <div><span className="text-neutral-400">Inicio: </span><span className="text-text-primary font-mono">{formatMs(track.start_ms)}</span></div>
        <div><span className="text-neutral-400">Dur: </span><span className="text-text-primary font-mono">{formatDuration(track.duration_ms)}</span></div>
        <div><span className="text-neutral-400">Vol: </span><span className="text-text-primary font-mono">{Math.round(track.volume * 100)}%</span></div>
        <div><span className="text-neutral-400">LUFS: </span><span className="text-text-primary font-mono">{track.lufs != null ? track.lufs.toFixed(1) : NONE}</span></div>
        <div><span className="text-neutral-400">Loop: </span><span className="text-text-primary">{track.loop ? "si" : "no"}</span></div>
        <div className="col-span-2 sm:col-span-1 truncate"><span className="text-neutral-400">File: </span><span className="text-text-primary font-mono">{val(track.sourceFile || track.audioFile)}</span></div>
      </div>
      {track.text && (
        <p className="text-sm text-neutral-500 mt-2 border-t border-neutral-100 pt-2">{track.text}</p>
      )}
    </div>
  );
}

export function RawJSON({ title, data, prompt }: { title: string; data: unknown; prompt?: string | null }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"response" | "prompt">("response");
  const parsedPrompt = prompt ? (() => { try { return JSON.parse(prompt) as { system: string; user: string }; } catch { return null; } })() : null;

  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors">
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">{title}</p>
        <Icon icon="solar:alt-arrow-down-linear" width={14}
          className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          {parsedPrompt && (
            <div className="flex gap-1 px-5 py-2 border-t border-neutral-100 bg-white">
              <button onClick={() => setTab("response")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${tab === "response" ? "bg-neutral-900 text-white" : "text-neutral-400 hover:text-neutral-600"}`}>
                Respuesta
              </button>
              <button onClick={() => setTab("prompt")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${tab === "prompt" ? "bg-teal-600 text-white" : "text-neutral-400 hover:text-neutral-600"}`}>
                Prompt enviado
              </button>
            </div>
          )}
          <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-4 overflow-x-auto max-h-[500px] overflow-y-auto">
            {tab === "response" ? (
              data != null ? <JsonTree data={data} /> : <p className="text-sm text-neutral-400">{NONE}</p>
            ) : parsedPrompt ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-violet-500 mb-2">System</p>
                  <pre className="text-sm font-mono text-text-primary whitespace-pre-wrap break-words leading-relaxed">{parsedPrompt.system}</pre>
                </div>
                <div className="border-t border-neutral-200 pt-4">
                  <p className="text-xs uppercase tracking-wider font-semibold text-teal-600 mb-2">User</p>
                  <pre className="text-sm font-mono text-text-primary whitespace-pre-wrap break-words leading-relaxed">{parsedPrompt.user}</pre>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

export function JsonTree({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const indent = depth * 16;

  if (data === null) return <span className="text-neutral-400 text-sm font-mono">null</span>;
  if (typeof data === "boolean") return <span className="text-violet-600 text-sm font-mono">{String(data)}</span>;
  if (typeof data === "number") return <span className="text-blue-600 text-sm font-mono">{data}</span>;
  if (typeof data === "string") {
    if (data.length > 120) {
      return <span className="text-emerald-700 text-sm font-mono break-words">&quot;{data}&quot;</span>;
    }
    return <span className="text-emerald-700 text-sm font-mono">&quot;{data}&quot;</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-neutral-400 text-sm font-mono">[]</span>;
    return (
      <div>
        <span className="text-neutral-400 text-sm font-mono">[</span>
        {data.map((item, i) => (
          <div key={i} style={{ paddingLeft: indent + 16 }} className="flex gap-1">
            <span className="text-neutral-300 text-sm font-mono shrink-0">{i}:</span>
            <JsonTree data={item} depth={depth + 1} />
            {i < data.length - 1 && <span className="text-neutral-300">,</span>}
          </div>
        ))}
        <span style={{ paddingLeft: indent }} className="text-neutral-400 text-sm font-mono">]</span>
      </div>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-neutral-400 text-sm font-mono">{"{}"}</span>;
    return (
      <div>
        <span className="text-neutral-400 text-sm font-mono">{"{"}</span>
        {entries.map(([key, value], i) => (
          <div key={key} style={{ paddingLeft: indent + 16 }} className="flex gap-1 flex-wrap">
            <span className="text-rose-600 text-sm font-mono shrink-0">&quot;{key}&quot;</span>
            <span className="text-neutral-400 text-sm font-mono">:</span>
            <JsonTree data={value} depth={depth + 1} />
            {i < entries.length - 1 && <span className="text-neutral-300">,</span>}
          </div>
        ))}
        <span style={{ paddingLeft: indent }} className="text-neutral-400 text-sm font-mono">{"}"}</span>
      </div>
    );
  }

  return <span className="text-neutral-500 text-sm font-mono">{String(data)}</span>;
}
