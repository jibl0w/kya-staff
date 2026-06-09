import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

const STEP_NAMES = [
  "Customer Onboarding", "Supplier Selection", "Trade Setup",
  "Form M Submission", "Funding Instruction", "LC Issuance",
  "Pre-Shipment Inspection", "Shipment", "Document Validation",
  "FX Processing", "USD Credit", "Payment Instruction",
  "Payment Execution", "LC Liquidation", "Transaction Completion",
];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { transactionId, currentStep, nextStep, note, formMNumber, lcNumber, adReference, revert } = await req.json();

  if (!transactionId || !nextStep) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const updateData: Record<string, unknown> = {
    current_step: nextStep,
    status: nextStep === 15 ? "complete" : "active",
    updated_at: new Date().toISOString(),
  };

  if (formMNumber) updateData.form_m_number = formMNumber;
  if (lcNumber) updateData.lc_number = lcNumber;
  if (adReference) updateData.ad_reference = adReference;

  const { error: txnError } = await supabaseServer
    .from("transactions")
    .update(updateData)
    .eq("id", transactionId);

  if (txnError) return NextResponse.json({ error: txnError.message }, { status: 500 });

  if (!revert) {
    await supabaseServer.from("transaction_steps").update({
      status: "complete",
      completed_at: new Date().toISOString(),
      notes: note || null,
      completed_by: userId,
    }).eq("transaction_id", transactionId).eq("step_number", currentStep);
  } else {
    await supabaseServer.from("transaction_steps").update({
      status: "pending",
      completed_at: null,
      notes: null,
    }).eq("transaction_id", transactionId).eq("step_number", currentStep);
  }

  await supabaseServer
    .from("transaction_steps")
    .update({ status: "active" })
    .eq("transaction_id", transactionId)
    .eq("step_number", nextStep);

  // Get transaction for audit and notification context
  const { data: txn } = await supabaseServer
    .from("transactions")
    .select("user_id, transaction_ref, supplier_name")
    .eq("id", transactionId)
    .single();

  // Write audit log
  await writeAuditLog({
    performedBy: userId,
    actionType: revert ? "transaction_step_reverted" : "transaction_step_advanced",
    entityType: "transaction",
    entityId: transactionId,
    customerId: txn?.user_id,
    description: revert
      ? `Transaction ${txn?.transaction_ref} reverted from Step ${currentStep} (${STEP_NAMES[currentStep - 1]}) to Step ${nextStep} (${STEP_NAMES[nextStep - 1]})`
      : `Transaction ${txn?.transaction_ref} advanced to Step ${nextStep}: ${STEP_NAMES[nextStep - 1]}${note ? " — " + note : ""}`,
    metadata: {
      transaction_ref: txn?.transaction_ref,
      supplier_name: txn?.supplier_name,
      from_step: currentStep,
      to_step: nextStep,
      note: note || null,
      form_m_number: formMNumber || null,
      lc_number: lcNumber || null,
      revert: revert || false,
    },
  });

  try {
    if (txn && !revert) {
      const clerkRes = await fetch(
        "https://api.clerk.com/v1/users/" + txn.user_id,
        { headers: { Authorization: "Bearer " + process.env.CLERK_SECRET_KEY } }
      );
      const clerkUser = await clerkRes.json();
      const customerEmail = clerkUser.email_addresses?.[0]?.email_address;
      const customerName = ((clerkUser.first_name || "") + " " + (clerkUser.last_name || "")).trim() || "Customer";

      if (customerEmail) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "info@kya.com.ng",
          to: customerEmail,
          subject: "KYA — Transaction Update: " + txn.transaction_ref,
          html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#0A0E1A;margin:0;padding:40px 20px;">
            <table width="600" style="max-width:600px;margin:0 auto;background:#0D1420;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
              <tr><td style="background:linear-gradient(135deg,#1A2540,#0D1420);padding:32px 40px;border-bottom:2px solid #C9A84C;">
                <span style="font-size:28px;font-weight:900;color:#E8E0D0;font-family:Georgia,serif;">KY<span style="color:#C9A84C;">A</span></span>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#E8E0D0;margin:0 0 16px;">Hi ${customerName},</p>
                <p style="font-size:14px;color:#8A9AB5;line-height:1.75;margin:0 0 16px;">Your transaction <strong style="color:#E8E0D0;">${txn.transaction_ref}</strong> has been advanced to:</p>
                <div style="background:#080C14;border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:16px;margin:16px 0;">
                  <p style="font-size:13px;color:#C9A84C;font-weight:700;margin:0 0 4px;">Step ${nextStep} of 15</p>
                  <p style="font-size:16px;color:#E8E0D0;font-weight:700;margin:0;">${STEP_NAMES[nextStep - 1]}</p>
                </div>
                <p style="font-size:14px;color:#8A9AB5;">Supplier: ${txn.supplier_name}</p>
                ${note ? `<p style="font-size:14px;color:#8A9AB5;">Note: ${note}</p>` : ""}
                <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr><td style="background:#C9A84C;border-radius:8px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://kya.com.ng"}/dashboard" style="display:inline-block;background:#C9A84C;color:#080C14;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">View Dashboard &rarr;</a>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background:#080C14;padding:24px 40px;border-top:1px solid rgba(201,168,76,0.2);">
                <p style="font-size:11px;color:#4A5568;margin:0;">KYA Digital Services Ltd · Not a PSP · Not a Bank · CAC Registered</p>
              </td></tr>
            </table></body></html>`,
        });
      }
    }
  } catch (err) { console.error("Notification error:", err); }

  return NextResponse.json({ success: true });
}