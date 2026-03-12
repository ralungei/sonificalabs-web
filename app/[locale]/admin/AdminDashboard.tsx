"use client";

import { useState } from "react";
import { useApiToken } from "@/components/Providers";
import type { View, ConsoleTab } from "./types";
import { ConsoleHeader } from "./ConsoleHeader";
import { OverviewView } from "./OverviewView";
import { UserDetailView } from "./UserDetailView";
import { ProductionDetailView } from "./ProductionDetailView";
import { LabView } from "./LabView";

export function AdminDashboard() {
  const apiToken = useApiToken();
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>("dashboard");
  const [view, setView] = useState<View>({ type: "overview" });
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-[13px]">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ConsoleHeader tab={consoleTab} onTabChange={(t) => { setConsoleTab(t); setView({ type: "overview" }); }} />

      {consoleTab === "dashboard" && (
        <div className="pb-16 px-5 md:px-10 max-w-[1200px] mx-auto pt-8">
          {view.type === "overview" && (
            <OverviewView apiToken={apiToken} onError={setError}
              onSelectUser={(email) => setView({ type: "user", email })}
              onSelectProduction={(id) => setView({ type: "production", id })} />
          )}
          {view.type === "user" && (
            <UserDetailView email={view.email} apiToken={apiToken} onError={setError}
              onBack={() => setView({ type: "overview" })}
              onSelectProduction={(id) => setView({ type: "production", id, fromUser: view.email })} />
          )}
          {view.type === "production" && (
            <ProductionDetailView id={view.id} apiToken={apiToken} onError={setError}
              onBack={() => view.fromUser ? setView({ type: "user", email: view.fromUser }) : setView({ type: "overview" })}
              onSelectUser={(email) => setView({ type: "user", email })} />
          )}
        </div>
      )}
      {consoleTab === "lab" && (
        <LabView apiToken={apiToken} />
      )}
    </div>
  );
}
