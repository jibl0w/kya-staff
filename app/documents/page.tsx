import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";
import DocumentsClient from "./DocumentsClient";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export default async function DocumentsPage() {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/sign-in");

  const [
    { data: documents },
    { data: transactionDocuments },
    { data: transactions },
    { data: kycProfiles },
    { data: kybProfiles },
  ] = await Promise.all([
    supabaseServer.from("documents").select("*").order("uploaded_at", { ascending: false }),
    supabaseServer.from("transaction_documents").select("*").order("uploaded_at", { ascending: false }),
    supabaseServer.from("transactions").select("id, transaction_ref, supplier_name, form_m_number, lc_number, total_value, currency"),
    supabaseServer.from("kyc_profiles").select("user_id, first_name, last_name, address, nationality, id_type, id_number, phone, email"),
    supabaseServer.from("kyb_profiles").select("user_id, company_name, cac_number, tin, business_type, registered_address, company_email, representative_title, representative_name, representative_email, representative_phone"),
  ]);

  return (
    <DocumentsClient
      documents={documents || []}
      transactionDocuments={transactionDocuments || []}
      transactions={transactions || []}
      kycProfiles={kycProfiles || []}
      kybProfiles={kybProfiles || []}
    />
  );
}