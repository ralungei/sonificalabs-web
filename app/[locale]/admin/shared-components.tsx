"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import type { EscaletaTrack, LabFinding, FindingType } from "./types";
import { FINDING_STYLES, NONE } from "./constants";
import { val } from "./helpers";

export function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    studio:  "bg-violet-100 text-violet-700 ring-violet-200",
    pro:     "bg-teal-100 text-teal-700 ring-teal-200",
    starter: "bg-sky-100 text-sky-700 ring-sky-200",
    free:    "bg-neutral-100 text-neutral-500 ring-neutral-200",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ring-1 uppercase tracking-widest ${styles[plan] || styles.free}`}>
      {plan}
    </span>
  );
}

export function StatusChip({ status }: { status: string }) {
  const styles = status === "done"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : status === "error"
    ? "bg-red-50 text-red-700 ring-red-200"
    : "bg-amber-50 text-amber-700 ring-amber-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ring-1 ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === "done" ? "bg-emerald-500" : status === "error" ? "bg-red-500" : "bg-amber-500"
      }`} />
      <span className="text-xs uppercase tracking-wider font-semibold">{status}</span>
    </span>
  );
}

export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[13px] text-neutral-400 hover:text-accent transition-colors mb-6 group">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:-translate-x-0.5">
        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  );
}

export function Pagination({ total, limit, offset, onPage }: {
  total: number; limit: number; offset: number; onPage: (o: number) => void;
}) {
  if (total <= limit) return null;
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

  // Build visible page numbers: first, last, current +/- 1, with gaps
  const visible = new Set<number>();
  visible.add(1);
  visible.add(pages);
  for (let i = Math.max(1, page - 1); i <= Math.min(pages, page + 1); i++) visible.add(i);
  const sorted = [...visible].sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push("gap");
    items.push(sorted[i]);
  }

  const from = offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="relative flex items-center justify-center mt-4">
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(Math.max(0, offset - limit))} disabled={page === 1}
          className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-neutral-100 transition-colors">
          <Icon icon="solar:alt-arrow-left-linear" className="w-4 h-4 text-neutral-500" />
        </button>
        {items.map((item, i) =>
          item === "gap" ? (
            <span key={`gap-${i}`} className="text-sm text-neutral-300 px-1">&hellip;</span>
          ) : (
            <button key={item} onClick={() => onPage((item - 1) * limit)}
              className={`min-w-[28px] h-7 rounded-lg text-sm font-medium transition-colors ${
                item === page ? "bg-accent text-white" : "text-neutral-500 hover:bg-neutral-100"
              }`}>
              {item}
            </button>
          )
        )}
        <button onClick={() => onPage(offset + limit)} disabled={page >= pages}
          className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-neutral-100 transition-colors">
          <Icon icon="solar:alt-arrow-right-linear" className="w-4 h-4 text-neutral-500" />
        </button>
      </div>
      <span className="absolute right-0 text-xs text-neutral-400">{from}-{to} de {total}</span>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="h-5 w-5 border-[1.5px] border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-neutral-400 text-[13px] py-16">{text}</p>;
}

export function Field({ label, value, mono, accent }: { label: string; value: string | number; mono?: boolean; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">{label}</p>
      <p className={`text-[14px] mt-0.5 truncate ${accent ? "text-accent font-semibold" : "text-text-primary"} ${mono ? "font-mono text-sm" : ""}`}>
        {val(value)}
      </p>
    </div>
  );
}

export function Tag({ label }: { label: string }) {
  return (
    <span className="text-xs font-mono text-neutral-500 bg-neutral-100 rounded px-1.5 py-0.5">{label}</span>
  );
}

export function CreditBreakdown({ credits, escaleta }: { credits: number; escaleta: { tracks: EscaletaTrack[] } | null }) {
  const voiceCount = escaleta?.tracks?.filter((t) => t.type === "voice").length ?? 0;
  const expected = voiceCount > 0 ? 10 + voiceCount * 5 : null;
  return (
    <div>
      <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Creditos</p>
      <p className="text-[14px] mt-0.5 text-accent font-semibold">{credits}</p>
      {expected != null ? (
        <p className="text-xs text-neutral-400 mt-0.5 font-mono">
          10 base + {voiceCount} voces x 5 = {expected}
        </p>
      ) : (
        <p className="text-xs text-neutral-400 mt-0.5">sin desglose</p>
      )}
    </div>
  );
}

export function FindingCard({
  finding: f,
  onToggle,
  onDelete,
}: {
  finding: LabFinding;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const style = FINDING_STYLES[f.type];
  return (
    <div className={`rounded-lg border border-neutral-200 bg-white p-3 ${f.resolved ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${style.bg} ${style.text}`}>
              {style.label}
            </span>
            <span className="text-xs text-neutral-400">{f.relatedModel}</span>
          </div>
          <p className="text-sm font-medium text-text-primary leading-tight">{f.title}</p>
          {f.description && (
            <p className="text-xs text-neutral-500 mt-1">{f.description}</p>
          )}
          <p className="text-xs text-neutral-400 mt-1">
            {f.relatedScenario} · {new Date(f.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggle(f.id)}
            className={`text-xs px-2 py-1 rounded ${
              f.resolved
                ? "bg-neutral-100 text-neutral-500"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {f.resolved ? "Reabrir" : "Resolver"}
          </button>
          <button
            onClick={() => onDelete(f.id)}
            className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function StarRating({ value, onChange, size = 16 }: { value: number | null; onChange?: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange?.(star)}
          className={`p-0.5 transition-colors ${onChange ? "cursor-pointer" : "cursor-default"}`}>
          <svg width={size} height={size} viewBox="0 0 24 24"
            fill={(hover || value || 0) >= star ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="1.5"
            className={(hover || value || 0) >= star ? "text-amber-400" : "text-neutral-300"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function ComplexityBadge({ level }: { level: "low" | "mid" | "high" }) {
  const styles = {
    low: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    mid: "bg-amber-50 text-amber-600 ring-amber-200",
    high: "bg-rose-50 text-rose-600 ring-rose-200",
  };
  const labels = { low: "Simple", mid: "Media", high: "Compleja" };
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ring-1 uppercase tracking-wider ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}
