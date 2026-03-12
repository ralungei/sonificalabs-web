import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminDashboard } from "./AdminDashboard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default async function AdminPage() {
  const session = await auth();
  // @ts-expect-error - apiToken added in auth callback
  const apiToken = session?.apiToken as string | undefined;
  if (!session?.user?.email || !apiToken) {
    redirect("/");
  }

  // Check admin status from the backend (single source of truth)
  try {
    const res = await fetch(`${API_URL}/user/quota`, {
      headers: { Authorization: `Bearer ${apiToken}` },
      cache: "no-store",
    });
    if (!res.ok) { redirect("/"); }
    const quota = await res.json();
    if (!quota.isAdmin) { redirect("/"); }
  } catch {
    redirect("/");
  }

  return <AdminDashboard />;
}
