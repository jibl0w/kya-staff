import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { supplierId, status } = await req.json();

  if (!supplierId || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    verification_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === "verified") {
    updateData.verified_at = new Date().toISOString();
    updateData.verified_by = userId;
  }

  const { error } = await supabaseServer
    .from("suppliers")
    .update(updateData)
    .eq("id", supplierId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}