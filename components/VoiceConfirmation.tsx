"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { fetchVoices, VOICE_ID_TO_NAME, getVoicesForPlan, type VoiceDef } from "@/lib/voices";
import { API_URL } from "@/lib/api";
import type { PlanId } from "@/lib/types";
import { ArrowDot } from "@/components/site/ui";

interface EscaletaTrack {
  type: string;
  text?: string;
  voice_id?: string;
  label?: string;
}

interface Props {
  escaleta: { tracks: EscaletaTrack[] };
  confirmDeadline: number;
  userPlan: string;
  onConfirm: (voiceChanges: Record<number, string>) => void;
  onCancel: () => void;
}

interface VoiceGroup {
  originalVoiceId: string;
  trackIndices: number[];
  sampleText: string;
  trackCount: number;
}

function previewUrl(voiceId: string): string {
  return `${API_URL}/voices/${voiceId}/preview`;
}

export function VoiceConfirmation({ escaleta, confirmDeadline, userPlan, onConfirm, onCancel }: Props) {
  const t = useTranslations("voiceConfirmation");
  const [voiceSwaps, setVoiceSwaps] = useState<Record<string, string>>({});
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((confirmDeadline - Date.now()) / 1000)));
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchVoices().then(() => setVoicesLoaded(true));
  }, []);

  const availableVoices = getVoicesForPlan(userPlan as PlanId);
  const women = availableVoices.filter(v => v.gender === "f");
  const men = availableVoices.filter(v => v.gender === "m");

  const voiceGroups: VoiceGroup[] = (() => {
    const groupMap = new Map<string, VoiceGroup>();
    escaleta.tracks.forEach((track, idx) => {
      if (track.type !== "voice") return;
      const vid = track.voice_id || "";
      const existing = groupMap.get(vid);
      if (existing) {
        existing.trackIndices.push(idx);
        existing.trackCount++;
      } else {
        groupMap.set(vid, {
          originalVoiceId: vid,
          trackIndices: [idx],
          sampleText: track.text?.slice(0, 50) || track.label || "",
          trackCount: 1,
        });
      }
    });
    return [...groupMap.values()];
  })();

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((confirmDeadline - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [confirmDeadline]);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!selectedGroup) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSelectedGroup(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedGroup]);

  const getCurrentVoiceId = useCallback((originalId: string) => {
    return voiceSwaps[originalId] || originalId;
  }, [voiceSwaps]);

  const togglePreview = useCallback((voiceId: string) => {
    if (playingVoiceId === voiceId) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingVoiceId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(previewUrl(voiceId));
    audio.onended = () => { setPlayingVoiceId(null); audioRef.current = null; };
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingVoiceId(voiceId);
  }, [playingVoiceId]);

  const handleVoiceChange = useCallback((originalVoiceId: string, newVoiceId: string) => {
    setVoiceSwaps(prev => ({ ...prev, [originalVoiceId]: newVoiceId }));
    setSelectedGroup(null);
  }, []);

  const handleConfirm = useCallback(() => {
    const perTrackChanges: Record<number, string> = {};
    for (const group of voiceGroups) {
      const newId = voiceSwaps[group.originalVoiceId];
      if (newId) {
        for (const idx of group.trackIndices) {
          perTrackChanges[idx] = newId;
        }
      }
    }
    onConfirm(perTrackChanges);
  }, [voiceSwaps, voiceGroups, onConfirm]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const VoiceRow = useCallback(({ v, isActive, groupId, isPlaying }: { v: VoiceDef; isActive: boolean; groupId: string; isPlaying: boolean }) => {
    return (
      <div
        onClick={() => { if (!isActive) handleVoiceChange(groupId, v.id); }}
        className={`
          flex items-center gap-2.5 px-2.5 py-2 rounded-[14px] cursor-pointer
          ${isActive ? "bg-mint" : "hover:bg-surface-2"}
        `}
      >
        <button
          onClick={(e) => { e.stopPropagation(); togglePreview(v.id); }}
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors
            ${isPlaying
              ? "bg-accent text-white"
              : "bg-ink text-white hover:bg-accent"
            }
          `}
        >
          <Icon icon={isPlaying ? "solar:stop-bold" : "solar:play-bold"} className="h-3 w-3" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-medium text-ink">{v.name}</span>
          </div>
          <span className="block truncate text-xs text-text-muted">{v.desc}</span>
        </div>
        {isActive && (
          <Icon icon="solar:check-circle-bold" className="flex-shrink-0 h-4 w-4 text-accent" />
        )}
      </div>
    );
  }, [togglePreview, handleVoiceChange]);

  return (
    <motion.div
      key="confirming"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center w-full min-h-[60vh] px-4"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <h1 className="m-0 text-balance text-[clamp(32px,4vw,48px)] font-normal leading-[1.04] tracking-[-0.06em]">
          {t("title")}
        </h1>
        <p className="m-0 max-w-md text-base leading-[1.45] text-text-secondary">
          {t("subtitle")}
        </p>
      </div>

      {/* Voice cards */}
      <div className="mb-8 flex w-full max-w-[520px] flex-col gap-2.5">
        {voiceGroups.map((group, i) => {
          const voiceId = getCurrentVoiceId(group.originalVoiceId);
          const name = VOICE_ID_TO_NAME[voiceId] || "?";
          const isSelected = selectedGroup === group.originalVoiceId;
          const wasChanged = group.originalVoiceId in voiceSwaps;
          const isPlaying = playingVoiceId === voiceId;

          return (
            <div key={group.originalVoiceId} className="relative" ref={isSelected ? dropdownRef : undefined}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className={`
                  flex items-center gap-3 rounded-[21px] border bg-white px-3 py-3 cursor-pointer transition-all
                  shadow-[0_20px_44px_-34px_rgba(15,42,46,.45)]
                  ${isSelected
                    ? "border-accent"
                    : wasChanged
                      ? "border-accent/40"
                      : "border-contrast/[0.07] hover:border-contrast/20"
                  }
                `}
                onClick={() => setSelectedGroup(isSelected ? null : group.originalVoiceId)}
              >
                {/* Play */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePreview(voiceId); }}
                  className={`
                    flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all
                    ${isPlaying
                      ? "bg-accent text-white shadow-[0_0_0_4px_rgba(13,148,136,.15)]"
                      : "bg-ink text-white hover:bg-accent"
                    }
                  `}
                >
                  <Icon icon={isPlaying ? "solar:stop-bold" : "solar:play-bold"} className="h-4 w-4" />
                </button>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[17px] font-medium tracking-[-0.025em] text-ink">{name}</span>
                    {group.trackCount > 1 && (
                      <span className="rounded-full bg-mint px-2 py-0.5 text-[11px] font-medium text-accent-dim">
                        {group.trackCount} clips
                      </span>
                    )}
                  </div>
                  <p className="m-0 mt-0.5 truncate text-[13px] text-text-muted">{group.sampleText}</p>
                </div>
                {/* Chevron */}
                <div className="flex-shrink-0">
                  {wasChanged ? (
                    <Icon icon="solar:check-circle-bold" className="h-5 w-5 text-accent" />
                  ) : (
                    <Icon icon="solar:alt-arrow-down-linear" className={`h-4 w-4 text-text-muted transition-transform ${isSelected ? "rotate-180" : ""}`} />
                  )}
                </div>
              </motion.div>

              {/* Dropdown menu */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-[21px] border border-contrast/[0.07] bg-white p-2 shadow-[0_30px_60px_-30px_rgba(15,42,46,.45)]"
                  >
                    {women.length > 0 && (
                      <div className="mb-1.5">
                        <p className="mb-1 mt-1 px-2 text-[11px] font-semibold uppercase tracking-[.08em] text-text-muted">{t("women")}</p>
                        {women.map(v => (
                          <VoiceRow key={v.id} v={v} isActive={getCurrentVoiceId(group.originalVoiceId) === v.id} groupId={group.originalVoiceId} isPlaying={playingVoiceId === v.id} />
                        ))}
                      </div>
                    )}
                    {men.length > 0 && (
                      <div>
                        <p className="mb-1 mt-1 px-2 text-[11px] font-semibold uppercase tracking-[.08em] text-text-muted">{t("men")}</p>
                        {men.map(v => (
                          <VoiceRow key={v.id} v={v} isActive={getCurrentVoiceId(group.originalVoiceId) === v.id} groupId={group.originalVoiceId} isPlaying={playingVoiceId === v.id} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirm}
          className="flex h-14 items-center gap-[13px] rounded-full bg-ink pl-6 pr-2 text-base font-medium tracking-[-0.02em] text-white transition-colors hover:bg-accent"
        >
          {t("confirm")}
          <ArrowDot size={40} />
        </motion.button>
        <p className="m-0 text-sm text-text-muted">
          {t("autoConfirm", { seconds: formatTime(secondsLeft) })}
        </p>
        <button
          onClick={onCancel}
          className="flex h-10 items-center rounded-full px-4 text-sm font-medium text-text-muted transition-colors duration-300 hover:bg-fail/[0.08] hover:text-fail"
        >
          {t("cancel")}
        </button>
      </div>
    </motion.div>
  );
}
