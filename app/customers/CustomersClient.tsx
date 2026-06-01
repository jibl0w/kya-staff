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
}

export default function CustomersClient({ kycProfiles = [], kybProfiles = [], documents = [], transactions = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"personal" | "business">("personal");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  function getDocStatus(uid: string) {
    const docs = documents.filter(d => d.user_id === uid);
    const approved = docs.filter(d => (d.status || d.verification_status) === "approved").length;
    const pending = docs.filter(d => (d.status || d.verification_status) === "pending").length;
    const rejected = docs.filter(d => (d.status || d.verification_status) === "rejected").length;
    return { approved, pending, rejected, total: docs.length };
  }

  function getUserTxns(uid: string) {
    return transactions.filter(t => t.user_id === uid);
  }

  const filteredKyc = kycProfiles.filter(p =>
    search === "" ? true :
    (p.first_name + " " + p.last_name).toLowerCase().includes(search.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredKyb = kybProfiles.filter(p =>
    search === "" ? true :
    p.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.representative_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.cac_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedKyc = selectedUser ? kycProfiles.find(p => p.user_id === selectedUser) || null : null;
  const selectedKyb = selectedUser ? kybProfiles.find(p => p.user_id === selectedUser) || null : null;

  const statusColor: Record<string, string> = {
    approved: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    pending: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    rejected: "text-red-400 border-red-500/30 bg-red-500/10",
  };

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
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-400 mb-1">Customer Management</p>
          <h2 className="text-3xl font-black">All Customers</h2>
          <p className="text-slate-400 mt-1 text-sm">View and manage all KYC and KYB verified customers.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Personal KYC", value: kycProfiles.length, color: "text-blue-400" },
            { label: "Business KYB", value: kybProfiles.length, color: "text-purple-400" },
            { label: "Total Customers", value: kycProfiles.length + kybProfiles.length, color: "text-white" },
            { label: "Total Transactions", value: transactions.length, color: "text-amber-400" },
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
              { key: "personal" as const, label: "Personal KYC", count: kycProfiles.length, color: "bg-blue-500 text-white" },
              { key: "business" as const, label: "Business KYB", count: kybProfiles.length, color: "bg-purple-500 text-white" },
            ].map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedUser(null); }}
                className={"rounded-lg px-5 py-2.5 text-sm font-medium transition " + (activeTab === tab.key ? tab.color : "border border-white/10 text-slate-400 hover:text-white")}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === "personal" ? "Search by name or email..." : "Search by company, director, or CAC..."}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50"
          />
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
                return (
                  <div key={p.user_id} onClick={() => setSelectedUser(isSelected ? null : p.user_id)}
                    className={"rounded-2xl border p-5 cursor-pointer transition " + (isSelected ? "border-blue-400/40 bg-blue-400/5" : "border-white/10 bg-white/5 hover:border-white/20")}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-white">{p.first_name} {p.last_name}</p>
                        {p.email && <p className="text-xs text-slate-500 mt-0.5">{p.email}</p>}
                        {p.nationality && <p className="text-xs text-slate-500">{p.nationality}</p>}
                      </div>
                      <span className={"text-xs font-medium border rounded-full px-3 py-1 flex-shrink-0 " + (statusColor[p.kyc_status || "pending"] || statusColor.pending)}>
                        {p.kyc_status || "pending"}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-emerald-400">{docStats.approved} docs approved</span>
                      {docStats.pending > 0 && <span className="text-amber-400">{docStats.pending} pending</span>}
                      {docStats.rejected > 0 && <span className="text-red-400">{docStats.rejected} rejected</span>}
                      <span className="text-slate-500">{txns.length} transaction{txns.length !== 1 ? "s" : ""}</span>
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
                return (
                  <div key={p.user_id} onClick={() => setSelectedUser(isSelected ? null : p.user_id)}
                    className={"rounded-2xl border p-5 cursor-pointer transition " + (isSelected ? "border-purple-400/40 bg-purple-400/5" : "border-white/10 bg-white/5 hover:border-white/20")}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-white">{p.company_name}</p>
                        {p.cac_number && <p className="text-xs text-slate-500 font-mono mt-0.5">CAC: {p.cac_number}</p>}
                        {p.representative_name && <p className="text-xs text-slate-500">Director: {p.representative_title} {p.representative_name}</p>}
                      </div>
                      <span className={"text-xs font-medium border rounded-full px-3 py-1 flex-shrink-0 " + (statusColor[p.kyb_status || "pending"] || statusColor.pending)}>
                        {p.kyb_status || "pending"}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-emerald-400">{docStats.approved} docs approved</span>
                      {docStats.pending > 0 && <span className="text-amber-400">{docStats.pending} pending</span>}
                      {docStats.rejected > 0 && <span className="text-red-400">{docStats.rejected} rejected</span>}
                      <span className="text-slate-500">{txns.length} transaction{txns.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Customer detail panel */}
          <div>
            {!selectedUser ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center sticky top-24">
                <p className="text-slate-400">Select a customer to view their full profile.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden sticky top-24 max-h-[80vh] overflow-y-auto">
                <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                  {activeTab === "personal" && selectedKyc ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-xs font-medium text-blue-400">Personal KYC</span>
                        <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (statusColor[selectedKyc.kyc_status || "pending"] || statusColor.pending)}>{selectedKyc.kyc_status || "pending"}</span>
                      </div>
                      <p className="text-xl font-bold text-white">{selectedKyc.first_name} {selectedKyc.last_name}</p>
                    </>
                  ) : activeTab === "business" && selectedKyb ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-xs font-medium text-purple-400">Business KYB</span>
                        <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (statusColor[selectedKyb.kyb_status || "pending"] || statusColor.pending)}>{selectedKyb.kyb_status || "pending"}</span>
                      </div>
                      <p className="text-xl font-bold text-white">{selectedKyb.company_name}</p>
                    </>
                  ) : null}
                </div>

                <div className="p-6 flex flex-col gap-6">

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
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Director / Representative</p>
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

                  {/* Transaction summary */}
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

                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}