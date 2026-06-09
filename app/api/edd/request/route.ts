import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { customerId, reason, documentsRequired, notes } = await req.json();

  if (!customerId || !reason) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: existing } = await supabaseServer
    .from("edd_requests")
    .select("id, status")
    .eq("user_id", customerId)
    .in("status", ["pending", "in_progress"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "An active EDD request already exists for this customer" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("edd_requests")
    .insert({
      user_id: customerId,
      requested_by: userId,
      reason,
      documents_required: documentsRequired || [],
      notes: notes || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const clerkRes = await fetch(
      "https://api.clerk.com/v1/users/" + customerId,
      { headers: { Authorization: "Bearer " + process.env.CLERK_SECRET_KEY } }
    );
    const clerkUser = await clerkRes.json();
    const customerEmail = clerkUser.email_addresses?.[0]?.email_address;
    const customerName = ((clerkUser.first_name || "") + " " + (clerkUser.last_name || "")).trim() || "Customer";
    const customerUrl = process.env.NEXT_PUBLIC_CUSTOMER_URL || "https://kya.com.ng";
    const eddUrl = customerUrl + "/dashboard/edd";

    if (customerEmail) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const docsList = documentsRequired && documentsRequired.length > 0
        ? `<div style="background:#080C14;border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:20px;margin:20px 0;">
            <p style="font-size:13px;color:#C9A84C;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">Documents Required</p>
            <ul style="color:#8A9AB5;font-size:13px;line-height:2;padding-left:20px;margin:0;">
              ${documentsRequired.map((d: string) => `<li>${d}</li>`).join("")}
            </ul>
          </div>`
        : "";

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "info@kya.com.ng",
        to: customerEmail,
        subject: "KYA — Additional Verification Required",
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0A0E1A;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0E1A;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:linear-gradient(135deg,#1A2540 0%,#0D1420 100%);border-radius:16px 16px 0 0;padding:36px 40px;border-bottom:2px solid #C9A84C;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td><span style="font-size:32px;font-weight:900;color:#E8E0D0;font-family:Georgia,serif;">KY<span style="color:#C9A84C;">A</span></span>
            <p style="margin:4px 0 0;font-size:11px;color:#4A5568;text-transform:uppercase;letter-spacing:0.15em;">Digital Services</p></td>
            <td align="right"><span style="font-size:11px;color:#4A5568;text-transform:uppercase;letter-spacing:0.1em;">Compliance Notice</span></td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="background:#C9A84C;height:2px;padding:0;line-height:2px;font-size:0;">&nbsp;</td></tr>
      <tr><td style="background:#0D1420;padding:40px;">
        <p style="font-size:16px;color:#E8E0D0;margin:0 0 16px;">Hi ${customerName},</p>
        <p style="font-size:14px;color:#8A9AB5;line-height:1.75;margin:0 0 16px;">As part of our ongoing compliance obligations, we require some additional information and documentation from you before your account can proceed.</p>
        ${docsList}
        <p style="font-size:14px;color:#8A9AB5;line-height:1.75;margin:0 0 24px;">Please log in to your KYA dashboard to upload the required documents. Your account access may be limited until this process is complete.</p>
        <table cellpadding="0" cellspacing="0">
          <tr><td style="background:#C9A84C;border-radius:8px;">
            <a href="${eddUrl}" style="display:inline-block;background:#C9A84C;color:#080C14;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">Upload Documents &rarr;</a>
          </td></tr>
        </table>
        <p style="font-size:11px;color:#4A5568;margin-top:24px;line-height:1.6;">KYA Digital Services Ltd does not hold, transfer, or process customer funds. All financial activities are conducted exclusively by licensed banking and settlement partners.</p>
      </td></tr>
      <tr><td style="background:linear-gradient(135deg,#0D1420 0%,#080C14 100%);border-radius:0 0 16px 16px;padding:28px 40px;border-top:1px solid rgba(201,168,76,0.2);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td><p style="margin:0;font-size:12px;color:#4A5568;line-height:1.8;"><strong style="color:#6B7280;">KYA Digital Services Ltd</strong><br/>CAC Registered &nbsp;&middot;&nbsp; Lagos, Nigeria<br/>Not a PSP &nbsp;&middot;&nbsp; Not a Bank &nbsp;&middot;&nbsp; Trade Infrastructure Platform</p></td>
            <td align="right" valign="top"><a href="https://kya.ng" style="font-size:12px;color:#C9A84C;text-decoration:none;font-weight:600;">kya.ng</a></td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`,
      });
    }
  } catch (err) {
    console.error("EDD notification error:", err);
  }

  return NextResponse.json({ success: true, eddRequestId: data.id });
}