import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";
import SuppliersClient from "./SuppliersClient";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export default async function SuppliersPage() {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/sign-in");

  const { data: suppliers } = await supabaseServer
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false });

  return <SuppliersClient suppliers={suppliers || []} />;
}