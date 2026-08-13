import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export async function GET() {
  const { data, error } = await supabaseServer
    .from("products")
    .select("*, suppliers(supplier_name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data || [] });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const {
    supplier_id, account_id, product_name, category, keywords, model_number,
    description, specifications, assembly_options, pricing, moq, lead_time,
    certifications, country_of_origin, warranty, media_link, status,
  } = body;

  if (!supplier_id || !product_name || !category) {
    return NextResponse.json({ error: "Supplier, product name and category are required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("products")
    .insert({
      supplier_id,
      account_id: account_id || null,
      product_name, category, keywords, model_number,
      description, specifications, assembly_options, pricing, moq, lead_time,
      certifications, country_of_origin, warranty, media_link,
      status: status || "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    performedBy: userId,
    actionType: "product_added",
    entityType: "product",
    entityId: data.id,
    description: `New product added: ${product_name} (${category})`,
    metadata: { product_name, category, supplier_id },
  });

  return NextResponse.json({ success: true, product: data });
}