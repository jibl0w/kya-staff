import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export async function GET() {
  const { data, error } = await supabaseServer
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ suppliers: data || [] });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const {
    supplier_name, trade_name, country, city, year_established,
    primary_category, sub_categories, products_offered,
    minimum_order_value, lead_time_days, payment_terms,
    currencies_accepted, contact_person, contact_email,
    contact_phone, website, internal_notes,
  } = body;

  if (!supplier_name || !primary_category) {
    return NextResponse.json({ error: "Supplier name and category are required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("suppliers")
    .insert({
      supplier_name, trade_name, country: country || "China", city,
      year_established, primary_category, sub_categories: sub_categories || [],
      products_offered, minimum_order_value: minimum_order_value || 0,
      lead_time_days: lead_time_days || 30, payment_terms: payment_terms || "LC",
      currencies_accepted: currencies_accepted || ["USD"],
      verification_status: "pending",
      contact_person, contact_email, contact_phone, website, internal_notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    performedBy: userId,
    actionType: "supplier_added",
    entityType: "supplier",
    entityId: data.id,
    description: `New supplier added: ${supplier_name} (${primary_category}, ${country || "China"})`,
    metadata: { supplier_name, primary_category, country },
  });

  return NextResponse.json({ success: true, supplier: data });
}