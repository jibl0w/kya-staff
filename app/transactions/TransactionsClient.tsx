"use client";

import { useState } from "react";
import Link from "next/link";

interface Transaction {
  id: string;
  user_id: string;
  transaction_ref: string;
  supplier_name: string;
  supplier_category: string;
  product_description: string;
  quantity: string;
  unit_price: number;
  total_value: number;
  currency: string;
  port_of_destination: string;
  status: string;
  current_step: number;
  form_m_number?: string;
  lc_number?: string;
  ad_reference?: string;
  notes?: string;
  created_at: string;
  risk_flag?: boolean;
  risk_flag_reason?: string;
  monitoring_status?: string;
}

interface Step {
  id: string;
  transaction_id: string;
  step_number: number;
  step_name: string;
  status: string;
  completed_at?: string;
  notes?: string;
}

interface TxnDoc {
  id: string;
  transaction_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  status: string;
  uploaded_at: string;
}

interface KycProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  address?: string;
  nationality?: string;
  phone?: string;
  email?: string;
}

interface KybProfile {
  user_id: string;
  company_name: string;
  cac_number?: string;
  registered_address?: string;
  representative_title?: string;
  representative_name?: string;
  representative_phone?: string;
  representative_email?: string;
  company_email?: string;
}

interface Props {
  transactions: Transaction[];
  steps: Step[];
  transactionDocs: TxnDoc[];
  kycProfiles: KycProfile[];
  kybProfiles: KybProfile[];
}

const STEP_NAMES = [
  "Customer Onboarding", "Supplier Selection", "Trade Setup",
  "Form M Submission", "Funding Instruction", "LC Issuance",
  "Pre-Shipment Inspection", "Shipment", "Document Validation",
  "FX Processing", "USD Credit", "Payment Instruction",
  "Payment Execution", "LC Liquidation", "Transaction Completion",
];

const DOC_LABELS: Record<string, string> = {
  proforma_invoice: "Proforma Invoice",
  form_m: "Form M",
  bill_of_lading: "Bill of Lading",
  commercial_invoice: "Commercial Invoice",
  packing_list: "Packing List",
  certificate_of_origin: "Certificate of Origin",
};

const statusColors: Record<string, string> = {
  draft: "text-slate-400 border-slate-500/30 bg-slate-500/10",
  active: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  complete: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

export default function TransactionsClient({ transactions = [], steps = [], transactionDocs = [], kycProfiles = [], kybProfiles = [] }: Props) {
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [localTxns, setLocalTxns] = useState<Transaction[]>(transactions);
  const [localSteps, setLocalSteps] = useState<Step[]>(steps);
  const [updating, setUpdating] = useState(false);
  const [stepNote, setStepNote] = useState("");
  const [formM, setFormM] = useState("");
  const [lcNumber, setLcNumber] = useState("");
  const [adReference, setAdReference] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeDetailTab, setActiveDetailTab] = useState<"steps" | "identity" | "documents">("steps");

  function getKycProfile(uid: string) { return kycProfiles.find(p => p.user_id === uid) || null; }
  function getKybProfile(uid: string) { return kybProfiles.find(p => p.user_id === uid) || null; }
  function isBusiness(uid: string) { return !!getKybProfile(uid); }

  function getCustomerName(uid: string) {
    const kyc = getKycProfile(uid);
    if (kyc) return (kyc.first_name + " " + kyc.last_name).trim() || "KYC Customer";
    const kyb = getKybProfile(uid);
    if (kyb) return kyb.company_name || "KYB Customer";
    return "Unknown";
  }

  function getTxnSteps(txnId: string) {
    return localSteps.filter(s => s.transaction_id === txnId).sort((a, b) => a.step_number - b.step_number);
  }

  function getTxnDocs(txnId: string) {
    return transactionDocs.filter(d => d.transaction_id === txnId);
  }

  async function advanceStep(txn: Transaction) {
    if (txn.current_step >= 15) return;
    setUpdating(true);
    const nextStep = txn.current_step + 1;
    try {
      const res = await fetch("/api/update-transaction-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txn.id, currentStep: txn.current_step, nextStep, note: stepNote, formMNumber: formM, lcNumber, adReference }),
      });
      if (res.ok) {
        setLocalTxns(prev => prev.map(t => t.id === txn.id ? { ...t, current_step: nextStep, status: nextStep === 15 ? "complete" : "active", form_m_number: formM || t.form_m_number, lc_number: lcNumber || t.lc_number, ad_reference: adReference || t.ad_reference } : t));
        setLocalSteps(prev => prev.map(s => {
          if (s.transaction_id === txn.id && s.step_number === txn.current_step) return { ...s, status: "complete", completed_at: new Date().toISOString(), notes: stepNote };
          if (s.transaction_id === txn.id && s.step_number === nextStep) return { ...s, status: "active" };
          return s;
        }));
        setSelectedTxn(prev => prev ? { ...prev, current_step: nextStep, status: nextStep === 15 ? "complete" : "active", form_m_number: formM || prev.form_m_number, lc_number: lcNumber || prev.lc_number, ad_reference: adReference || prev.ad_reference } : null);
        setStepNote("");
      }
    } finally { setUpdating(false); }
  }

  async function revertStep(txn: Transaction) {
    if (txn.current_step <= 1) return;
    setUpdating(true);
    const prevStep = txn.current_step - 1;
    try {
      const res = await fetch("/api/update-transaction-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txn.id, currentStep: txn.current_step, nextStep: prevStep, revert: true }),
      });
      if (res.ok) {
        setLocalTxns(prev => prev.map(t => t.id === txn.id ? { ...t, current_step: prevStep, status: "active" } : t));
        setLocalSteps(prev => prev.map(s => {
          if (s.transaction_id === txn.id && s.step_number === txn.current_step) return { ...s, status: "pending", completed_at: undefined };
          if (s.transaction_id === txn.id && s.step_number === prevStep) return { ...s, status: "active" };
          return s;
        }));
        setSelectedTxn(prev => prev ? { ...prev, current_step: prevStep, status: "active" } : null);
      }
    } finally { setUpdating(false); }
  }

  const filtered = localTxns.filter(t => statusFilter === "all" ? true : t.status === statusFilter);
  const activeCount = localTxns.filter(t => t.status === "active" || t.status === "draft").length;
  const completeCount = localTxns.filter(t => t.status === "complete").length;
  const flaggedCount = localTxns.filter(t => t.risk_flag).length;

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
          <Link href="/transactions" className="text-sm font-medium text-white border-b-2 border-amber-400 pb-0.5">Transactions</Link>
          <Link href="/customers" className="text-sm text-slate-400 hover:text-white transition">Customers</Link>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-400 mb-1">Transaction Management</p>
          <h2 className="text-3xl font-black">Manage Transactions</h2>
          <p className="text-slate-400 mt-1 text-sm">Advance transactions through the 15-step KYA trade process.</p>
        </div>

        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: localTxns.length, color: "text-white" },
            { label: "Active", value: activeCount, color: "text-amber-400" },
            { label: "Complete", value: completeCount, color: "text-emerald-400" },
            { label: "Flagged", value: flaggedCount, color: flaggedCount > 0 ? "text-red-400" : "text-white" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className={"text-3xl font-black " + s.color}>{s.value}</p>
              <p className="text-sm font-medium text-white mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "draft", "active", "complete"] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={"rounded-lg px-4 py-2 text-sm font-medium transition capitalize " + (statusFilter === f ? "bg-amber-400 text-slate-950" : "border border-white/10 text-slate-400 hover:text-white")}>
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Transaction list */}
          <div className="flex flex-col gap-4">
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="text-slate-400">No transactions found.</p>
              </div>
            )}
            {filtered.map(txn => {
              const txnSteps = getTxnSteps(txn.id);
              const completedSteps = txnSteps.filter(s => s.status === "complete").length;
              const progress = Math.round((completedSteps / 15) * 100);
              const kyb = getKybProfile(txn.user_id);

              return (
                <div key={txn.id}
                  onClick={() => { setSelectedTxn(txn); setFormM(txn.form_m_number || ""); setLcNumber(txn.lc_number || ""); setAdReference(txn.ad_reference || ""); setStepNote(""); setActiveDetailTab("steps"); }}
                  className={"rounded-2xl border p-5 cursor-pointer transition " + (selectedTxn?.id === txn.id ? "border-amber-400/40 bg-amber-400/5" : txn.risk_flag ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50" : "border-white/10 bg-white/5 hover:border-white/20")}>

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Supplier</p>
                      <p className="font-bold text-white">{txn.supplier_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (statusColors[txn.status] || statusColors.draft)}>{txn.status}</span>
                      {txn.risk_flag && (
                        <span className="text-xs font-medium border rounded-full px-2 py-0.5 text-red-400 border-red-500/30 bg-red-500/10">
                          ⚠ Flagged
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white/5 px-3 py-2 mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Customer</p>
                      <p className="text-sm font-semibold text-amber-400">{getCustomerName(txn.user_id)}</p>
                      {isBusiness(txn.user_id) && kyb?.cac_number && <p className="text-xs text-slate-500 font-mono">CAC: {kyb.cac_number}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">KYA Ref</p>
                      <p className="text-xs font-mono text-white">{txn.transaction_ref}</p>
                      {txn.form_m_number && <><p className="text-xs text-slate-500 mt-0.5">Form M</p><p className="text-xs font-mono text-blue-400">{txn.form_m_number}</p></>}
                      {txn.lc_number && <><p className="text-xs text-slate-500 mt-0.5">LC</p><p className="text-xs font-mono text-purple-400">{txn.lc_number}</p></>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500">Step {txn.current_step} of 15 — {STEP_NAMES[txn.current_step - 1] || ""}</p>
                    <p className="text-xs text-amber-400">{progress}%</p>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5">
                    <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: progress + "%" }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-slate-500">${Number(txn.total_value).toLocaleString()} {txn.currency}</p>
                    <p className="text-xs text-slate-500">{new Date(txn.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          <div>
            {!selectedTxn ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center sticky top-24">
                <p className="text-slate-400">Select a transaction to manage it.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden sticky top-24 max-h-[80vh] overflow-y-auto">

                {/* Header */}
                <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Supplier</p>
                      <p className="font-bold text-white text-lg">{selectedTxn.supplier_name}</p>
                      <p className="text-xs text-slate-500">{selectedTxn.supplier_category} · {selectedTxn.port_of_destination}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (statusColors[selectedTxn.status] || statusColors.draft)}>{selectedTxn.status}</span>
                      {selectedTxn.risk_flag && (
                        <span className="text-xs font-medium border rounded-full px-2 py-0.5 text-red-400 border-red-500/30 bg-red-500/10">
                          ⚠ Flagged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Risk flag alert */}
                  {selectedTxn.risk_flag && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 mb-3">
                      <p className="text-xs text-red-400 font-semibold mb-1">⚠ Transaction Monitoring Alert</p>
                      <p className="text-xs text-slate-400">{selectedTxn.risk_flag_reason}</p>
                    </div>
                  )}

                  {/* Customer panel */}
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 mb-3">
                    <p className="text-xs text-amber-400 mb-1 font-medium">Customer</p>
                    {isBusiness(selectedTxn.user_id) ? (
                      <>
                        <p className="font-semibold text-white">{getKybProfile(selectedTxn.user_id)?.company_name}</p>
                        <p className="text-xs text-slate-400">Director: {getKybProfile(selectedTxn.user_id)?.representative_title} {getKybProfile(selectedTxn.user_id)?.representative_name}</p>
                        {getKybProfile(selectedTxn.user_id)?.cac_number && <p className="text-xs text-slate-400 font-mono">CAC: {getKybProfile(selectedTxn.user_id)?.cac_number}</p>}
                        {getKybProfile(selectedTxn.user_id)?.registered_address && <p className="text-xs text-slate-400">{getKybProfile(selectedTxn.user_id)?.registered_address}</p>}
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-white">{getCustomerName(selectedTxn.user_id)}</p>
                        {getKycProfile(selectedTxn.user_id)?.nationality && <p className="text-xs text-slate-400">{getKycProfile(selectedTxn.user_id)?.nationality}</p>}
                        {getKycProfile(selectedTxn.user_id)?.address && <p className="text-xs text-slate-400">{getKycProfile(selectedTxn.user_id)?.address}</p>}
                        {getKycProfile(selectedTxn.user_id)?.phone && <p className="text-xs text-slate-400">{getKycProfile(selectedTxn.user_id)?.phone}</p>}
                      </>
                    )}
                  </div>

                  {/* Reference numbers */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Reference Numbers</p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">KYA Reference</p>
                        <p className="text-xs font-mono text-white">{selectedTxn.transaction_ref}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Form M / AD Reference</p>
                        <p className={"text-xs font-mono " + (selectedTxn.form_m_number ? "text-blue-400" : "text-slate-600")}>{selectedTxn.form_m_number || "Not yet assigned"}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">LC Number</p>
                        <p className={"text-xs font-mono " + (selectedTxn.lc_number ? "text-purple-400" : "text-slate-600")}>{selectedTxn.lc_number || "Not yet issued"}</p>
                      </div>
                      {selectedTxn.form_m_number && selectedTxn.lc_number && (
                        <div className="mt-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
                          <p className="text-xs text-emerald-400">✓ KYA · Form M · LC references linked</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-5">

                  {/* Detail tabs */}
                  <div className="flex gap-2">
                    {(["steps", "identity", "documents"] as const).map(tab => (
                      <button key={tab} onClick={() => setActiveDetailTab(tab)}
                        className={"rounded-lg px-3 py-1.5 text-xs font-medium transition capitalize " + (activeDetailTab === tab ? "bg-amber-400 text-slate-950" : "border border-white/10 text-slate-400 hover:text-white")}>
                        {tab === "steps" ? "Steps" : tab === "identity" ? "Customer" : "Documents"}
                      </button>
                    ))}
                  </div>

                  {/* Steps tab */}
                  {activeDetailTab === "steps" && (
                    <>
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <p className="text-xs text-amber-400 mb-1">Current Step</p>
                        <p className="font-semibold text-white">{selectedTxn.current_step}. {STEP_NAMES[selectedTxn.current_step - 1] || "Unknown"}</p>
                        {selectedTxn.current_step < 15 && <p className="text-xs text-slate-500 mt-1">Next: {STEP_NAMES[selectedTxn.current_step]}</p>}
                      </div>

                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Form M / AD Bank Reference</label>
                          <input type="text" value={formM} onChange={e => setFormM(e.target.value)} placeholder="e.g. MF2024XXXXXXXX"
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400/50" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">LC Number</label>
                          <input type="text" value={lcNumber} onChange={e => setLcNumber(e.target.value)} placeholder="e.g. LC/UB/2026/XXXXX"
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400/50" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Step Note (optional)</label>
                          <textarea value={stepNote} onChange={e => setStepNote(e.target.value)} placeholder="Add a note..." rows={2}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50 resize-none" />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {selectedTxn.current_step < 15 && (
                          <button onClick={() => advanceStep(selectedTxn)} disabled={updating}
                            className="flex-1 rounded-xl bg-amber-400 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300 transition disabled:opacity-50">
                            {updating ? "Updating..." : "Advance to Step " + (selectedTxn.current_step + 1) + " — " + STEP_NAMES[selectedTxn.current_step]}
                          </button>
                        )}
                        {selectedTxn.current_step === 15 && (
                          <div className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-400 text-center">
                            ✓ Transaction Complete
                          </div>
                        )}
                        {selectedTxn.current_step > 2 && (
                          <button onClick={() => revertStep(selectedTxn)} disabled={updating}
                            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400 hover:text-white transition disabled:opacity-50">
                            ← Back
                          </button>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 mb-3">All Steps</p>
                        <div className="flex flex-col gap-1">
                          {getTxnSteps(selectedTxn.id).map(step => (
                            <div key={step.id} className={"flex items-start gap-3 rounded-lg px-3 py-2.5 " + (step.status === "complete" ? "bg-emerald-500/10" : step.status === "active" ? "bg-amber-500/10" : "opacity-30")}>
                              <span className={"flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold mt-0.5 " + (step.status === "complete" ? "bg-emerald-500 text-slate-950" : step.status === "active" ? "border border-amber-400 text-amber-400" : "border border-white/10 text-slate-600")}>
                                {step.status === "complete" ? "✓" : String(step.step_number).padStart(2, "0")}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={"text-xs " + (step.status === "complete" ? "text-emerald-300" : step.status === "active" ? "font-medium text-white" : "text-slate-600")}>{step.step_name}</span>
                                  {step.status === "active" && <span className="text-xs text-amber-400 flex-shrink-0">Current</span>}
                                  {step.status === "complete" && step.completed_at && <span className="text-xs text-slate-600 flex-shrink-0">{new Date(step.completed_at).toLocaleDateString("en-GB")}</span>}
                                </div>
                                {step.notes && <p className="text-xs text-slate-500 mt-0.5 italic">{step.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Identity tab */}
                  {activeDetailTab === "identity" && (
                    <div className="flex flex-col gap-4">
                      {isBusiness(selectedTxn.user_id) ? (
                        <>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Business Details</p>
                            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex flex-col gap-3">
                              {[
                                { label: "Company Name", value: getKybProfile(selectedTxn.user_id)?.company_name },
                                { label: "CAC Number", value: getKybProfile(selectedTxn.user_id)?.cac_number },
                                { label: "Registered Address", value: getKybProfile(selectedTxn.user_id)?.registered_address },
                                { label: "Company Email", value: getKybProfile(selectedTxn.user_id)?.company_email },
                              ].filter(r => r.value).map(row => (
                                <div key={row.label}><p className="text-xs text-slate-500">{row.label}</p><p className="text-sm text-white">{row.value}</p></div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Director</p>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                              {[
                                { label: "Name", value: (getKybProfile(selectedTxn.user_id)?.representative_title || "") + " " + (getKybProfile(selectedTxn.user_id)?.representative_name || "") },
                                { label: "Phone", value: getKybProfile(selectedTxn.user_id)?.representative_phone },
                                { label: "Email", value: getKybProfile(selectedTxn.user_id)?.representative_email },
                              ].filter(r => r.value?.trim()).map(row => (
                                <div key={row.label}><p className="text-xs text-slate-500">{row.label}</p><p className="text-sm text-white">{row.value}</p></div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Personal Details</p>
                          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col gap-3">
                            {[
                              { label: "Full Name", value: getCustomerName(selectedTxn.user_id) },
                              { label: "Nationality", value: getKycProfile(selectedTxn.user_id)?.nationality },
                              { label: "Address", value: getKycProfile(selectedTxn.user_id)?.address },
                              { label: "Phone", value: getKycProfile(selectedTxn.user_id)?.phone },
                              { label: "Email", value: getKycProfile(selectedTxn.user_id)?.email },
                            ].filter(r => r.value).map(row => (
                              <div key={row.label}><p className="text-xs text-slate-500">{row.label}</p><p className="text-sm text-white">{row.value}</p></div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Transaction Details</p>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                          {[
                            { label: "Product", value: selectedTxn.product_description },
                            { label: "Quantity", value: selectedTxn.quantity },
                            { label: "Unit Price", value: "$" + Number(selectedTxn.unit_price).toLocaleString() },
                            { label: "Total Value", value: "$" + Number(selectedTxn.total_value).toLocaleString() + " " + selectedTxn.currency },
                            { label: "Port of Destination", value: selectedTxn.port_of_destination },
                            { label: "Created", value: new Date(selectedTxn.created_at).toLocaleDateString("en-GB") },
                          ].map(row => (
                            <div key={row.label}><p className="text-xs text-slate-500">{row.label}</p><p className="text-sm text-white">{row.value}</p></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents tab */}
                  {activeDetailTab === "documents" && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Trade Documents</p>
                      {getTxnDocs(selectedTxn.id).length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                          <p className="text-sm text-slate-500">No trade documents uploaded yet.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {getTxnDocs(selectedTxn.id).map(doc => (
                            <div key={doc.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">{DOC_LABELS[doc.document_type] || doc.document_type.replace(/_/g, " ")}</p>
                                <p className="text-xs text-slate-500">{new Date(doc.uploaded_at).toLocaleDateString("en-GB")}{doc.file_name ? " · " + doc.file_name : ""}</p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (doc.status === "approved" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : doc.status === "rejected" ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-amber-400 border-amber-500/30 bg-amber-500/10")}>{doc.status}</span>
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:text-amber-300 underline">View →</a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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