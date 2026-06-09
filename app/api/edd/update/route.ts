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

  const { eddRequestId, status, notes } = await req.json();

  if (!eddRequestId || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Get EDD request for audit context
  const { data: eddRequest } = await supabaseServer
    .from("edd_requests")
    .select("user_id, reason")
    .eq("id", eddRequestId)
    .maybeSingle();

  const updateData: Record<string, unknown> = {
    status,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };

  if (status === "cleared") {
    updateData.cleared_at = new Date().toISOString();
    updateData.cleared_by = userId;
  }

  const { error } = await supabaseServer
    .from("edd_requests")
    .update(updateData)
    .eq("id", eddRequestId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    performedBy: userId,
    actionType: status === "cleared" ? "edd_cleared"
      : status === "escalated" ? "edd_escalated"
      : "edd_status_updated",
    entityType: "edd_request",
    entityId: eddRequestId,
    customerId: eddRequest?.user_id,
    description: `EDD request ${status.replace("_", " ")}: ${eddRequest?.reason || ""}${notes ? " — " + notes : ""}`,
    metadata: { status, notes, edd_request_id: eddRequestId },
  });

  return NextResponse.json({ success: true });
}