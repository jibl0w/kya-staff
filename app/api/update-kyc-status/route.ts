import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { customerId, accountType, action, rejectionReason } = await req.json();
  if (!customerId || !accountType || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (action === "reject" && !rejectionReason?.trim()) return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });

  // Guard: cannot APPROVE until all required documents are uploaded and approved.
  // Required: 4 for personal (KYC), 5 for business (KYB). Rejection is always allowed.
  if (action === "approve") {
    const { data: docRows } = await supabaseServer
      .from("documents")
      .select("status, verification_status")
      .eq("user_id", customerId);
    const approvedDocs = (docRows || []).filter(
      (d) => (d.status || d.verification_status) === "approved"
    ).length;
    const requiredDocs = accountType === "business" ? 5 : 4;
    if (approvedDocs < requiredDocs) {
      return NextResponse.json(
        { error: `Cannot approve: all required documents must be uploaded and approved first (${approvedDocs}/${requiredDocs} approved).` },
        { status: 400 }
      );
    }
  }

  const isBusiness = accountType === "business";
  const table = isBusiness ? "kyb_profiles" : "kyc_profiles";
  const statusCol = isBusiness ? "kyb_status" : "kyc_status";
  const newStatus = action === "approve" ? "approved" : "rejected";

  const { error } = await supabaseServer
    .from(table)
    .update({
      [statusCol]: newStatus,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: action === "reject" ? rejectionReason : null,
    })
    .eq("user_id", customerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const kind = isBusiness ? "KYB" : "KYC";
  await writeAuditLog({
    performedBy: userId,
    actionType: isBusiness ? "kyb_status_updated" : "kyc_status_updated",
    entityType: isBusiness ? "kyb_profile" : "kyc_profile",
    entityId: customerId,
    customerId: customerId,
    description: action === "approve"
      ? `${kind} approved — customer cleared due diligence`
      : `${kind} rejected — Reason: ${rejectionReason || "Not specified"}`,
    metadata: {
      account_type: accountType,
      decision: newStatus,
      rejection_reason: rejectionReason || null,
    },
  });

  // Customer notification
  try {
    const clerkRes = await fetch(
      "https://api.clerk.com/v1/users/" + customerId,
      { headers: { Authorization: "Bearer " + process.env.CLERK_SECRET_KEY }}
    );
    const clerkUser = await clerkRes.json();
    const customerEmail = clerkUser.email_addresses?.[0]?.email_address;
    const customerName = ((clerkUser.first_name || "") + " " + (clerkUser.last_name || "")).trim() || "Customer";

    if (customerEmail) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      if (action === "approve") {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "info@kya.com.ng",
          to: customerEmail,
          subject: "KYA — Verification Approved",
          html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#0A0E1A;margin:0;padding:40px 20px;">
            <table width="600" style="max-width:600px;margin:0 auto;background:#0D1420;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
              <tr><td style="background:linear-gradient(135deg,#1A2540,#0D1420);padding:32px 40px;border-bottom:2px solid #C9A84C;">
                <span style="font-size:28px;font-weight:900;color:#E8E0D0;font-family:Georgia,serif;">KY<span style="color:#C9A84C;">A</span></span>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#E8E0D0;margin:0 0 16px;">Hi ${customerName},</p>
                <p style="font-size:14px;color:#8A9AB5;line-height:1.75;margin:0 0 16px;">Your ${kind} verification has been <strong style="color:#10B981;">approved</strong>. You have successfully completed due diligence and now have full access to the KYA trade platform.</p>
                <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr><td style="background:#C9A84C;border-radius:8px;">
                    <a href="https://kya.com.ng/dashboard" style="display:inline-block;background:#C9A84C;color:#080C14;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">Access Dashboard &rarr;</a>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background:#080C14;padding:24px 40px;border-top:1px solid rgba(201,168,76,0.2);">
                <p style="font-size:11px;color:#4A5568;margin:0;">KYA Digital Services Ltd · Not a PSP · Not a Bank · CAC Registered</p>
              </td></tr>
            </table></body></html>`,
        });
      } else {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "info@kya.com.ng",
          to: customerEmail,
          subject: "KYA — Verification Requires Attention",
          html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#0A0E1A;margin:0;padding:40px 20px;">
            <table width="600" style="max-width:600px;margin:0 auto;background:#0D1420;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
              <tr><td style="background:linear-gradient(135deg,#1A2540,#0D1420);padding:32px 40px;border-bottom:2px solid #ef4444;">
                <span style="font-size:28px;font-weight:900;color:#E8E0D0;font-family:Georgia,serif;">KY<span style="color:#C9A84C;">A</span></span>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#E8E0D0;margin:0 0 16px;">Hi ${customerName},</p>
                <p style="font-size:14px;color:#8A9AB5;line-height:1.75;margin:0 0 16px;">Your ${kind} verification could not be approved at this time. This is a normal step, and you can resubmit your verification once you've addressed the reason below.</p>
                <div style="background:#080C14;border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;margin:16px 0;">
                  <p style="font-size:13px;color:#ef4444;font-weight:700;margin:0 0 4px;">Reason / Action Required</p>
                  <p style="font-size:13px;color:#8A9AB5;margin:0;">${rejectionReason || "Please contact our compliance team"}</p>
                </div>
                <p style="font-size:14px;color:#8A9AB5;line-height:1.75;">Please log in to your account and retry your verification. If you have any questions, our compliance team is here to help.</p>
                <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr><td style="background:#C9A84C;border-radius:8px;">
                    <a href="https://kya.com.ng/dashboard/onboarding" style="display:inline-block;background:#C9A84C;color:#080C14;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">Retry Verification &rarr;</a>
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

    // TODO (Phase 2): Notify Source MFB and ROECNY on approval.
    // Channel/integration not yet defined — wire up once agreements are formalised.
    if (action === "approve") {
      console.log(`[SOURCE/ROECNY NOTIFY — STUB] ${kind} approved for customer ${customerId}. Wire up real notification when channel defined.`);
    }
  } catch (err) { console.error("Notification error:", err); }

  return NextResponse.json({ success: true });
}