import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";
import { Resend } from "resend";

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

  // Notify customer (and supervisor) on meaningful EDD status changes.
  if ((status === "cleared" || status === "escalated") && eddRequest?.user_id) {
    try {
      const [{ data: kyc }, { data: kyb }] = await Promise.all([
        supabaseServer.from("kyc_profiles").select("email, first_name").eq("user_id", eddRequest.user_id).maybeSingle(),
        supabaseServer.from("kyb_profiles").select("company_email, representative_email, company_name").eq("user_id", eddRequest.user_id).maybeSingle(),
      ]);
      const customerEmail = kyc?.email || kyb?.company_email || kyb?.representative_email;
      const customerName = kyc?.first_name || kyb?.company_name || "there";
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromAddr = process.env.RESEND_FROM_EMAIL || "KYA Digital Services <onboarding@kya.com.ng>";

      if (status === "cleared" && customerEmail) {
        await resend.emails.send({
          from: fromAddr,
          to: customerEmail,
          subject: "KYA — Your source-of-funds review is complete",
          text: `Hi ${customerName},\n\nYour Enhanced Due Diligence (source of funds) review has been completed and cleared by our compliance team.\n\nYou can now proceed with your transaction — please log in to your KYA dashboard to continue to the next step and authorise payment to your supplier.\n\nKind regards,\nKYA Digital Services`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a2540;"><h2 style="color:#C9A84C;">Source-of-Funds Review Complete</h2><p>Hi ${customerName},</p><p>Your Enhanced Due Diligence (source of funds) review has been <strong>completed and cleared</strong> by our compliance team.</p><p>You can now proceed with your transaction — please log in to your KYA dashboard to continue to the next step and authorise payment to your supplier.</p><p style="margin-top:24px;">Kind regards,<br/>KYA Digital Services</p></div>`,
        });
      }

      if (status === "escalated") {
        // Alert the supervisor.
        await resend.emails.send({
          from: fromAddr,
          to: "escalate@kya.com.ng",
          subject: "KYA — EDD Escalated for Supervisor Review",
          text: `An EDD request has been escalated and requires supervisor review.\n\nCustomer: ${customerName}\nCustomer email: ${customerEmail || "N/A"}\nReason: ${eddRequest.reason || "N/A"}\nNotes: ${notes || "None"}\n\nPlease review in the staff portal.`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a2540;"><h2 style="color:#C9A84C;">EDD Escalated for Supervisor Review</h2><p>An EDD request has been escalated and requires supervisor review.</p><p><strong>Customer:</strong> ${customerName}<br/><strong>Email:</strong> ${customerEmail || "N/A"}<br/><strong>Reason:</strong> ${eddRequest.reason || "N/A"}<br/><strong>Notes:</strong> ${notes || "None"}</p><p>Please review in the staff portal.</p></div>`,
        });
        // Keep the customer informed.
        if (customerEmail) {
          await resend.emails.send({
            from: fromAddr,
            to: customerEmail,
            subject: "KYA — Update on your source-of-funds review",
            text: `Hi ${customerName},\n\nYour Enhanced Due Diligence (source of funds) review requires some additional checks and has been escalated to a supervisor for further review.\n\nNo action is needed from you at this time — we will update you as soon as the review is complete.\n\nThank you for your patience.\n\nKind regards,\nKYA Digital Services`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a2540;"><h2 style="color:#C9A84C;">Update on Your Source-of-Funds Review</h2><p>Hi ${customerName},</p><p>Your Enhanced Due Diligence (source of funds) review requires some additional checks and has been <strong>escalated to a supervisor</strong> for further review.</p><p>No action is needed from you at this time — we will update you as soon as the review is complete.</p><p>Thank you for your patience.</p><p style="margin-top:24px;">Kind regards,<br/>KYA Digital Services</p></div>`,
          });
        }
      }
    } catch (err) {
      console.error("EDD status notification error:", err);
    }
  }

  return NextResponse.json({ success: true });
}