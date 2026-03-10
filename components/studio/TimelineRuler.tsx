"use client";

export function TimelineRuler({
  rulerMarks,
  pxPerMs,
  sidebarW,
  onSeek,
}: {
  rulerMarks: { ms: number; label: string }[];
  pxPerMs: number;
  sidebarW: number;
  onSeek: (ms: number) => void;
}) {
  return (
    <div className="flex h-7 border-b border-contrast/[0.04] bg-surface-0/30">
      <div
        className="shrink-0 sticky left-0 z-[var(--z-sticky)] bg-surface-1/95 backdrop-blur-sm border-r border-contrast/[0.04]"
        style={{ width: sidebarW }}
      />
      <div
        className="relative flex-1 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          onSeek((e.clientX - rect.left) / pxPerMs);
        }}
      >
        {rulerMarks.map((m) => (
          <div
            key={m.ms}
            className="absolute top-0 h-full flex flex-col items-center"
            style={{ left: m.ms * pxPerMs }}
          >
            <div className="w-px h-2.5 bg-contrast/25" />
            <span className="text-[10px] font-mono text-contrast/50 mt-0.5 select-none">
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
