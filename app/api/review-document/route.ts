import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { documentId, action, rejectionReason } = await req.json();
  if (!documentId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { data: doc } = await supabaseServer
    .from("documents")
    .select("user_id, document_type, account_type")
    .eq("id", documentId)
    .single();

  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const newStatus = action === "approve" ? "approved" : "rejected";

  const { error } = await supabaseServer
    .from("documents")
    .update({
      status: newStatus,
      verification_status: newStatus,
      rejection_reason: action === "reject" ? rejectionReason : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq("id", documentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Write audit log
  await writeAuditLog({
    performedBy: userId,
    actionType: action === "approve" ? "document_approved" : "document_rejected",
    entityType: "document",
    entityId: documentId,
    customerId: doc.user_id,
    description: action === "approve"
      ? `Document approved: ${doc.document_type.replace(/_/g, " ")}`
      : `Document rejected: ${doc.document_type.replace(/_/g, " ")} — Reason: ${rejectionReason || "Not specified"}`,
    metadata: {
      document_type: doc.document_type,
      account_type: doc.account_type,
      rejection_reason: rejectionReason || null,
    },
  });

  try {
    const clerkRes = await fetch(
      "https://api.clerk.com/v1/users/" + doc.user_id,
      { headers: { Authorization: "Bearer " + process.env.CLERK_SECRET_KEY } }
    );
    const clerkUser = await clerkRes.json();
    const customerEmail = clerkUser.email_addresses?.[0]?.email_address;
    const customerName = ((clerkUser.first_name || "") + " " + (clerkUser.last_name || "")).trim() || "Customer";

    if (customerEmail) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const docLabel = doc.document_type.replace(/_/g, " ");

      if (action === "approve") {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "info@kya.com.ng",
          to: customerEmail,
          subject: "KYA — Document Approved",
          html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#0A0E1A;margin:0;padding:40px 20px;">
            <table width="600" style="max-width:600px;margin:0 auto;background:#0D1420;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
              <tr><td style="background:linear-gradient(135deg,#1A2540,#0D1420);padding:32px 40px;border-bottom:2px solid #C9A84C;">
                <span style="font-size:28px;font-weight:900;color:#E8E0D0;font-family:Georgia,serif;">KY<span style="color:#C9A84C;">A</span></span>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#E8E0D0;margin:0 0 16px;">Hi ${customerName},</p>
                <p style="font-size:14px;color:#8A9AB5;line-height:1.75;margin:0 0 16px;">Your document <strong style="color:#E8E0D0;">${docLabel}</strong> has been approved by our compliance team.</p>
                <p style="font-size:14px;color:#8A9AB5;line-height:1.75;">Please log in to continue your onboarding.</p>
              </td></tr>
              <tr><td style="background:#080C14;padding:24px 40px;border-top:1px solid rgba(201,168,76,0.2);">
                <p style="font-size:11px;color:#4A5568;margin:0;">KYA Digital Services Ltd · Not a PSP · Not a Bank · CAC Registered</p>
              </td></tr>
            </table></body></html>`,
        });

        const { data: allDocs } = await supabaseServer
          .from("documents")
          .select("status")
          .eq("user_id", doc.user_id);

        const approved = (allDocs || []).filter(d => d.status === "approved").length;

        if (approved >= 5) {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "info@kya.com.ng",
            to: customerEmail,
            subject: "KYA — Account Fully Verified",
            html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#0A0E1A;margin:0;padding:40px 20px;">
              <table width="600" style="max-width:600px;margin:0 auto;background:#0D1420;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
                <tr><td style="background:linear-gradient(135deg,#1A2540,#0D1420);padding:32px 40px;border-bottom:2px solid #C9A84C;">
                  <span style="font-size:28px;font-weight:900;color:#E8E0D0;font-family:Georgia,serif;">KY<span style="color:#C9A84C;">A</span></span>
                </td></tr>
                <tr><td style="padding:40px;">
                  <p style="font-size:16px;color:#E8E0D0;margin:0 0 16px;">Hi ${customerName},</p>
                  <p style="font-size:14px;color:#8A9AB5;line-height:1.75;margin:0 0 16px;">Your account has been <strong style="color:#10B981;">fully verified</strong>. You now have full access to the KYA trade platform.</p>
                  <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
                    <tr><td style="background:#C9A84C;border-radius:8px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://kya.com.ng"}/dashboard" style="display:inline-block;background:#C9A84C;color:#080C14;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">Access Dashboard &rarr;</a>
                    </td></tr>
                  </table>
                </td></tr>
                <tr><td style="background:#080C14;padding:24px 40px;border-top:1px solid rgba(201,168,76,0.2);">
                  <p style="font-size:11px;color:#4A5568;margin:0;">KYA Digital Services Ltd · Not a PSP · Not a Bank · CAC Registered</p>
                </td></tr>
              </table></body></html>`,
          });
        }
      } else {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "info@kya.com.ng",
          to: customerEmail,
          subject: "KYA — Document Requires Attention",
          html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#0A0E1A;margin:0;padding:40px 20px;">
            <table width="600" style="max-width:600px;margin:0 auto;background:#0D1420;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
              <tr><td style="background:linear-gradient(135deg,#1A2540,#0D1420);padding:32px 40px;border-bottom:2px solid #ef4444;">
                <span style="font-size:28px;font-weight:900;color:#E8E0D0;font-family:Georgia,serif;">KY<span style="color:#C9A84C;">A</span></span>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="font-size:16px;color:#E8E0D0;margin:0 0 16px;">Hi ${customerName},</p>
                <p style="font-size:14px;color:#8A9AB5;line-height:1.75;margin:0 0 16px;">Your document <strong style="color:#E8E0D0;">${docLabel}</strong> requires attention.</p>
                <div style="background:#080C14;border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;margin:16px 0;">
                  <p style="font-size:13px;color:#ef4444;font-weight:700;margin:0 0 4px;">Reason</p>
                  <p style="font-size:13px;color:#8A9AB5;margin:0;">${rejectionReason || "Document did not meet requirements"}</p>
                </div>
                <p style="font-size:14px;color:#8A9AB5;line-height:1.75;">Please log in to re-upload the document.</p>
                <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr><td style="background:#C9A84C;border-radius:8px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://kya.com.ng"}/dashboard/documents" style="display:inline-block;background:#C9A84C;color:#080C14;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">Re-upload Document &rarr;</a>
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