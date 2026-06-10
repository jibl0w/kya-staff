"use client";

import { useState } from "react";
import Link from "next/link";

interface KycProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  address?: string;
  nationality?: string;
  id_type?: string;
  id_number?: string;
  phone?: string;
  email?: string;
  kyc_status?: string;
  created_at?: string;
  bvn?: string;
  bvn_verification_status?: string;
  bvn_verified_name?: string;
  bvn_verified_dob?: string;
  bvn_verified_at?: string;
  nin?: string;
  nin_verification_status?: string;
  nin_verified_name?: string;
  nin_verified_at?: string;
  govt_id_verification_status?: string;
  govt_id_verified_name?: string;
  govt_id_verified_at?: string;
  aml_status?: string;
  aml_screened_at?: string;
  liveness_status?: string;
  liveness_probability?: number;
  liveness_checked_at?: string;
  face_match_status?: string;
  face_match_confidence?: number;
  face_match_checked_at?: string;
  risk_rating?: string;
  risk_notes?: string;
  risk_updated_at?: string;
}

interface KybProfile {
  user_id: string;
  company_name: string;
  cac_number?: string;
  tin?: string;
  business_type?: string;
  registered_address?: string;
  company_email?: string;
  representative_title?: string;
  representative_name?: string;
  representative_email?: string;
  representative_phone?: string;
  kyb_status?: string;
  created_at?: string;
  cac_verification_status?: string;
  cac_verified_name?: string;
  cac_verified_at?: string;
  aml_status?: string;
  aml_screened_at?: string;
  risk_rating?: string;
  risk_notes?: string;
  risk_updated_at?: string;
}

interface EddRequest {
  id: string;
  user_id: string;
  reason: string;
  status: string;
  documents_required: string[];
  notes?: string;
  created_at: string;
}

interface Doc {
  user_id: string;
  status: string;
  verification_status: string;
  document_type: string;
}

interface Txn {
  user_id: string;
  status: string;
  total_value: number;
  currency: string;
  transaction_ref: string;
}

interface Props {
  kycProfiles: KycProfile[];
  kybProfiles: KybProfile[];
  documents: Doc[];
  transactions: Txn[];
  eddRequests: EddRequest[];
}

const riskColor = (rating?: string) => {
  if (rating === "high") return "bg-red-500/20 text-red-400 border border-red-500/30";
  if (rating === "medium") return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
};

const bvnBadge = (status?: string) => {
  if (status === "verified") return { color: "bg-emerald-500/20 text-emerald-400", label: "✓ BVN Verified" };
  if (status === "mismatch") return { color: "bg-red-500/20 text-red-400", label: "⚠ BVN Mismatch" };
  if (status === "failed") return { color: "bg-red-500/20 text-red-400", label: "✕ BVN Failed" };
  return { color: "bg-slate-500/20 text-slate-400", label: "BVN Unverified" };
};

const ninBadge = (status?: string) => {
  if (status === "verified") return { color: "bg-emerald-500/20 text-emerald-400", label: "✓ NIN Verified" };
  if (status === "mismatch") return { color: "bg-red-500/20 text-red-400", label: "⚠ NIN Mismatch" };
  if (status === "failed") return { color: "bg-red-500/20 text-red-400", label: "✕ NIN Failed" };
  return { color: "bg-slate-500/20 text-slate-400", label: "NIN Unverified" };
};

const govtIdBadge = (status?: string) => {
  if (status === "verified") return { color: "bg-emerald-500/20 text-emerald-400", label: "✓ ID Verified" };
  if (status === "mismatch") return { color: "bg-red-500/20 text-red-400", label: "⚠ ID Mismatch" };
  if (status === "failed") return { color: "bg-red-500/20 text-red-400", label: "✕ ID Failed" };
  return { color: "bg-slate-500/20 text-slate-400", label: "ID Unverified" };
};

const cacBadge = (status?: string) => {
  if (status === "verified") return { color: "bg-emerald-500/20 text-emerald-400", label: "✓ CAC Verified" };
  if (status === "mismatch") return { color: "bg-red-500/20 text-red-400", label: "⚠ CAC Mismatch" };
  if (status === "failed") return { color: "bg-red-500/20 text-red-400", label: "✕ CAC Failed" };
  return { color: "bg-slate-500/20 text-slate-400", label: "CAC Unverified" };
};

const amlBadge = (status?: string) => {
  if (status === "clear") return { color: "bg-emerald-500/20 text-emerald-400", label: "✓ AML Clear" };
  if (status === "flagged") return { color: "bg-red-500/20 text-red-400", label: "⚠ AML Flagged" };
  return { color: "bg-slate-500/20 text-slate-400", label: "Not Screened" };
};

const livenessBadge = (status?: string) => {
  if (status === "passed") return { color: "bg-emerald-500/20 text-emerald-400", label: "✓ Liveness Passed" };
  if (status === "failed") return { color: "bg-red-500/20 text-red-400", label: "✕ Liveness Failed" };
  return { color: "bg-slate-500/20 text-slate-400", label: "Not Checked" };
};

const faceMatchBadge = (status?: string) => {
  if (status === "matched") return { color: "bg-emerald-500/20 text-emerald-400", label: "✓ Face Matched" };
  if (status === "mismatch") return { color: "bg-red-500/20 text-red-400", label: "✕ Face Mismatch" };
  return { color: "bg-slate-500/20 text-slate-400", label: "Not Checked" };
};

const eddStatusColor: Record<string, string> = {
  pending: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  in_progress: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  completed: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  cleared: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  escalated: "text-red-400 border-red-500/30 bg-red-500/10",
};

const statusColor: Record<string, string> = {
  approved: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  pending: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  rejected: "text-red-400 border-red-500/30 bg-red-500/10",
};

const EDD_DOCUMENT_OPTIONS = [
  "Source of Funds Declaration",
  "Source of Wealth Declaration",
  "Enhanced Business Profile",
  "Additional Director Information",
  "Bank Statements — 12 Months",
  "Bank Reference Letter",
  "Commercial Justification Letter",
  "Board Resolution",
  "Audited Financial Statements",
  "Tax Returns",
  "Proof of Business Address",
  "Shareholder Register",
];

export default function CustomersClient({
  kycProfiles = [], kybProfiles = [], documents = [], transactions = [], eddRequests = []
}: Props) {
  const [activeTab, setActiveTab] = useState<"personal" | "business">("personal");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"profile" | "risk" | "edd">("profile");
  const [editingRisk, setEditingRisk] = useState(false);
  const [newRiskRating, setNewRiskRating] = useState("");
  const [newRiskNotes, setNewRiskNotes] = useState("");
  const [savingRisk, setSavingRisk] = useState(false);
  const [localKyc, setLocalKyc] = useState<KycProfile[]>(kycProfiles);
  const [localKyb, setLocalKyb] = useState<KybProfile[]>(kybProfiles);
  const [showEddForm, setShowEddForm] = useState(false);
  const [eddReason, setEddReason] = useState("");
  const [eddNotes, setEddNotes] = useState("");
  const [eddDocs, setEddDocs] = useState<string[]>([]);
  const [submittingEdd, setSubmittingEdd] = useState(false);
  const [localEdd, setLocalEdd] = useState<EddRequest[]>(eddRequests);
  const [updatingEdd, setUpdatingEdd] = useState<string | null>(null);

  function getDocStatus(uid: string) {
    const docs = documents.filter(d => d.user_id === uid);
    const approved = docs.filter(d => (d.status || d.verification_status) === "approved").length;
    const pending = docs.filter(d => (d.status || d.verification_status) === "pending").length;
    const rejected = docs.filter(d => (d.status || d.verification_status) === "rejected").length;
    return { approved, pending, rejected, total: docs.length };
  }

  function getUserTxns(uid: string) { return transactions.filter(t => t.user_id === uid); }
  function getUserEdd(uid: string) { return localEdd.filter(e => e.user_id === uid); }

  const filteredKyc = localKyc.filter(p =>
    search === "" ? true :
    (p.first_name + " " + p.last_name).toLowerCase().includes(search.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredKyb = localKyb.filter(p =>
    search === "" ? true :
    p.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.representative_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.cac_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedKyc = selectedUser ? localKyc.find(p => p.user_id === selectedUser) || null : null;
  const selectedKyb = selectedUser ? localKyb.find(p => p.user_id === selectedUser) || null : null;
  const activeRating = activeTab === "personal" ? selectedKyc?.risk_rating : selectedKyb?.risk_rating;
  const activeNotes = activeTab === "personal" ? selectedKyc?.risk_notes : selectedKyb?.risk_notes;
  const activeEdd = selectedUser ? getUserEdd(selectedUser) : [];
  const hasActiveEdd = activeEdd.some(e => ["pending", "in_progress"].includes(e.status));

  async function handleSaveRisk() {
    if (!selectedUser || !newRiskRating) return;
    setSavingRisk(true);
    try {
      const res = await fetch("/api/update-risk-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: selectedUser, accountType: activeTab, riskRating: newRiskRating, riskNotes: newRiskNotes }),
      });
      if (res.ok) {
        if (activeTab === "personal") {
          setLocalKyc(prev => prev.map(p => p.user_id === selectedUser ? { ...p, risk_rating: newRiskRating, risk_notes: newRiskNotes, risk_updated_at: new Date().toISOString() } : p));
        } else {
          setLocalKyb(prev => prev.map(p => p.user_id === selectedUser ? { ...p, risk_rating: newRiskRating, risk_notes: newRiskNotes, risk_updated_at: new Date().toISOString() } : p));
        }
        setEditingRisk(false);
      }
    } finally { setSavingRisk(false); }
  }

  async function handleSubmitEdd() {
    if (!selectedUser || !eddReason.trim()) return;
    setSubmittingEdd(true);
    try {
      const res = await fetch("/api/edd/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: selectedUser, reason: eddReason, documentsRequired: eddDocs, notes: eddNotes }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalEdd(prev => [...prev, { id: data.eddRequestId, user_id: selectedUser, reason: eddReason, status: "pending", documents_required: eddDocs, notes: eddNotes, created_at: new Date().toISOString() }]);
        setShowEddForm(false);
        setEddReason(""); setEddNotes(""); setEddDocs([]);
        setDetailTab("edd");
      }
    } finally { setSubmittingEdd(false); }
  }

  async function handleUpdateEdd(eddId: string, status: string) {
    setUpdatingEdd(eddId);
    try {
      const res = await fetch("/api/edd/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eddRequestId: eddId, status }),
      });
      if (res.ok) setLocalEdd(prev => prev.map(e => e.id === eddId ? { ...e, status } : e));
    } finally { setUpdatingEdd(null); }
  }

  function toggleEddDoc(doc: string) {
    setEddDocs(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
  }

  function verificationSection(
    label: string,
    badge: { color: string; label: string },
    verifiedAt?: string,
    verifiedName?: string,
    extra?: string
  ) {
    return (
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">{label}</p>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className={"text-xs font-semibold px-3 py-1 rounded-full " + badge.color}>{badge.label}</span>
            {verifiedAt && <span className="text-xs text-slate-500">{new Date(verifiedAt).toLocaleDateString("en-GB")}</span>}
          </div>
          {verifiedName && <p className="text-xs text-slate-400">Verified as: <span className="text-white">{verifiedName}</span></p>}
          {extra && <p className="text-xs text-slate-400 mt-1">{extra}</p>}
        </div>
      </div>
    );
  }

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
          <Link href="/customers" className="text-sm font-medium text-white border-b-2 border-amber-400 pb-0.5">Customers</Link>
          <Link href="/suppliers" className="text-sm text-slate-400 hover:text-white transition">Suppliers</Link>
          <Link href="/audit" className="text-sm text-slate-400 hover:text-white transition">Audit Log</Link>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-400 mb-1">Customer Management</p>
          <h2 className="text-3xl font-black">All Customers</h2>
          <p className="text-slate-400 mt-1 text-sm">View, manage, and conduct compliance reviews on all KYC and KYB customers.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Personal KYC", value: localKyc.length, color: "text-blue-400" },
            { label: "Business KYB", value: localKyb.length, color: "text-purple-400" },
            { label: "High Risk", value: [...localKyc, ...localKyb].filter(p => p.risk_rating === "high").length, color: "text-red-400" },
            { label: "Active EDD", value: localEdd.filter(e => ["pending", "in_progress"].includes(e.status)).length, color: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className={"text-3xl font-black " + s.color}>{s.value}</p>
              <p className="text-sm font-medium text-white mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <div className="flex gap-2">
            {[
              { key: "personal" as const, label: "Personal KYC", count: localKyc.length, color: "bg-blue-500 text-white" },
              { key: "business" as const, label: "Business KYB", count: localKyb.length, color: "bg-purple-500 text-white" },
            ].map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedUser(null); setShowEddForm(false); setEditingRisk(false); }}
                className={"rounded-lg px-5 py-2.5 text-sm font-medium transition " + (activeTab === tab.key ? tab.color : "border border-white/10 text-slate-400 hover:text-white")}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === "personal" ? "Search by name or email..." : "Search by company, director, or CAC..."}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Customer list */}
          <div className="flex flex-col gap-3">
            {activeTab === "personal" && (
              filteredKyc.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center"><p className="text-slate-400">No personal customers found.</p></div>
              ) : filteredKyc.map(p => {
                const docStats = getDocStatus(p.user_id);
                const txns = getUserTxns(p.user_id);
                const isSelected = selectedUser === p.user_id;
                const bvn = bvnBadge(p.bvn_verification_status);
                const eddCount = getUserEdd(p.user_id).filter(e => ["pending", "in_progress"].includes(e.status)).length;
                return (
                  <div key={p.user_id} onClick={() => { setSelectedUser(isSelected ? null : p.user_id); setDetailTab("profile"); setShowEddForm(false); setEditingRisk(false); }}
                    className={"rounded-2xl border p-5 cursor-pointer transition " + (isSelected ? "border-blue-400/40 bg-blue-400/5" : "border-white/10 bg-white/5 hover:border-white/20")}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-white">{p.first_name} {p.last_name}</p>
                        {p.email && <p className="text-xs text-slate-500 mt-0.5">{p.email}</p>}
                        {p.nationality && <p className="text-xs text-slate-500">{p.nationality}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (statusColor[p.kyc_status || "pending"] || statusColor.pending)}>{p.kyc_status || "pending"}</span>
                        <span className={"text-xs font-medium rounded-full px-2 py-0.5 " + riskColor(p.risk_rating)}>{(p.risk_rating || "low").toUpperCase()}</span>
                        {eddCount > 0 && <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30">EDD Active</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap text-xs">
                      <span className={bvn.color + " rounded-full px-2 py-0.5"}>{bvn.label}</span>
                      <span className={ninBadge(p.nin_verification_status).color + " rounded-full px-2 py-0.5"}>{ninBadge(p.nin_verification_status).label}</span>
                      <span className={govtIdBadge(p.govt_id_verification_status).color + " rounded-full px-2 py-0.5"}>{govtIdBadge(p.govt_id_verification_status).label}</span>
                      <span className={amlBadge(p.aml_status).color + " rounded-full px-2 py-0.5"}>{amlBadge(p.aml_status).label}</span>
                      <span className="text-emerald-400">{docStats.approved} approved</span>
                      {docStats.pending > 0 && <span className="text-amber-400">{docStats.pending} pending</span>}
                      {docStats.rejected > 0 && <span className="text-red-400">{docStats.rejected} rejected</span>}
                      <span className="text-slate-500">{txns.length} txn{txns.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })
            )}

            {activeTab === "business" && (
              filteredKyb.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center"><p className="text-slate-400">No business customers found.</p></div>
              ) : filteredKyb.map(p => {
                const docStats = getDocStatus(p.user_id);
                const txns = getUserTxns(p.user_id);
                const isSelected = selectedUser === p.user_id;
                const eddCount = getUserEdd(p.user_id).filter(e => ["pending", "in_progress"].includes(e.status)).length;
                return (
                  <div key={p.user_id} onClick={() => { setSelectedUser(isSelected ? null : p.user_id); setDetailTab("profile"); setShowEddForm(false); setEditingRisk(false); }}
                    className={"rounded-2xl border p-5 cursor-pointer transition " + (isSelected ? "border-purple-400/40 bg-purple-400/5" : "border-white/10 bg-white/5 hover:border-white/20")}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-white">{p.company_name}</p>
                        {p.cac_number && <p className="text-xs text-slate-500 font-mono mt-0.5">CAC: {p.cac_number}</p>}
                        {p.representative_name && <p className="text-xs text-slate-500">Director: {p.representative_title} {p.representative_name}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (statusColor[p.kyb_status || "pending"] || statusColor.pending)}>{p.kyb_status || "pending"}</span>
                        <span className={"text-xs font-medium rounded-full px-2 py-0.5 " + riskColor(p.risk_rating)}>{(p.risk_rating || "low").toUpperCase()}</span>
                        {eddCount > 0 && <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30">EDD Active</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap text-xs">
                      <span className={cacBadge(p.cac_verification_status).color + " rounded-full px-2 py-0.5"}>{cacBadge(p.cac_verification_status).label}</span>
                      <span className={amlBadge(p.aml_status).color + " rounded-full px-2 py-0.5"}>{amlBadge(p.aml_status).label}</span>
                      <span className="text-emerald-400">{docStats.approved} approved</span>
                      {docStats.pending > 0 && <span className="text-amber-400">{docStats.pending} pending</span>}
                      {docStats.rejected > 0 && <span className="text-red-400">{docStats.rejected} rejected</span>}
                      <span className="text-slate-500">{txns.length} txn{txns.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detail panel */}
          <div>
            {!selectedUser ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center sticky top-24">
                <p className="text-slate-400">Select a customer to view their full profile.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden sticky top-24 max-h-[80vh] overflow-y-auto">

                {/* Header */}
                <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                  {activeTab === "personal" && selectedKyc ? (
                    <>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-xs font-medium text-blue-400">Personal KYC</span>
                        <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (statusColor[selectedKyc.kyc_status || "pending"] || statusColor.pending)}>{selectedKyc.kyc_status || "pending"}</span>
                        <span className={"text-xs font-medium rounded-full px-2 py-0.5 " + riskColor(selectedKyc.risk_rating)}>{(selectedKyc.risk_rating || "low").toUpperCase()} RISK</span>
                        {hasActiveEdd && <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30">EDD Active</span>}
                      </div>
                      <p className="text-xl font-bold text-white">{selectedKyc.first_name} {selectedKyc.last_name}</p>
                    </>
                  ) : activeTab === "business" && selectedKyb ? (
                    <>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-xs font-medium text-purple-400">Business KYB</span>
                        <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (statusColor[selectedKyb.kyb_status || "pending"] || statusColor.pending)}>{selectedKyb.kyb_status || "pending"}</span>
                        <span className={"text-xs font-medium rounded-full px-2 py-0.5 " + riskColor(selectedKyb.risk_rating)}>{(selectedKyb.risk_rating || "low").toUpperCase()} RISK</span>
                        {hasActiveEdd && <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30">EDD Active</span>}
                      </div>
                      <p className="text-xl font-bold text-white">{selectedKyb.company_name}</p>
                    </>
                  ) : null}

                  <div className="flex gap-2 mt-4">
                    {(["profile", "risk", "edd"] as const).map(tab => (
                      <button key={tab} onClick={() => setDetailTab(tab)}
                        className={"rounded-lg px-3 py-1.5 text-xs font-medium transition capitalize " + (detailTab === tab ? "bg-amber-400 text-slate-950" : "border border-white/10 text-slate-400 hover:text-white")}>
                        {tab === "edd" ? `EDD${activeEdd.length > 0 ? " (" + activeEdd.length + ")" : ""}` : tab === "risk" ? "Risk Rating" : "Profile"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-6">

                  {/* PROFILE TAB */}
                  {detailTab === "profile" && (
                    <>
                      {/* Personal verification sections */}
                      {activeTab === "personal" && selectedKyc && (<>
                        {verificationSection("BVN Verification", bvnBadge(selectedKyc.bvn_verification_status), selectedKyc.bvn_verified_at || undefined, selectedKyc.bvn_verified_name || undefined, selectedKyc.bvn_verified_dob ? "DOB on record: " + selectedKyc.bvn_verified_dob : undefined)}
                        {verificationSection("NIN Verification", ninBadge(selectedKyc.nin_verification_status), selectedKyc.nin_verified_at || undefined, selectedKyc.nin_verified_name || undefined)}
                        {verificationSection("Government ID", govtIdBadge(selectedKyc.govt_id_verification_status), selectedKyc.govt_id_verified_at || undefined, selectedKyc.govt_id_verified_name || undefined, selectedKyc.id_type || undefined)}
                        {verificationSection("AML / PEP Screening", amlBadge(selectedKyc.aml_status), selectedKyc.aml_screened_at || undefined)}
                        {verificationSection("Liveness Check", livenessBadge(selectedKyc.liveness_status), selectedKyc.liveness_checked_at || undefined, undefined, selectedKyc.liveness_probability ? "Confidence: " + (Number(selectedKyc.liveness_probability) * 100).toFixed(1) + "%" : undefined)}
                        {verificationSection("Face Match", faceMatchBadge(selectedKyc.face_match_status), selectedKyc.face_match_checked_at || undefined, undefined, selectedKyc.face_match_confidence ? "Confidence: " + Number(selectedKyc.face_match_confidence).toFixed(1) + "%" : undefined)}
                      </>)}

                      {/* Business verification sections */}
                      {activeTab === "business" && selectedKyb && (<>
                        {verificationSection("CAC Verification", cacBadge(selectedKyb.cac_verification_status), selectedKyb.cac_verified_at || undefined, selectedKyb.cac_verified_name || undefined)}
                        {verificationSection("AML / PEP Screening", amlBadge(selectedKyb.aml_status), selectedKyb.aml_screened_at || undefined)}
                      </>)}

                      {/* Personal details */}
                      {activeTab === "personal" && selectedKyc && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Personal Details</p>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-4 grid grid-cols-2 gap-3">
                            {[
                              { label: "Full Name", value: selectedKyc.first_name + " " + selectedKyc.last_name },
                              { label: "Nationality", value: selectedKyc.nationality },
                              { label: "Email", value: selectedKyc.email },
                              { label: "Phone", value: selectedKyc.phone },
                              { label: "ID Type", value: selectedKyc.id_type },
                              { label: "ID Number", value: selectedKyc.id_number },
                              { label: "Address", value: selectedKyc.address },
                            ].filter(r => r.value).map(row => (
                              <div key={row.label} className={row.label === "Address" ? "col-span-2" : ""}>
                                <p className="text-xs text-slate-500">{row.label}</p>
                                <p className="text-sm text-white">{row.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Business details */}
                      {activeTab === "business" && selectedKyb && (
                        <>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Company Details</p>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 grid grid-cols-2 gap-3">
                              {[
                                { label: "Company Name", value: selectedKyb.company_name },
                                { label: "CAC Number", value: selectedKyb.cac_number },
                                { label: "TIN", value: selectedKyb.tin },
                                { label: "Business Type", value: selectedKyb.business_type },
                                { label: "Company Email", value: selectedKyb.company_email },
                                { label: "Registered Address", value: selectedKyb.registered_address },
                              ].filter(r => r.value).map(row => (
                                <div key={row.label} className={row.label === "Registered Address" ? "col-span-2" : ""}>
                                  <p className="text-xs text-slate-500">{row.label}</p>
                                  <p className="text-sm text-white">{row.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Director</p>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 grid grid-cols-2 gap-3">
                              {[
                                { label: "Name", value: (selectedKyb.representative_title || "") + " " + (selectedKyb.representative_name || "") },
                                { label: "Email", value: selectedKyb.representative_email },
                                { label: "Phone", value: selectedKyb.representative_phone },
                              ].filter(r => r.value?.trim()).map(row => (
                                <div key={row.label}>
                                  <p className="text-xs text-slate-500">{row.label}</p>
                                  <p className="text-sm text-white">{row.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Document summary */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Document Status</p>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          {(() => {
                            const stats = getDocStatus(selectedUser);
                            return (
                              <div className="grid grid-cols-4 gap-3 text-center">
                                {[
                                  { label: "Total", value: stats.total, color: "text-white" },
                                  { label: "Approved", value: stats.approved, color: "text-emerald-400" },
                                  { label: "Pending", value: stats.pending, color: "text-amber-400" },
                                  { label: "Rejected", value: stats.rejected, color: "text-red-400" },
                                ].map(s => (
                                  <div key={s.label}>
                                    <p className={"text-xl font-black " + s.color}>{s.value}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Transactions */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Transactions</p>
                        {getUserTxns(selectedUser).length === 0 ? (
                          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                            <p className="text-sm text-slate-500">No transactions yet.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {getUserTxns(selectedUser).map(txn => (
                              <div key={txn.transaction_ref} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-mono text-white">{txn.transaction_ref}</p>
                                  <p className="text-xs text-slate-500">${Number(txn.total_value).toLocaleString()} {txn.currency}</p>
                                </div>
                                <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (txn.status === "complete" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : txn.status === "active" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : "text-slate-400 border-slate-500/30 bg-slate-500/10")}>
                                  {txn.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* RISK RATING TAB */}
                  {detailTab === "risk" && (
                    <div className="flex flex-col gap-4">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Current Risk Rating</p>
                          {!editingRisk && (
                            <button onClick={() => { setEditingRisk(true); setNewRiskRating(activeRating || "low"); setNewRiskNotes(activeNotes || ""); }}
                              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-400 hover:text-white transition">
                              Edit
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className={"text-lg font-bold px-4 py-2 rounded-full " + riskColor(activeRating)}>
                            {(activeRating || "low").toUpperCase()} RISK
                          </span>
                        </div>
                        {activeNotes && <p className="text-xs text-slate-400 italic">{activeNotes}</p>}
                        {(activeTab === "personal" ? selectedKyc?.risk_updated_at : selectedKyb?.risk_updated_at) && (
                          <p className="text-xs text-slate-600 mt-2">Last updated: {new Date((activeTab === "personal" ? selectedKyc?.risk_updated_at : selectedKyb?.risk_updated_at) || "").toLocaleDateString("en-GB")}</p>
                        )}
                      </div>

                      {editingRisk && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col gap-3">
                          <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Update Risk Rating</p>
                          <div className="flex gap-2">
                            {(["low", "medium", "high"] as const).map(r => (
                              <button key={r} onClick={() => setNewRiskRating(r)}
                                className={"flex-1 rounded-xl py-2.5 text-sm font-semibold transition capitalize " + (newRiskRating === r ? (r === "high" ? "bg-red-500 text-white" : r === "medium" ? "bg-amber-400 text-slate-950" : "bg-emerald-500 text-white") : "border border-white/10 text-slate-400 hover:text-white")}>
                                {r}
                              </button>
                            ))}
                          </div>
                          <textarea value={newRiskNotes} onChange={e => setNewRiskNotes(e.target.value)}
                            placeholder="Reason for risk rating change (optional)..." rows={3}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50 resize-none" />
                          <div className="flex gap-3">
                            <button onClick={handleSaveRisk} disabled={savingRisk || !newRiskRating}
                              className="flex-1 rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300 transition disabled:opacity-50">
                              {savingRisk ? "Saving..." : "Save Risk Rating"}
                            </button>
                            <button onClick={() => setEditingRisk(false)}
                              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Risk Rating Guide</p>
                        <div className="flex flex-col gap-2 text-xs text-slate-400">
                          <div className="flex items-start gap-2"><span className="text-emerald-400 flex-shrink-0">LOW</span><span>Standard customer. No adverse indicators. Normal monitoring applies.</span></div>
                          <div className="flex items-start gap-2"><span className="text-amber-400 flex-shrink-0">MEDIUM</span><span>Some indicators present. Enhanced monitoring. May require periodic review.</span></div>
                          <div className="flex items-start gap-2"><span className="text-red-400 flex-shrink-0">HIGH</span><span>Significant risk indicators. EDD required. Senior compliance review needed.</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EDD TAB */}
                  {detailTab === "edd" && (
                    <div className="flex flex-col gap-4">
                      {!hasActiveEdd && !showEddForm && (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                          <p className="text-sm text-slate-400 mb-3">No active EDD requests for this customer.</p>
                          <button onClick={() => setShowEddForm(true)} className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300 transition">Flag for EDD →</button>
                        </div>
                      )}

                      {hasActiveEdd && !showEddForm && (
                        <button onClick={() => setShowEddForm(true)} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 transition">
                          + New EDD Request
                        </button>
                      )}

                      {showEddForm && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-amber-400">New EDD Request</p>
                            <button onClick={() => setShowEddForm(false)} className="text-xs text-slate-500 hover:text-white">Cancel</button>
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1.5 block">Reason for EDD <span className="text-amber-400">*</span></label>
                            <textarea value={eddReason} onChange={e => setEddReason(e.target.value)} placeholder="Explain why EDD is required..." rows={3}
                              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50 resize-none" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-2 block">Documents Required</label>
                            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                              {EDD_DOCUMENT_OPTIONS.map(doc => (
                                <div key={doc} onClick={() => toggleEddDoc(doc)}
                                  className={"flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition " + (eddDocs.includes(doc) ? "bg-amber-500/10 border border-amber-500/30" : "bg-white/5 border border-white/10 hover:border-white/20")}>
                                  <div className={"w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 " + (eddDocs.includes(doc) ? "bg-amber-400 border-amber-400" : "border-white/30")}>
                                    {eddDocs.includes(doc) && <span className="text-slate-950 text-xs font-bold">✓</span>}
                                  </div>
                                  <span className="text-xs text-slate-300">{doc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1.5 block">Internal Notes (optional)</label>
                            <textarea value={eddNotes} onChange={e => setEddNotes(e.target.value)} placeholder="Internal compliance notes..." rows={2}
                              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50 resize-none" />
                          </div>
                          <button onClick={handleSubmitEdd} disabled={submittingEdd || !eddReason.trim()}
                            className="w-full rounded-xl bg-amber-400 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300 transition disabled:opacity-50">
                            {submittingEdd ? "Submitting..." : "Submit EDD Request & Notify Customer →"}
                          </button>
                        </div>
                      )}

                      {activeEdd.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <p className="text-xs text-slate-500 uppercase tracking-wider">EDD History</p>
                          {activeEdd.map(edd => (
                            <div key={edd.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <p className="text-sm font-medium text-white">{edd.reason}</p>
                                <span className={"text-xs font-medium border rounded-full px-3 py-1 flex-shrink-0 " + (eddStatusColor[edd.status] || eddStatusColor.pending)}>
                                  {edd.status.replace("_", " ")}
                                </span>
                              </div>
                              {edd.documents_required.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs text-slate-500 mb-1">Documents requested:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {edd.documents_required.map(d => (
                                      <span key={d} className="text-xs bg-white/5 border border-white/10 rounded px-2 py-0.5 text-slate-400">{d}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {edd.notes && <p className="text-xs text-slate-500 italic mb-2">{edd.notes}</p>}
                              <p className="text-xs text-slate-600 mb-3">{new Date(edd.created_at).toLocaleDateString("en-GB")}</p>
                              {["pending", "in_progress"].includes(edd.status) && (
                                <div className="flex gap-2 flex-wrap">
                                  {edd.status === "pending" && (
                                    <button onClick={() => handleUpdateEdd(edd.id, "in_progress")} disabled={updatingEdd === edd.id}
                                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition disabled:opacity-50">
                                      Mark In Progress
                                    </button>
                                  )}
                                  <button onClick={() => handleUpdateEdd(edd.id, "cleared")} disabled={updatingEdd === edd.id}
                                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400 transition disabled:opacity-50">
                                    {updatingEdd === edd.id ? "..." : "Clear EDD ✓"}
                                  </button>
                                  <button onClick={() => handleUpdateEdd(edd.id, "escalated")} disabled={updatingEdd === edd.id}
                                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition disabled:opacity-50">
                                    Escalate
                                  </button>
                                </div>
                              )}
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