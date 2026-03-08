"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface Production {
  id: string;
  email: string;
  prompt: string | null;
  status: string;
  track_count: number;
  credits_used: number;
  created_at: string;
}

interface User {
  email: string;
  name: string | null;
  plan: string;
  credits_used: number;
  productions_used: number;
  created_at: string;
}

interface StatsData {
  totalUsers: number;
  totalProductions: number;
  productionsToday: number;
  productionsThisWeek: number;
  totalCreditsUsed: number;
  recentProductions: Production[];
  users: User[];
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-surface-1 p-5">
      <p className="text-xs text-text-secondary uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-brand text-text-primary mt-1">{value}</p>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function AdminDashboard() {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"productions" | "users">("productions");

  const fetchData = useCallback(() => {
    apiFetch("/admin/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-fail">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-brand text-text-primary mb-6">Admin Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <StatCard label="Usuarios" value={data.totalUsers} />
        <StatCard label="Producciones" value={data.totalProductions} />
        <StatCard label="Hoy" value={data.productionsToday} />
        <StatCard label="Esta semana" value={data.productionsThisWeek} />
        <StatCard label="Creditos usados" value={data.totalCreditsUsed} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-white/[0.06]">
        <button
          onClick={() => setTab("productions")}
          className={`px-4 py-2 text-sm transition-colors ${
            tab === "productions"
              ? "text-accent border-b-2 border-accent"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Producciones ({data.recentProductions.length})
        </button>
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 text-sm transition-colors ${
            tab === "users"
              ? "text-accent border-b-2 border-accent"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Usuarios ({data.users.length})
        </button>
      </div>

      {/* Productions table */}
      {tab === "productions" && (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-1 text-text-secondary text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Prompt</th>
                <th className="text-center px-4 py-3">Tracks</th>
                <th className="text-center px-4 py-3">Creditos</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.recentProductions.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                    {timeAgo(p.created_at)}
                  </td>
                  <td className="px-4 py-3 text-text-primary font-mono text-xs">
                    {p.email}
                  </td>
                  <td className="px-4 py-3 text-text-secondary max-w-xs truncate">
                    {p.prompt || "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-text-primary">{p.track_count}</td>
                  <td className="px-4 py-3 text-center text-accent">{p.credits_used}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === "done"
                          ? "bg-done/15 text-done"
                          : "bg-fail/15 text-fail"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {data.recentProductions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    Sin producciones aun
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Users table */}
      {tab === "users" && (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-1 text-text-secondary text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-center px-4 py-3">Plan</th>
                <th className="text-center px-4 py-3">Creditos usados</th>
                <th className="text-left px-4 py-3">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.users.map((u) => (
                <tr key={u.email} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-text-primary font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.name || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.plan === "pro"
                          ? "bg-accent/20 text-accent"
                          : u.plan === "studio"
                            ? "bg-violet-500/20 text-violet-400"
                            : "bg-white/[0.08] text-text-secondary"
                      }`}
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-accent">{u.credits_used}</td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                    {timeAgo(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
