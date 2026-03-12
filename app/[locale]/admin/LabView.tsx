"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { apiFetch, apiUrl } from "@/lib/api";
import type { LabResult, LabTestRun, LabFinding, FindingType, LabTab, EscaletaTrack, TimingDecision } from "./types";
import {
  LAB_MODELS, LAB_CATEGORIES, TEST_SCENARIOS, FINDING_STYLES,
  TRACK_COLORS, NONE,
} from "./constants";
import {
  loadLabRuns, saveLabRuns, loadFindings, saveFindings,
  analyzeResult, productionTimeMs, formatProdTime, qaScoreClass,
  timeAgo, formatDuration, formatMs, parsePromptMeta, parseDurationToMs,
} from "./helpers";
import { StatusChip, EmptyState, FindingCard, ComplexityBadge } from "./shared-components";
import { PipelineView } from "./PipelineView";

export function LabView({ apiToken }: { apiToken: string | null }) {
  const [labTab, setLabTab] = useState<LabTab>("pipeline");
  const [runs, setRuns] = useState<LabTestRun[]>([]);
  const [findings, setFindings] = useState<LabFinding[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const [runningScenarios, setRunningScenarios] = useState<Set<string>>(new Set());
  const activeStreams = useRef<Map<string, EventSource>>(new Map());

  // Finding form
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [findingType, setFindingType] = useState<FindingType>("observation");
  const [findingTitle, setFindingTitle] = useState("");
  const [findingDesc, setFindingDesc] = useState("");
  const [findingScenario, setFindingScenario] = useState("");
  const [findingModel, setFindingModel] = useState("");

  useEffect(() => { setRuns(loadLabRuns()); setFindings(loadFindings()); }, []);

  // Fetch production detail for a result
  const fetchDetail = useCallback(async (jobId: string, runId: string, resultIndex: number) => {
    if (!apiToken || !jobId) return;
    try {
      const res = await apiFetch(`/admin/productions/${jobId}`, {}, apiToken);
      if (!res.ok) return;
      const detail = await res.json();
      setRuns((prev) => {
        const updated = prev.map((r) => {
          if (r.id !== runId) return r;
          const newResults = [...r.results];
          newResults[resultIndex] = {
            ...newResults[resultIndex],
            escaleta: detail.escaleta || null,
            timing: detail.timing || null,
            tracks: detail.tracks || null,
          };
          return { ...r, results: newResults };
        });
        saveLabRuns(updated);
        return updated;
      });
    } catch {}
  }, [apiToken]);

  // Produce one job via SSE for real-time progress updates
  const produceJob = useCallback(async (
    prompt: string, model: string, tts: string,
    runId: string, resultIndex: number,
    onUpdate: (result: Partial<LabResult>) => void,
  ) => {
    const body: Record<string, string> = { prompt };
    if (model) body.model = model;
    if (tts) body.ttsModel = tts;

    const res = await apiFetch("/produce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, apiToken);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const jobId = data.id || data.jobId;
    onUpdate({ id: jobId, status: "queued" });

    // SSE stream for real-time updates
    return new Promise<void>((resolve) => {
      const sseUrl = apiUrl(`/p/${jobId}/stream`, apiToken);
      const es = new EventSource(sseUrl);
      const streamKey = `${runId}-${resultIndex}`;
      activeStreams.current.set(streamKey, es);

      const cleanup = () => { es.close(); activeStreams.current.delete(streamKey); };

      const timeout = setTimeout(() => {
        cleanup();
        onUpdate({ status: "error", error: "Timeout (5 min)", finishedAt: new Date().toISOString() });
        resolve();
      }, 300_000);

      es.onmessage = (event) => {
        try {
          const d = JSON.parse(event.data);

          // Stream intermediate results as they arrive
          const intermediate: Partial<LabResult> = {};
          if (d.escaleta) intermediate.escaleta = d.escaleta;
          if (d.timing) intermediate.timing = d.timing;

          if (d.status === "done") {
            cleanup();
            clearTimeout(timeout);
            // Always store the API-relative path so audio works when reloading from localStorage
            let storedUrl: string | null = null;
            if (d.audioUrl) {
              if (d.audioUrl.startsWith("http")) {
                // Extract jobId from R2 URL or full URL, rebuild as API path
                const match = d.audioUrl.match(/([a-zA-Z0-9_-]{12})\/mix\.mp3/);
                storedUrl = match ? `/audio/${match[1]}/mix.mp3` : d.audioUrl;
              } else {
                storedUrl = d.audioUrl;
              }
            }
            onUpdate({ status: "done", audioUrl: storedUrl, durationMs: d.durationMs ?? null, error: null, finishedAt: new Date().toISOString(), tracks: d.tracks ?? null, ...intermediate });
            resolve();
          } else if (d.status === "error") {
            cleanup();
            clearTimeout(timeout);
            onUpdate({ status: "error", error: d.error || "Error desconocido", finishedAt: new Date().toISOString(), ...intermediate });
            resolve();
          } else {
            onUpdate({ status: "working", progress: d.progress, ...intermediate });
          }
        } catch {}
      };

      es.onerror = () => {
        cleanup();
        clearTimeout(timeout);
        onUpdate({ status: "error", error: "Conexion perdida", finishedAt: new Date().toISOString() });
        resolve();
      };
    });
  }, [apiToken]);

  // Run scenario
  const runScenario = useCallback(async (scenario: typeof TEST_SCENARIOS[number]) => {
    if (!apiToken || runningScenarios.has(scenario.id)) return;
    const runId = `${scenario.id}-${Date.now()}`;

    const initialResults: LabResult[] = LAB_MODELS.map((m) => ({
      id: "", model: m.tag, tts: m.tts || "default",
      status: "queued", audioUrl: null, durationMs: null, error: null,
      rating: null, notes: "", startedAt: new Date().toISOString(), finishedAt: null,
      escaleta: null, timing: null, tracks: null,
    }));

    const run: LabTestRun = { id: runId, scenario: scenario.label, prompt: scenario.prompt, results: initialResults, createdAt: new Date().toISOString() };
    setRuns((prev) => { const u = [run, ...prev].slice(0, 30); saveLabRuns(u); return u; });
    setLabTab("results");
    setExpandedRun(runId);
    setRunningScenarios((prev) => new Set(prev).add(scenario.id));

    const isFinal = (status: string) => status === "done" || status === "error";

    await Promise.allSettled(
      LAB_MODELS.map((m, i) =>
        produceJob(scenario.prompt, m.model, m.tts, runId, i, (update) => {
          setRuns((prev) => {
            const updated = prev.map((r) => {
              if (r.id !== runId) return r;
              const nr = [...r.results]; nr[i] = { ...nr[i], ...update };
              return { ...r, results: nr };
            });
            // Only persist to localStorage on final states (not every poll)
            if (update.status && isFinal(update.status)) saveLabRuns(updated);
            return updated;
          });
        }).catch((err) => {
          setRuns((prev) => {
            const updated = prev.map((r) => {
              if (r.id !== runId) return r;
              const nr = [...r.results]; nr[i] = { ...nr[i], status: "error", error: err.message };
              return { ...r, results: nr };
            });
            saveLabRuns(updated);
            return updated;
          });
        })
      )
    );

    setRunningScenarios((prev) => { const n = new Set(prev); n.delete(scenario.id); return n; });
  }, [apiToken, runningScenarios, produceJob]);

  const cancelResult = useCallback((runId: string, ri: number, jobId?: string) => {
    const streamKey = `${runId}-${ri}`;
    const es = activeStreams.current.get(streamKey);
    if (es) { es.close(); activeStreams.current.delete(streamKey); }
    if (jobId && apiToken) {
      apiFetch(`/cancel/${jobId}`, { method: "POST" }, apiToken).catch(() => {});
    }
    setRuns((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== runId) return r;
        const nr = [...r.results];
        nr[ri] = { ...nr[ri], status: "error", error: "Cancelado", finishedAt: new Date().toISOString() };
        return { ...r, results: nr };
      });
      saveLabRuns(updated);
      return updated;
    });
  }, [apiToken]);

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const updateResult = (runId: string, ri: number, updates: Partial<LabResult>, debounce = false) => {
    setRuns((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== runId) return r;
        const nr = [...r.results]; nr[ri] = { ...nr[ri], ...updates };
        return { ...r, results: nr };
      });
      if (debounce) {
        clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = setTimeout(() => saveLabRuns(updated), 500);
      } else {
        saveLabRuns(updated);
      }
      return updated;
    });
  };

  // Run all scenarios sequentially
  const [runningAll, setRunningAll] = useState(false);
  const runAll = useCallback(async () => {
    if (runningAll || !apiToken) return;
    setRunningAll(true);
    setLabTab("results");
    await Promise.allSettled(
      TEST_SCENARIOS.filter(s => !runningScenarios.has(s.id)).map(s => runScenario(s))
    );
    setRunningAll(false);
  }, [runningAll, apiToken, runScenario, runningScenarios]);



  const addFinding = () => {
    if (!findingTitle.trim()) return;
    const f: LabFinding = {
      id: `f-${Date.now()}`, type: findingType, title: findingTitle.trim(),
      description: findingDesc.trim(), relatedScenario: findingScenario,
      relatedModel: findingModel, createdAt: new Date().toISOString(), resolved: false,
    };
    setFindings((prev) => { const u = [f, ...prev]; saveFindings(u); return u; });
    setFindingTitle(""); setFindingDesc(""); setShowFindingForm(false);
  };

  const toggleResolved = (id: string) => {
    setFindings((prev) => {
      const u = prev.map((f) => f.id === id ? { ...f, resolved: !f.resolved } : f);
      saveFindings(u); return u;
    });
  };

  const deleteFinding = (id: string) => {
    setFindings((prev) => { const u = prev.filter((f) => f.id !== id); saveFindings(u); return u; });
  };

  const openFindingsList = findings.filter((f) => !f.resolved);
  const resolvedFindingsList = findings.filter((f) => f.resolved);
  const openFindings = openFindingsList.length;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <nav className="w-48 shrink-0 border-r border-neutral-200 bg-white pt-4 px-2.5 space-y-1">
        {([
          { key: "pipeline" as LabTab, label: "Pipeline", icon: "M3 3h18v18H3z" },
          { key: "tests" as LabTab, label: "Escenarios", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { key: "results" as LabTab, label: `Resultados (${runs.length})`, icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0h6m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m6 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4" },
          { key: "findings" as LabTab, label: `Hallazgos${openFindings > 0 ? ` (${openFindings})` : ""}`, icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
        ]).map((t) => (
          <button key={t.key} onClick={() => setLabTab(t.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all text-left ${
              labTab === t.key ? "bg-neutral-100 text-neutral-900" : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
            }`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content area */}
      <div className="flex-1 min-w-0 bg-neutral-50 p-8 overflow-y-auto">
        <div className="max-w-[1100px] min-w-0">

      {/* Pipeline tab */}
      {labTab === "pipeline" && <PipelineView apiToken={apiToken} />}

      {/* Tests tab */}
      {labTab === "tests" && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium shrink-0">Modelos</p>
              <div className="flex gap-2 flex-wrap">
                {LAB_MODELS.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 text-xs font-mono text-neutral-600">
                    <span className={`w-2 h-2 rounded-full ${i === 0 ? "bg-teal-500" : "bg-violet-500"}`} />
                    {m.tag}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={runAll} disabled={runningAll || !apiToken}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                runningAll ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" : "bg-accent text-white hover:bg-accent/90 active:scale-[0.98] shadow-lg shadow-accent/20"
              }`}>
              {runningAll ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                  Ejecutando suite...
                </span>
              ) : `Ejecutar todos (${TEST_SCENARIOS.length})`}
            </button>
          </div>
          {LAB_CATEGORIES.map((cat) => (
            <div key={cat} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-neutral-200" />
                <p className="text-xs text-neutral-400 uppercase tracking-[0.2em] font-semibold">{cat}</p>
                <div className="h-px flex-1 bg-neutral-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TEST_SCENARIOS.filter((s) => s.category === cat).map((scenario) => {
                  const isRunning = runningScenarios.has(scenario.id);
                  return (
                    <div key={scenario.id} className="group rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[13px] font-medium text-text-primary">{scenario.label}</p>
                        <ComplexityBadge level={scenario.complexity} />
                      </div>
                      <p className="text-sm text-neutral-500 leading-relaxed mb-3 line-clamp-3">{scenario.prompt}</p>
                      <button onClick={() => runScenario(scenario)} disabled={isRunning || !apiToken}
                        className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                          isRunning ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" : "bg-neutral-100 text-neutral-600 hover:bg-accent hover:text-white active:scale-[0.98]"
                        }`}>
                        {isRunning ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-3 w-3 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                            Produciendo...
                          </span>
                        ) : "Ejecutar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Results tab */}
      {labTab === "results" && (
        <>
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
              {runs.length} ejecuciones
            </p>
            {runs.length > 0 && (
              <button onClick={() => { if (confirm("Borrar todos los resultados?")) { setRuns([]); saveLabRuns([]); } }}
                className="text-xs text-red-500/70 hover:text-red-500 transition-colors">Limpiar</button>
            )}
          </div>

          {runs.length === 0 ? (
            <EmptyState text="Ejecuta un escenario desde la pestana Tests" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {runs.map((run) => {
                const isExpanded = expandedRun === run.id;
                const allDone = run.results.every((r) => r.status === "done" || r.status === "error");
                const doneCount = run.results.filter((r) => r.status === "done").length;

                return (
                  <div key={run.id} className={`rounded-xl border border-neutral-200 bg-white overflow-hidden ${isExpanded ? "md:col-span-2" : ""}`}>
                    {/* Run header */}
                    <button onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors text-left">
                      {/* IDs */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        {run.results.map((r, ri) => (
                          <span key={ri} className="text-[10px] font-mono text-neutral-400">{r.id ? r.id.slice(0, 8) : "..."}</span>
                        ))}
                      </div>
                      {/* Scenario + prompt */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-text-primary truncate">{run.scenario}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{run.prompt}</p>
                      </div>
                      {/* Dots + time + meta */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col gap-1">
                          {run.results.map((r, ri) => {
                            const hasE = !!r.escaleta;
                            const hasT = !!r.timing;
                            const ok = r.status === "done";
                            const err = r.status === "error";
                            const dots = [hasE, hasE && (hasT || ok), hasT, ok];
                            return (
                              <div key={ri} className="flex items-center gap-1.5 justify-end">
                                {r.startedAt && r.finishedAt ? (
                                  <span className={`text-[10px] font-mono ${err ? "text-red-400" : "text-emerald-600"}`}>
                                    {formatProdTime(new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime())}
                                  </span>
                                ) : (r.status === "queued" || r.status === "working") ? (
                                  <span className="h-2.5 w-2.5 border border-accent/30 border-t-accent rounded-full animate-spin" />
                                ) : null}
                                <div className="flex items-center gap-0.5">
                                  {dots.map((done, di) => (
                                    <span key={di} className={`w-1.5 h-1.5 rounded-full ${
                                      err && !done ? "bg-red-300" : done ? "bg-emerald-400" : "bg-neutral-200"
                                    }`} />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                          className={`text-neutral-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="border-t border-neutral-200 p-5 space-y-5 min-w-0">
                        {/* Results — full width per result, side-by-side only for A/B */}
                        {(() => {
                          const { requestedDuration, requestedType, requestedPersonajes, cleanPrompt } = parsePromptMeta(run.prompt);
                          return (
                        <div className={`grid grid-cols-1 ${run.results.length > 1 ? "md:grid-cols-2" : ""} gap-4`}>
                          {run.results.map((result, ri) => {

                            const actualDurationMs = result.durationMs ?? (result.tracks
                              ? result.tracks.reduce((max, t) => Math.max(max, t.start_ms + t.duration_ms), 0)
                              : null);
                            let durationMet: boolean | null = null;
                            if (requestedDuration && actualDurationMs) {
                              durationMet = actualDurationMs >= parseDurationToMs(requestedDuration) * 0.8;
                            }

                            return (
                              <div key={ri} className="min-w-0">
                                {/* Result header */}
                                <div className="py-2 flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1.5 text-sm font-mono text-neutral-600">
                                    {result.model}
                                    {result.id && <span className="text-[10px] text-neutral-400 ml-1">{result.id}</span>}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {(result.status === "queued" || result.status === "working") && (
                                      <button
                                        onClick={() => cancelResult(run.id, ri, result.id || undefined)}
                                        className="text-[10px] text-red-400 hover:text-red-600 font-mono uppercase tracking-wider"
                                      >
                                        Cancelar
                                      </button>
                                    )}
                                    <StatusChip status={result.status} />
                                  </div>
                                </div>
                                {/* Pipeline progress dots */}
                                {(() => {
                                  const hasEscaleta = !!result.escaleta;
                                  const hasTiming = !!result.timing;
                                  const isDone = result.status === "done";
                                  const isError = result.status === "error";
                                  const steps = [
                                    { label: "Escaleta", done: hasEscaleta },
                                    { label: "TTS", done: hasEscaleta && (hasTiming || isDone) },
                                    { label: "Timing", done: hasTiming },
                                    { label: "Mix", done: isDone },
                                  ];
                                  return (
                                    <div className="flex items-center gap-3 pb-2">
                                      {steps.map((s, si) => (
                                        <span key={si} className="inline-flex items-center gap-1">
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                            isError && !s.done ? "bg-red-300" :
                                            s.done ? "bg-emerald-400" : "bg-neutral-200"
                                          }`} />
                                          <span className={`text-[10px] font-mono ${
                                            isError && !s.done ? "text-red-400" :
                                            s.done ? "text-emerald-600" : "text-neutral-300"
                                          }`}>{s.label}</span>
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}

                                {/* Loading state */}
                                {(result.status === "queued" || result.status === "working") && (
                                  <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-3 py-2">
                                      <div className="h-4 w-4 border-[1.5px] border-accent/30 border-t-accent rounded-full animate-spin shrink-0" />
                                      <p className="text-sm text-neutral-500 animate-pulse">{result.progress || "Esperando..."}</p>
                                    </div>
                                    {result.escaleta ? (
                                      <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3">
                                        <p className="text-xs uppercase tracking-wider font-semibold text-teal-600 mb-2">Escaleta</p>
                                        <div className="space-y-1">
                                          {(result.escaleta as { tracks: EscaletaTrack[] }).tracks.map((t, ti) => (
                                            <div key={ti} className="flex gap-2 text-xs">
                                              <span className="text-teal-500 font-semibold uppercase w-12 shrink-0">{t.type}</span>
                                              <span className="text-neutral-600 truncate">{t.text || t.file}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 space-y-2">
                                        <div className="h-3 w-20 bg-neutral-200 rounded animate-pulse" />
                                        <div className="space-y-1.5">
                                          <div className="h-3 w-full bg-neutral-100 rounded animate-pulse" />
                                          <div className="h-3 w-4/5 bg-neutral-100 rounded animate-pulse" />
                                          <div className="h-3 w-3/5 bg-neutral-100 rounded animate-pulse" />
                                        </div>
                                      </div>
                                    )}
                                    {result.timing && (
                                      <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3">
                                        <p className="text-xs uppercase tracking-wider font-semibold text-violet-600 mb-2">Timing</p>
                                        <div className="space-y-1">
                                          {(result.timing as TimingDecision[]).map((td, ti) => (
                                            <div key={ti} className="text-xs text-neutral-600 font-mono">
                                              Track {td.track_index}: {td.start_ms}ms
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Error state */}
                                {result.status === "error" && (
                                  <div className="space-y-3 pt-2">
                                    <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-red-500 shrink-0">
                                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                          <path d="M8 4.5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        <p className="text-sm font-semibold text-red-700">Error en produccion</p>
                                      </div>
                                      <p className="text-sm text-red-600 font-mono break-words whitespace-pre-wrap">{result.error || "Error desconocido"}</p>
                                      {result.finishedAt && result.startedAt && (
                                        <p className="text-xs text-red-400 mt-2 font-mono">
                                          Fallo tras {formatProdTime(new Date(result.finishedAt).getTime() - new Date(result.startedAt).getTime())}
                                        </p>
                                      )}
                                    </div>
                                    {result.escaleta && (
                                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                                        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-2">Escaleta (parcial)</p>
                                        <div className="space-y-1.5">
                                          {result.escaleta.tracks.map((track, ti) => {
                                            const tc = TRACK_COLORS[track.type] || TRACK_COLORS.sfx;
                                            return (
                                              <div key={ti} className="flex items-start gap-2">
                                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase ${tc.bg} ${tc.text}`}>{track.type}</span>
                                                <p className="text-xs text-neutral-500 leading-snug flex-1 truncate">{track.type === "voice" ? `"${track.text}"` : track.file || NONE}</p>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Done state — two-column layout */}
                                {result.status === "done" && (
                                  <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-6 pt-2">
                                    {/* LEFT: Request summary */}
                                    <div className="space-y-3">
                                      <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Solicitud</p>
                                      <p className="text-sm text-text-primary leading-relaxed">{cleanPrompt}</p>

                                      <div className="space-y-1.5">
                                        {requestedType && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-neutral-400">Tipo</span>
                                            <span className="text-xs font-medium text-text-primary">{requestedType}</span>
                                          </div>
                                        )}
                                        {requestedDuration && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-neutral-400">Duracion pedida</span>
                                            <span className="text-xs font-medium text-text-primary">{requestedDuration}</span>
                                          </div>
                                        )}
                                        {actualDurationMs != null && actualDurationMs > 0 && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-neutral-400">Duracion real</span>
                                            <span className="text-xs font-medium text-text-primary">{formatDuration(actualDurationMs)}</span>
                                          </div>
                                        )}
                                        {durationMet !== null && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-neutral-400">Cumplida</span>
                                            <span className={`text-xs font-bold ${durationMet ? "text-emerald-600" : "text-red-500"}`}>
                                              {durationMet ? "Si" : "No"}
                                            </span>
                                          </div>
                                        )}
                                        {requestedPersonajes != null && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-neutral-400">Personajes</span>
                                            <span className="text-xs font-medium text-text-primary">{requestedPersonajes}</span>
                                          </div>
                                        )}
                                      </div>

                                    </div>

                                    {/* RIGHT: Results + details */}
                                    <div className="space-y-3 min-w-0 overflow-hidden">
                                      {/* QA score + times */}
                                      {(() => {
                                        const analysis = result.escaleta ? analyzeResult(run.prompt, result) : null;
                                        const prodTime = productionTimeMs(result);
                                        return (
                                          <div className="flex items-center gap-3 flex-wrap">
                                            {analysis && (
                                              <div className="group relative">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${qaScoreClass(analysis.score)}`}>
                                                  QA {analysis.score}%
                                                </span>
                                                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50 w-56">
                                                  <div className="bg-neutral-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-1">
                                                    {analysis.checks.map((c, ci) => (
                                                      <div key={ci} className="flex items-center gap-2">
                                                        <span className={c.pass ? "text-emerald-400" : "text-red-400"}>{c.pass ? "\u2713" : "\u2717"}</span>
                                                        <span className="flex-1">{c.label}</span>
                                                        <span className="text-neutral-400 text-xs">{c.detail}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            {prodTime != null && (
                                              <span className="text-xs text-neutral-500 font-mono">Tiempo total: {formatProdTime(prodTime)}</span>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* Audio — always use API path with fresh token */}
                                      {result.audioUrl && (
                                        <audio controls className="w-full h-8" src={apiUrl(result.audioUrl, apiToken)} preload="metadata" />
                                      )}

                                      {/* Tracks — merged escaleta + mix data */}
                                      {result.tracks && result.tracks.length > 0 && (
                                        <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-3 overflow-hidden">
                                          <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-2">Tracks ({result.tracks.length})</p>
                                          <div className="space-y-2">
                                            {result.tracks.map((t, ti) => {
                                              const tc = TRACK_COLORS[t.type] || TRACK_COLORS.sfx;
                                              const escTrack = result.escaleta?.tracks[ti];
                                              return (
                                                <div key={ti} className="min-w-0">
                                                  <div className="flex items-center gap-2 text-xs">
                                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase shrink-0 ${tc.bg} ${tc.text}`}>{t.type}</span>
                                                    <span className="text-text-primary font-medium truncate">{t.label}</span>
                                                    <span className="text-neutral-400 font-mono shrink-0">@{formatMs(t.start_ms)}</span>
                                                    <span className="text-neutral-400 font-mono shrink-0">dur {formatDuration(t.duration_ms)}</span>
                                                    <span className="text-neutral-400 font-mono shrink-0">vol {t.volume}</span>
                                                    {t.lufs != null && <span className="text-neutral-400 font-mono shrink-0">{t.lufs.toFixed(1)} LUFS</span>}
                                                  </div>
                                                  {escTrack && (
                                                    <p className="text-[11px] text-neutral-400 mt-0.5 ml-7 truncate">
                                                      {escTrack.type === "voice" ? `"${escTrack.text}"` : escTrack.file || ""}
                                                    </p>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                          );
                        })()}

                        {/* Quick add finding from this run */}
                        {allDone && (
                          <button onClick={() => {
                            setFindingScenario(run.scenario);
                            setFindingModel("");
                            setShowFindingForm(true);
                            setLabTab("findings");
                          }}
                            className="text-xs text-accent hover:underline flex items-center gap-1 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                            </svg>
                            Anotar hallazgo de este test
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Findings tab */}
      {labTab === "findings" && (
        <>
          {/* New finding form */}
          <div className="mb-6">
            {!showFindingForm ? (
              <button onClick={() => setShowFindingForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all active:scale-[0.98]">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                </svg>
                Nuevo hallazgo
              </button>
            ) : (
              <div className="rounded-xl border border-neutral-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">Nuevo hallazgo</p>
                  <button onClick={() => setShowFindingForm(false)} className="text-xs text-neutral-400 hover:text-neutral-600">Cancelar</button>
                </div>

                {/* Type selector */}
                <div className="flex gap-1.5 flex-wrap">
                  {(["bug", "improvement", "prompt-change", "observation"] as FindingType[]).map((t) => (
                    <button key={t} onClick={() => setFindingType(t)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        findingType === t
                          ? `${FINDING_STYLES[t].bg} ${FINDING_STYLES[t].text} ring-1 ring-current/20`
                          : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                      }`}>
                      {FINDING_STYLES[t].label}
                    </button>
                  ))}
                </div>

                <input type="text" value={findingTitle} onChange={(e) => setFindingTitle(e.target.value)}
                  placeholder="Titulo del hallazgo"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13px] text-text-primary placeholder:text-neutral-400 focus:outline-none focus:border-accent/50" />

                <textarea value={findingDesc} onChange={(e) => setFindingDesc(e.target.value)}
                  placeholder="Descripcion detallada, sugerencia de cambio en el prompt, lo que funciona mejor..."
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-text-primary placeholder:text-neutral-400 focus:outline-none focus:border-accent/50 resize-none" />

                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={findingScenario} onChange={(e) => setFindingScenario(e.target.value)}
                    placeholder="Escenario (opcional)"
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-text-primary placeholder:text-neutral-400 focus:outline-none focus:border-accent/50" />
                  <input type="text" value={findingModel} onChange={(e) => setFindingModel(e.target.value)}
                    placeholder="Modelo (opcional)"
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-text-primary placeholder:text-neutral-400 focus:outline-none focus:border-accent/50" />
                </div>

                <button onClick={addFinding} disabled={!findingTitle.trim()}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    findingTitle.trim() ? "bg-accent text-white hover:bg-accent/90" : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  }`}>
                  Guardar
                </button>
              </div>
            )}
          </div>

          {/* Findings list */}
          {findings.length === 0 ? (
            <EmptyState text="Sin hallazgos anotados" />
          ) : (
            <div className="space-y-3">
              {/* Open findings */}
              {openFindingsList.length > 0 && (
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">
                    Pendientes ({openFindingsList.length})
                  </p>
                  <div className="space-y-2">
                    {openFindingsList.map((f) => (
                      <FindingCard key={f.id} finding={f} onToggle={toggleResolved} onDelete={deleteFinding} />
                    ))}
                  </div>
                </div>
              )}

              {/* Resolved */}
              {resolvedFindingsList.length > 0 && (
                <div className="pt-4">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">
                    Resueltos ({resolvedFindingsList.length})
                  </p>
                  <div className="space-y-2">
                    {resolvedFindingsList.map((f) => (
                      <FindingCard key={f.id} finding={f} onToggle={toggleResolved} onDelete={deleteFinding} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
        </div>
      </div>
    </div>
  );
}
