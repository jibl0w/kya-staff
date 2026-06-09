import { supabaseServer } from "@/lib/supabase-server";

export type AuditActionType =
  | "document_approved"
  | "document_rejected"
  | "document_reapproved"
  | "kyc_status_updated"
  | "kyb_status_updated"
  | "risk_rating_updated"
  | "edd_requested"
  | "edd_status_updated"
  | "edd_cleared"
  | "edd_escalated"
  | "transaction_step_advanced"
  | "transaction_step_reverted"
  | "transaction_flagged"
  | "supplier_added"
  | "supplier_verified"
  | "supplier_suspended"
  | "supplier_deleted"
  | "supplier_edited";

export type AuditEntityType =
  | "document"
  | "kyc_profile"
  | "kyb_profile"
  | "transaction"
  | "edd_request"
  | "supplier";

interface AuditEntry {
  performedBy: string;
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  customerId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await supabaseServer.from("audit_log").insert({
      performed_by: entry.performedBy,
      action_type: entry.actionType,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      customer_id: entry.customerId || null,
      description: entry.description,
      metadata: entry.metadata || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}