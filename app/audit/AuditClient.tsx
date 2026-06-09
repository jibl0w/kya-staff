"use client";

import { useState } from "react";
import Link from "next/link";

interface AuditLog {
  id: string;
  performed_by: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  customer_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

const actionColors: Record<string, string> = {
  document_approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  document_rejected: "text-red-400 bg-red-500/10 border-red-500/20",
  document_reapproved: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  risk_rating_updated: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  edd_requested: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  edd_status_updated: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  edd_cleared: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  edd_escalated: "text-red-400 bg-red-500/10 border-red-500/20",
  transaction_step_advanced: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  transaction_step_reverted: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  transaction_flagged: "text-red-400 bg-red-500/10 border-red-500/20",
  supplier_added: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  supplier_verified: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  supplier_suspended: "text-red-400 bg-red-500/10 border-red-500/20",
  supplier_deleted: "text-red-400 bg-red-500/10 border-red-500/20",
  supplier_edited: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const actionIcons: Record<string, string> = {
  document_approved: "✓",
  document_rejected: "✕",
  document_reapproved: "↺",
  risk_rating_updated: "⚑",
  edd_requested: "⚠",
  edd_status_updated: "↻",
  edd_cleared: "✓",
  edd_escalated: "↑",
  transaction_step_advanced: "→",
  transaction_step_reverted: "←",
  transaction_flagged: "⚠",
  supplier_added: "+",
  supplier_verified: "✓",
  supplier_suspended: "⊘",
  supplier_deleted: "✕",
  supplier_edited: "✎",
};

const ACTION_TYPES = [
  "all",
  "document_approved",
  "document_rejected",
  "risk_rating_updated",
  "edd_requested",
  "edd_cleared",
  "edd_escalated",
  "transaction_step_advanced",
  "transaction_step_reverted",
  "supplier_added",
  "supplier_verified",
  "supplier_suspended",
];

const ENTITY_TYPES = ["all", "document", "kyc_profile", "kyb_profile", "transaction", "edd_request", "supplier"];

export default function AuditClient({ auditLogs }: { auditLogs: AuditLog[] }) {
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filtered = auditLogs.filter(log => {
    const matchAction = actionFilter === "all" || log.action_type === actionFilter;
    const matchEntity = entityFilter === "all" || log.entity_type === entityFilter;
    const matchSearch = search === "" ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.action_type.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(search.toLowerCase()) ||
      (log.customer_id || "").toLowerCase().includes(search.toLowerCase());
    return matchAction && matchEntity && matchSearch;
  });

  const totalToday = auditLogs.filter(log => {
    const today = new Date();
    const logDate = new Date(log.created_at);
    return logDate.toDateString() === today.toDateString();
  }).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-8 py-5 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black">KY<span className="text-amber-400">A</span></h1>
          <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-0.5 text-xs font-medium text-amber-400">Staff Portal</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition">Dashboard</Link>
          <Link href="/documents" className="text-sm text-slate-400 hover:text-white transition">Documents</Link>
          <Link href="/transactions" className="text-sm text-slate-400 hover:text-white transition">Transactions</Link>
          <Link href="/customers" className="text-sm text-slate-400 hover:text-white transition">Customers</Link>
          <Link href="/suppliers" className="text-sm text-slate-400 hover:text-white transition">Suppliers</Link>
          <Link href="/audit" className="text-sm font-medium text-white border-b-2 border-amber-400 pb-0.5">Audit Log</Link>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-400 mb-1">CBN AML 2025 Compliance</p>
          <h2 className="text-3xl font-black">Compliance Audit Log</h2>
          <p className="text-slate-400 mt-1 text-sm">Complete record of all compliance actions performed on the KYA platform.</p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Records", value: auditLogs.length, color: "text-white" },
            { label: "Today", value: totalToday, color: "text-amber-400" },
            { label: "Documents", value: auditLogs.filter(l => l.entity_type === "document").length, color: "text-blue-400" },
            { label: "Transactions", value: auditLogs.filter(l => l.entity_type === "transaction").length, color: "text-purple-400" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className={"text-3xl font-black " + s.color}>{s.value}</p>
              <p className="text-sm font-medium text-white mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by description, entity ID, or customer..."
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50" />
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none">
            {ACTION_TYPES.map(a => (
              <option key={a} value={a}>{a === "all" ? "All Actions" : a.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none">
            {ENTITY_TYPES.map(e => (
              <option key={e} value={e}>{e === "all" ? "All Entities" : e.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        <p className="text-xs text-slate-500 mb-4">{filtered.length} records{search || actionFilter !== "all" || entityFilter !== "all" ? " matching filters" : ""}</p>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Log list */}
          <div className="flex flex-col gap-2">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="text-slate-400">No audit records found.</p>
              </div>
            ) : filtered.map(log => (
              <div key={log.id}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                className={"rounded-xl border p-4 cursor-pointer transition " + (selectedLog?.id === log.id ? "border-amber-400/40 bg-amber-400/5" : "border-white/10 bg-white/5 hover:border-white/20")}>
                <div className="flex items-start gap-3">
                  <span className={"flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold " + (actionColors[log.action_type] || "text-slate-400 bg-slate-500/10 border-slate-500/20")}>
                    {actionIcons[log.action_type] || "·"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm text-white leading-snug">{log.description}</p>
                      <p className="text-xs text-slate-600 flex-shrink-0">{new Date(log.created_at).toLocaleDateString("en-GB")}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className={"text-xs border rounded-full px-2 py-0.5 " + (actionColors[log.action_type] || "text-slate-400 border-slate-500/20 bg-slate-500/10")}>
                        {log.action_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-slate-600 border border-white/10 rounded-full px-2 py-0.5">
                        {log.entity_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-slate-600">
                        {new Date(log.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="sticky top-24">
            {!selectedLog ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="text-slate-400">Select a record to view full details.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={"w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold " + (actionColors[selectedLog.action_type] || "text-slate-400 bg-slate-500/10 border-slate-500/20")}>
                      {actionIcons[selectedLog.action_type] || "·"}
                    </span>
                    <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (actionColors[selectedLog.action_type] || "text-slate-400 border-slate-500/20 bg-slate-500/10")}>
                      {selectedLog.action_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white leading-relaxed">{selectedLog.description}</p>
                </div>

                <div className="p-6 flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Record Details</p>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                      {[
                        { label: "Timestamp", value: new Date(selectedLog.created_at).toLocaleString("en-GB") },
                        { label: "Action", value: selectedLog.action_type.replace(/_/g, " ") },
                        { label: "Entity Type", value: selectedLog.entity_type.replace(/_/g, " ") },
                        { label: "Entity ID", value: selectedLog.entity_id },
                        { label: "Customer ID", value: selectedLog.customer_id || "N/A" },
                        { label: "Performed By", value: selectedLog.performed_by },
                      ].map(row => (
                        <div key={row.label} className="flex items-start justify-between gap-4">
                          <p className="text-xs text-slate-500 flex-shrink-0">{row.label}</p>
                          <p className="text-xs text-white font-mono text-right break-all">{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Metadata</p>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <pre className="text-xs text-slate-400 overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}