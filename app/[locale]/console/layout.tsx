"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { ConsoleShell } from "./ConsoleShell";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin?callbackUrl=/console");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-1">
        <Icon icon="svg-spinners:ring-resize" className="h-6 w-6 text-accent" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return <ConsoleShell>{children}</ConsoleShell>;
}
