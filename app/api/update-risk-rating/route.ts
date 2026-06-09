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

  const { customerId, accountType, riskRating, riskNotes } = await req.json();

  if (!customerId || !accountType || !riskRating) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const table = accountType === "personal" ? "kyc_profiles" : "kyb_profiles";

  const { error } = await supabaseServer
    .from(table)
    .update({
      risk_rating: riskRating,
      risk_notes: riskNotes || null,
      risk_updated_at: new Date().toISOString(),
      risk_updated_by: userId,
    })
    .eq("user_id", customerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    performedBy: userId,
    actionType: "risk_rating_updated",
    entityType: accountType === "personal" ? "kyc_profile" : "kyb_profile",
    entityId: customerId,
    customerId,
    description: `Risk rating updated to ${riskRating.toUpperCase()} for ${accountType} account${riskNotes ? " — " + riskNotes : ""}`,
    metadata: { risk_rating: riskRating, risk_notes: riskNotes, account_type: accountType },
  });

  return NextResponse.json({ success: true });
}