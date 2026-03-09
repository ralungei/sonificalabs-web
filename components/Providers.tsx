"use client";
import { createContext, useContext } from "react";
import { SessionProvider, useSession } from "next-auth/react";

const ApiTokenContext = createContext<string | null>(null);

export function useApiToken(): string | null {
  return useContext(ApiTokenContext);
}

function ApiTokenProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const token = (session as unknown as Record<string, unknown> | null)?.apiToken as string | undefined ?? null;

  return (
    <ApiTokenContext.Provider value={token}>
      {children}
    </ApiTokenContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApiTokenProvider>{children}</ApiTokenProvider>
    </SessionProvider>
  );
}
