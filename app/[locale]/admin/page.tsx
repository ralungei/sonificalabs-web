import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ADMIN_EMAILS } from "@/lib/types";
import { AdminDashboard } from "./AdminDashboard";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/");
  }

  return <AdminDashboard />;
}
