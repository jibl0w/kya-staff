import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const { data: existing } = await supabaseServer
    .from("suppliers")
    .select("supplier_name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseServer
    .from("suppliers")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    performedBy: userId,
    actionType: "supplier_edited",
    entityType: "supplier",
    entityId: id,
    description: `Supplier edited: ${existing?.supplier_name || id}`,
    metadata: { supplier_name: existing?.supplier_name, updated_fields: Object.keys(body) },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;

  const { data: existing } = await supabaseServer
    .from("suppliers")
    .select("supplier_name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseServer
    .from("suppliers")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    performedBy: userId,
    actionType: "supplier_deleted",
    entityType: "supplier",
    entityId: id,
    description: `Supplier deleted: ${existing?.supplier_name || id}`,
    metadata: { supplier_name: existing?.supplier_name },
  });

  return NextResponse.json({ success: true });
}