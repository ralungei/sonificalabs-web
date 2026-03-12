"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { Icon } from "@iconify/react";
import type { StatsData, User } from "./types";
import { STAT_THEMES } from "./constants";
import { isTestEmail, formatDate, formatDuration } from "./helpers";
import { StatusChip, PlanBadge, Spinner, EmptyState, Pagination } from "./shared-components";

export function OverviewView({ apiToken, onError, onSelectUser, onSelectProduction }: {
  apiToken: string | null; onError: (e: string) => void;
  onSelectUser: (email: string) => void; onSelectProduction: (id: string) => void;
}) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [tab, setTab] = useState<"productions" | "users">("productions");
  const [search, setSearch] = useState("");
  const [prodPage, setProdPage] = useState(0);
  const PROD_PER_PAGE = 15;

  const fetchStats = useCallback(() => {
    if (!apiToken) return;
    apiFetch("/admin/stats", {}, apiToken)
      .then((r) => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then(setStats)
      .catch((e) => onError(e.message));
  }, [apiToken, onError]);

  useEffect(() => { fetchStats(); const i = setInterval(fetchStats, 30_000); return () => clearInterval(i); }, [fetchStats]);

  const realUsers = useMemo(() => stats ? stats.users.filter((u) => !isTestEmail(u.email)) : [], [stats]);
  const realProductions = useMemo(() => stats ? stats.recentProductions.filter((p) => !isTestEmail(p.email)) : [], [stats]);
  const q = search.toLowerCase().trim();
  const filteredUsers = useMemo(() => q ? realUsers.filter((u) => u.email.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q)) : realUsers, [realUsers, q]);
  const filteredProductions = useMemo(() => q ? realProductions.filter((p) => p.email.toLowerCase().includes(q) || p.prompt?.toLowerCase().includes(q) || p.id.includes(q)) : realProductions, [realProductions, q]);
  const paidUsers = useMemo(() => realUsers.filter((u) => u.plan !== "free").length, [realUsers]);
  const errorRate = useMemo(() => realProductions.length > 0 ? Math.round((realProductions.filter((p) => p.status === "error").length / realProductions.length) * 100) : 0, [realProductions]);

  if (!stats) return <Spinner />;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatTile label="Usuarios" value={realUsers.length} sub={`${paidUsers} de pago`} blobKey="usuarios" />
        <StatTile label="Producciones" value={realProductions.length} sub={`${stats.productionsToday} hoy`} blobKey="producciones" />
        <StatTile label="Creditos consumidos" value={realUsers.reduce((s, u) => s + u.credits_used, 0)} blobKey="creditos" />
        <StatTile label="Error rate" value={`${errorRate}%`} alert={errorRate > 20} blobKey="error" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg border border-neutral-200 text-text-primary placeholder:text-neutral-400 focus:outline-none focus:border-accent/50 transition-all" />
        </div>
        <div className="flex rounded-lg border border-neutral-200 p-0.5">
          {(["productions", "users"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setSearch(""); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                tab === t ? "bg-accent/10 text-accent" : "text-neutral-400 hover:text-text-primary"
              }`}>
              {t === "productions" ? "Producciones" : "Usuarios"}
            </button>
          ))}
        </div>
      </div>

      {/* Productions table */}
      {tab === "productions" && (() => {
        const pagedProductions = filteredProductions.slice(prodPage * PROD_PER_PAGE, (prodPage + 1) * PROD_PER_PAGE);
        return (
          <>
            <div className="rounded-xl border border-neutral-200 overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-xs text-neutral-400 uppercase tracking-wider bg-neutral-50">
                    <th className="text-center px-4 py-2.5 font-medium">Estado</th>
                    <th className="text-left px-4 py-2.5 font-medium">Usuario</th>
                    <th className="text-center px-4 py-2.5 font-medium">Dur.</th>
                    <th className="text-center px-4 py-2.5 font-medium">Cr.</th>
                    <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pagedProductions.map((p) => (
                    <tr key={p.id} onClick={() => onSelectProduction(p.id)}
                      className="hover:bg-neutral-50/60 transition-colors cursor-pointer">
                      <td className="px-4 py-2.5 text-center"><StatusChip status={p.status} /></td>
                      <td className="px-4 py-2.5">
                        <button onClick={(e) => { e.stopPropagation(); onSelectUser(p.email); }}
                          className="text-text-primary hover:text-accent transition-colors font-mono text-sm">
                          {p.email}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-center text-neutral-400 tabular-nums">{formatDuration(p.duration_ms)}</td>
                      <td className="px-4 py-2.5 text-center text-accent tabular-nums font-semibold">{p.credits_used}</td>
                      <td className="px-4 py-2.5 text-neutral-400 whitespace-nowrap text-sm">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProductions.length === 0 && <EmptyState text={search ? "Sin resultados" : "Sin producciones"} />}
            </div>
            <Pagination total={filteredProductions.length} limit={PROD_PER_PAGE} offset={prodPage * PROD_PER_PAGE} onPage={(o) => setProdPage(Math.floor(o / PROD_PER_PAGE))} />
          </>
        );
      })()}

      {/* Users table */}
      {tab === "users" && (
        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-xs text-neutral-400 uppercase tracking-wider bg-neutral-50">
                <th className="text-left px-4 py-2.5 font-medium">Usuario</th>
                <th className="text-center px-4 py-2.5 font-medium">Plan</th>
                <th className="text-center px-4 py-2.5 font-medium">Creditos</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((u) => (
                <tr key={u.email} onClick={() => onSelectUser(u.email)}
                  className="hover:bg-neutral-50/60 transition-colors cursor-pointer">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-semibold">
                          {(u.name?.[0] || u.email[0]).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-text-primary truncate">{u.name || u.email.split("@")[0]}</p>
                        <p className="text-xs text-neutral-400 font-mono truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center"><PlanBadge plan={u.plan} /></td>
                  <td className="px-4 py-2.5 text-center text-accent tabular-nums font-semibold">{u.credits_used}</td>
                  <td className="px-4 py-2.5 text-neutral-400 hidden md:table-cell">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <EmptyState text={search ? "Sin resultados" : "Sin usuarios"} />}
        </div>
      )}
    </>
  );
}

export function StatTile({ label, value, sub, alert, blobKey }: { label: string; value: string | number; sub?: string; alert?: boolean; blobKey?: string }) {
  const theme = STAT_THEMES[blobKey || ""] || STAT_THEMES.creditos;

  return (
    <div className={`${theme.bg} rounded-2xl p-5 relative overflow-hidden cursor-default group hover:scale-[1.02] transition-transform`}>
      {/* Background icon */}
      <Icon icon={theme.iconName} className="absolute -right-2 -bottom-2 w-20 h-20 text-white/10" />
      {/* Content */}
      <div className="relative z-10">
        <p className="text-[13px] uppercase tracking-wider font-semibold text-white/80">
          {label}
        </p>
        <p className="text-[32px] font-extrabold mt-1.5 tabular-nums tracking-tight leading-none text-white">
          {value}
        </p>
        {sub && (
          <p className="text-[13px] mt-2 text-white/70 font-medium">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
