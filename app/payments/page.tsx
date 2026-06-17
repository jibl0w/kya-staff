import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";
import PaymentsClient from "./PaymentsClient";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export default async function PaymentsPage() {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/sign-in");

  const [
    { data: instructions },
    { data: confirmations },
    { data: ledger },
    { data: transactions },
  ] = await Promise.all([
    supabaseServer.from("payment_instructions").select("*").order("created_at", { ascending: false }),
    supabaseServer.from("payment_confirmations").select("*").order("received_at", { ascending: false }),
    supabaseServer.from("settlement_ledger").select("*").order("recorded_at", { ascending: true }),
    supabaseServer.from("transactions").select("id, transaction_ref, supplier_name, user_id"),
  ]);

  return (
    <PaymentsClient
      instructions={instructions || []}
      confirmations={confirmations || []}
      ledger={ledger || []}
      transactions={transactions || []}
    />
  );
}