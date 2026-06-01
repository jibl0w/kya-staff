import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

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

  const { error: txnError } = await supabaseServer.from("transactions").update(updateData).eq("id", transactionId);
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

  await supabaseServer.from("transaction_steps").update({ status: "active" }).eq("transaction_id", transactionId).eq("step_number", nextStep);

  try {
    const { data: txn } = await supabaseServer.from("transactions").select("user_id, transaction_ref, supplier_name").eq("id", transactionId).single();
    if (txn && !revert) {
      const clerkRes = await fetch("https://api.clerk.com/v1/users/" + txn.user_id, { headers: { Authorization: "Bearer " + process.env.CLERK_SECRET_KEY } });
      const clerkUser = await clerkRes.json();
      const customerEmail = clerkUser.email_addresses?.[0]?.email_address;
      const customerName = ((clerkUser.first_name || "") + " " + (clerkUser.last_name || "")).trim() || "Customer";

      if (customerEmail) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const STEP_NAMES = ["Customer Onboarding", "Supplier Selection", "Trade Setup", "Form M Submission", "Funding Instruction", "LC Issuance", "Pre-Shipment Inspection", "Shipment", "Document Validation", "FX Processing", "USD Credit", "Payment Instruction", "Payment Execution", "LC Liquidation", "Transaction Completion"];

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: customerEmail,
          subject: "KYA — Transaction Update: " + txn.transaction_ref,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h2 style="color:#f59e0b;">KYA Digital Services</h2><p>Hi ${customerName},</p><p>Your transaction <strong>${txn.transaction_ref}</strong> has been advanced to Step ${nextStep}: <strong>${STEP_NAMES[nextStep - 1]}</strong>.</p><p>Supplier: ${txn.supplier_name}</p>${note ? `<p>Note: ${note}</p>` : ""}<p>Log in to your KYA dashboard to view the full status.</p><hr/><p style="color:#6b7280;font-size:12px;">KYA Digital Services Ltd · Not a PSP · Not a Bank</p></div>`,
        });
      }
    }
  } catch (err) { console.error("Notification error:", err); }

  return NextResponse.json({ success: true });
}