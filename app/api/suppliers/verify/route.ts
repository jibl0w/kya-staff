import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

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

  const { data: supplier } = await supabaseServer
    .from("suppliers")
    .select("supplier_name")
    .eq("id", supplierId)
    .maybeSingle();

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

  await writeAuditLog({
    performedBy: userId,
    actionType: status === "verified" ? "supplier_verified" : status === "suspended" ? "supplier_suspended" : "supplier_edited",
    entityType: "supplier",
    entityId: supplierId,
    description: `Supplier ${supplier?.supplier_name || supplierId} ${status === "verified" ? "verified" : status === "suspended" ? "suspended" : "reinstated"}`,
    metadata: { supplier_name: supplier?.supplier_name, status },
  });

  return NextResponse.json({ success: true });
}