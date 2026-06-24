import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";
import AuditClient from "./AuditClient";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export default async function AuditPage() {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/sign-in");

  const [
    { data: auditLogs },
    { data: kyc },
    { data: kyb },
  ] = await Promise.all([
    supabaseServer.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200),
    supabaseServer.from("kyc_profiles").select("user_id, first_name, last_name"),
    supabaseServer.from("kyb_profiles").select("user_id, company_name"),
  ]);

  // Build customer_id -> readable name map.
  const customerNames: Record<string, string> = {};
  (kyc || []).forEach((p: any) => {
    customerNames[p.user_id] = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  });
  (kyb || []).forEach((p: any) => {
    // Don't overwrite a personal name if one exists; otherwise use company name.
    if (!customerNames[p.user_id]) customerNames[p.user_id] = p.company_name;
  });

  return (
    <AuditClient
      auditLogs={auditLogs || []}
      customerNames={customerNames}
    />
  );
}