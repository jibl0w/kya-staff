import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";
import CustomersClient from "./CustomersClient";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export default async function CustomersPage() {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/sign-in");

  const [
    { data: kycProfiles },
    { data: kybProfiles },
    { data: documents },
    { data: transactions },
  ] = await Promise.all([
    supabaseServer.from("kyc_profiles").select("*"),
    supabaseServer.from("kyb_profiles").select("*"),
    supabaseServer.from("documents").select("user_id, status, verification_status, document_type"),
    supabaseServer.from("transactions").select("user_id, status, total_value, currency, transaction_ref"),
  ]);

  return (
    <CustomersClient
      kycProfiles={kycProfiles || []}
      kybProfiles={kybProfiles || []}
      documents={documents || []}
      transactions={transactions || []}
    />
  );
}