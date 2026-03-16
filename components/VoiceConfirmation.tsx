"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { fetchVoices, getVoices, VOICE_ID_TO_NAME, getVoicesForPlan, type VoiceDef } from "@/lib/voices";
import { API_URL } from "@/lib/api";
import type { PlanId } from "@/lib/types";

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
          flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer
          ${isActive ? "bg-accent/8" : "hover:bg-surface-2"}
        `}
      >
        <button
          onClick={(e) => { e.stopPropagation(); togglePreview(v.id); }}
          className={`
            flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
            ${isPlaying
              ? "bg-accent text-white"
              : "bg-surface-2 text-text-muted hover:text-accent hover:bg-accent/10"
            }
          `}
        >
          <Icon icon={isPlaying ? "solar:stop-bold" : "solar:play-bold"} className="h-3 w-3" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-body-sm font-body font-medium text-text-primary">{v.name}</span>
            <span className="text-[9px] text-text-muted">{v.lang}</span>
          </div>
          <span className="text-[9px] text-text-muted truncate block">{v.desc}</span>
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
      <div className="flex flex-col items-center gap-2 mb-8">
        <h2 className="text-heading-sm font-body font-semibold text-text-primary">
          {t("title")}
        </h2>
        <p className="text-body-md text-text-secondary font-body text-center max-w-md">
          {t("subtitle")}
        </p>
      </div>

      {/* Voice cards */}
      <div className="flex flex-col gap-3 mb-8 max-w-md w-full">
        {voiceGroups.map((group, i) => {
          const voiceId = getCurrentVoiceId(group.originalVoiceId);
          const name = VOICE_ID_TO_NAME[voiceId] || "?";
          const def = getVoices().find(v => v.id === voiceId);
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
                  flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all
                  ${isSelected
                    ? "border-accent bg-accent/5"
                    : wasChanged
                      ? "border-accent/30 bg-accent/[0.02]"
                      : "border-contrast/8 bg-surface-0 hover:border-contrast/15"
                  }
                `}
                onClick={() => setSelectedGroup(isSelected ? null : group.originalVoiceId)}
              >
                {/* Play */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePreview(voiceId); }}
                  className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${isPlaying
                      ? "bg-accent text-white shadow-[0_0_12px_rgba(13,148,136,0.4)]"
                      : "bg-surface-2 text-text-muted hover:text-accent hover:bg-accent/10"
                    }
                  `}
                >
                  <Icon icon={isPlaying ? "solar:stop-bold" : "solar:play-bold"} className="h-4 w-4" />
                </button>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-body font-semibold text-body-md text-text-primary">{name}</span>
                    <span className="text-[10px] text-text-muted bg-surface-2 px-1.5 py-0.5 rounded font-body">{def?.lang}</span>
                    {group.trackCount > 1 && (
                      <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded font-body">
                        {group.trackCount} clips
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted font-body truncate mt-0.5">{group.sampleText}</p>
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
                    className="absolute left-0 right-0 top-full mt-2 z-50 border border-contrast/10 rounded-2xl bg-surface-0 shadow-xl max-h-64 overflow-y-auto p-2"
                  >
                    {women.length > 0 && (
                      <div className="mb-1.5">
                        <p className="text-[9px] font-body uppercase tracking-wider text-text-muted mb-1 px-2">{t("women")}</p>
                        {women.map(v => (
                          <VoiceRow key={v.id} v={v} isActive={getCurrentVoiceId(group.originalVoiceId) === v.id} groupId={group.originalVoiceId} isPlaying={playingVoiceId === v.id} />
                        ))}
                      </div>
                    )}
                    {men.length > 0 && (
                      <div>
                        <p className="text-[9px] font-body uppercase tracking-wider text-text-muted mb-1 px-2">{t("men")}</p>
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
        <p className="text-label-sm font-body text-text-muted">
          {t("autoConfirm", { seconds: formatTime(secondsLeft) })}
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirm}
          className="px-8 py-3 rounded-xl bg-accent text-white font-body font-semibold text-body-md
            hover:bg-accent-bright transition-colors active:scale-[0.98]"
        >
          {t("confirm")}
        </motion.button>
        <button
          onClick={onCancel}
          className="text-label-md font-body uppercase tracking-wider text-contrast/40 hover:text-fail transition-colors duration-300"
        >
          {t("cancel")}
        </button>
      </div>
    </motion.div>
  );
}
