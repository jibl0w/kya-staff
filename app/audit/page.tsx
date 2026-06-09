import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";
import AuditClient from "./AuditClient";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export default async function AuditPage() {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/sign-in");

  const { data: auditLogs } = await supabaseServer
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return <AuditClient auditLogs={auditLogs || []} />;
}
