import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";
import ProductsClient from "./ProductsClient";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export default async function ProductsPage() {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/sign-in");

  const [{ data: products }, { data: suppliers }, { data: accounts }] = await Promise.all([
    supabaseServer.from("products").select("*, suppliers(supplier_name)").order("created_at", { ascending: false }),
    supabaseServer.from("suppliers").select("id, supplier_name, verification_status").order("supplier_name", { ascending: true }),
    supabaseServer.from("supplier_bank_accounts").select("id, supplier_id, label, currency"),
  ]);

  return (
    <ProductsClient
      products={products || []}
      suppliers={suppliers || []}
      accounts={accounts || []}
    />
  );
}