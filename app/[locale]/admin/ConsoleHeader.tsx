"use client";

import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogoIcon } from "@/components/Logo";
import { Icon } from "@iconify/react";
import type { ConsoleTab } from "./types";

export function ConsoleHeader({ tab, onTabChange }: { tab: ConsoleTab; onTabChange: (t: ConsoleTab) => void }) {
  const { data: session } = useSession();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!avatarOpen) return;
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarOpen]);

  const tabs: { key: ConsoleTab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "lab", label: "Lab" },
  ];
  return (
    <div className="sticky top-0 z-40 bg-neutral-900 border-b border-neutral-800">
      <div className="px-5 md:px-10 flex items-center h-12 gap-6">
        {/* Branding */}
        <div className="flex items-center gap-2 shrink-0">
          <LogoIcon className="h-5 w-5 text-white" />
          <span className="text-[14px] leading-none">
            <span className="text-white font-bold">sonifica</span><span className="text-white/70 font-light">labs</span>
          </span>
          <span className="text-sm font-mono text-neutral-500 tracking-wide ml-1">console</span>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-neutral-700" />

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-neutral-800/60 rounded-lg p-0.5">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => onTabChange(t.key)}
              className={`px-3.5 py-1 text-sm font-medium rounded-md transition-all ${
                tab === t.key
                  ? "bg-neutral-700 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Avatar + dropdown */}
        {session?.user && (
          <div className="relative shrink-0" ref={avatarRef}>
            <button onClick={() => setAvatarOpen(!avatarOpen)}
              className="flex items-center rounded-full transition-colors hover:ring-2 hover:ring-neutral-600 p-0.5">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-neutral-300 font-semibold">
                  {(session.user.name?.[0] || session.user.email?.[0] || "?").toUpperCase()}
                </div>
              )}
            </button>
            {avatarOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
                <div className="px-3 py-2 border-b border-neutral-100">
                  <p className="text-[13px] font-medium text-text-primary truncate">{session.user.name}</p>
                  <p className="text-xs text-neutral-400 truncate">{session.user.email}</p>
                </div>
                <button onClick={() => signOut()}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] text-neutral-600 hover:bg-neutral-50 transition-colors">
                  <Icon icon="solar:logout-2-linear" className="w-4 h-4 text-neutral-400" />
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
