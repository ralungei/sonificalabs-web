"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { User, ProductionListItem } from "./types";
import { NONE } from "./constants";
import { formatDate, formatDuration, timeAgo, shortModel, val } from "./helpers";
import { PlanBadge, StatusChip, BackButton, Field, Spinner, EmptyState, Pagination } from "./shared-components";

export function UserDetailView({ email, apiToken, onError, onBack, onSelectProduction }: {
  email: string; apiToken: string | null; onError: (e: string) => void;
  onBack: () => void; onSelectProduction: (id: string) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [productions, setProductions] = useState<ProductionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    if (!apiToken) return;
    apiFetch(`/admin/users?q=${encodeURIComponent(email)}&limit=100`, {}, apiToken)
      .then((r) => r.json())
      .then((data) => { const m = data.users?.find((u: User) => u.email === email); if (m) setUser(m); })
      .catch(() => {});
  }, [apiToken, email]);

  useEffect(() => {
    if (!apiToken) return;
    setLoading(true);
    apiFetch(`/admin/productions?email=${encodeURIComponent(email)}&limit=${limit}&offset=${offset}`, {}, apiToken)
      .then((r) => r.json())
      .then((data) => { setProductions(data.productions || []); setTotal(data.total || 0); })
      .catch((e) => onError(e.message))
      .finally(() => setLoading(false));
  }, [apiToken, email, offset, onError]);

  return (
    <>
      <BackButton onClick={onBack} label="Dashboard" />

      <div className="rounded-xl border border-neutral-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-5">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-11 h-11 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center text-[16px] text-accent font-semibold">
              {(user?.name?.[0] || email[0]).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-semibold text-text-primary tracking-tight truncate">{user?.name || email.split("@")[0]}</h2>
            <p className="text-sm text-neutral-400 font-mono">{email}</p>
          </div>
          {user && <PlanBadge plan={user.plan} />}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-neutral-100">
          <Field label="Creditos usados" value={user?.credits_used ?? NONE} accent />
          <Field label="Producciones" value={total} />
          <Field label="Registro" value={formatDate(user?.created_at ?? null)} />
          <Field label="Stripe ID" value={val(user?.stripe_customer_id)} mono />
          <Field label="Plan pendiente" value={val(user?.pending_plan)} />
          <Field label="Subscription ID" value={val(user?.stripe_subscription_id)} mono />
          <Field label="Eliminado" value={formatDate(user?.deleted_at ?? null)} />
        </div>
      </div>

      <p className="text-sm text-neutral-400 uppercase tracking-wider font-medium mb-3">Producciones ({total})</p>

      {loading ? <Spinner /> : (
        <>
          <div className="rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-xs text-neutral-400 uppercase tracking-wider bg-neutral-50">
                  <th className="text-left px-4 py-2.5 font-medium">Cuando</th>
                  <th className="text-left px-4 py-2.5 font-medium">Prompt</th>
                  <th className="text-center px-4 py-2.5 font-medium">Modelo</th>
                  <th className="text-center px-4 py-2.5 font-medium">Dur.</th>
                  <th className="text-center px-4 py-2.5 font-medium">Cr.</th>
                  <th className="text-center px-4 py-2.5 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {productions.map((p) => (
                  <tr key={p.id} onClick={() => onSelectProduction(p.id)}
                    className="hover:bg-neutral-50/60 transition-colors cursor-pointer">
                    <td className="px-4 py-2.5 text-neutral-400 whitespace-nowrap">{timeAgo(p.created_at)}</td>
                    <td className="px-4 py-2.5 text-neutral-500 max-w-[280px] truncate">{val(p.prompt)}</td>
                    <td className="px-4 py-2.5 text-center text-neutral-400 font-mono text-xs">{shortModel(p.ai_model)}</td>
                    <td className="px-4 py-2.5 text-center text-neutral-400 tabular-nums">{formatDuration(p.duration_ms)}</td>
                    <td className="px-4 py-2.5 text-center text-accent tabular-nums font-semibold">{p.credits_used}</td>
                    <td className="px-4 py-2.5 text-center"><StatusChip status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productions.length === 0 && <EmptyState text="Sin producciones" />}
          </div>
          <Pagination total={total} limit={limit} offset={offset} onPage={setOffset} />
        </>
      )}
    </>
  );
}
