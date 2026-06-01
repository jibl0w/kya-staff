import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { documentId, action, rejectionReason } = await req.json();
  if (!documentId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { data: doc } = await supabaseServer.from("documents").select("user_id, document_type, account_type").eq("id", documentId).single();
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const newStatus = action === "approve" ? "approved" : "rejected";

  const { error } = await supabaseServer.from("documents").update({
    status: newStatus,
    verification_status: newStatus,
    rejection_reason: action === "reject" ? rejectionReason : null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: userId,
  }).eq("id", documentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const clerkRes = await fetch("https://api.clerk.com/v1/users/" + doc.user_id, { headers: { Authorization: "Bearer " + process.env.CLERK_SECRET_KEY } });
    const clerkUser = await clerkRes.json();
    const customerEmail = clerkUser.email_addresses?.[0]?.email_address;
    const customerName = ((clerkUser.first_name || "") + " " + (clerkUser.last_name || "")).trim() || "Customer";

    if (customerEmail) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const docLabel = doc.document_type.replace(/_/g, " ");

      if (action === "approve") {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: customerEmail,
          subject: "KYA — Document Approved",
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h2 style="color:#f59e0b;">KYA Digital Services</h2><p>Hi ${customerName},</p><p>Your document <strong>${docLabel}</strong> has been approved.</p><p>Please log in to continue your onboarding.</p><hr/><p style="color:#6b7280;font-size:12px;">KYA Digital Services Ltd · Not a PSP · Not a Bank</p></div>`,
        });

        const { data: allDocs } = await supabaseServer.from("documents").select("status").eq("user_id", doc.user_id);
        const approved = (allDocs || []).filter(d => d.status === "approved").length;
        if (approved >= 5) {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            to: customerEmail,
            subject: "KYA — Account Verified",
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h2 style="color:#f59e0b;">KYA Digital Services</h2><p>Hi ${customerName},</p><p>Your account has been fully verified. You now have full access to the KYA trade platform.</p><hr/><p style="color:#6b7280;font-size:12px;">KYA Digital Services Ltd · Not a PSP · Not a Bank</p></div>`,
          });
        }
      } else {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: customerEmail,
          subject: "KYA — Document Requires Attention",
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h2 style="color:#f59e0b;">KYA Digital Services</h2><p>Hi ${customerName},</p><p>Your document <strong>${docLabel}</strong> requires attention.</p><p><strong>Reason:</strong> ${rejectionReason || "Document did not meet requirements"}</p><p>Please log in to re-upload the document.</p><hr/><p style="color:#6b7280;font-size:12px;">KYA Digital Services Ltd · Not a PSP · Not a Bank</p></div>`,
        });
      }
    }
  } catch (err) { console.error("Notification error:", err); }

  return NextResponse.json({ success: true });
}