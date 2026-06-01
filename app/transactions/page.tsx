import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";
import TransactionsClient from "./TransactionsClient";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export default async function TransactionsPage() {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/sign-in");

  const [
    { data: transactions },
    { data: steps },
    { data: transactionDocs },
    { data: kycProfiles },
    { data: kybProfiles },
  ] = await Promise.all([
    supabaseServer.from("transactions").select("*").order("created_at", { ascending: false }),
    supabaseServer.from("transaction_steps").select("*").order("step_number", { ascending: true }),
    supabaseServer.from("transaction_documents").select("*").order("uploaded_at", { ascending: false }),
    supabaseServer.from("kyc_profiles").select("user_id, first_name, last_name, address, nationality, phone, email"),
    supabaseServer.from("kyb_profiles").select("user_id, company_name, cac_number, registered_address, representative_title, representative_name, representative_phone, representative_email, company_email"),
  ]);

  return (
    <TransactionsClient
      transactions={transactions || []}
      steps={steps || []}
      transactionDocs={transactionDocs || []}
      kycProfiles={kycProfiles || []}
      kybProfiles={kybProfiles || []}
    />
  );
}