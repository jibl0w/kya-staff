"use client";

import { useState } from "react";
import Link from "next/link";
interface Supplier {
  id: string;
  supplier_name: string;
  trade_name?: string | null;
  country: string;
  city?: string | null;
  year_established?: string | null;
  primary_category: string;
  sub_categories: string[];
  products_offered?: string | null;
  minimum_order_value: number;
  lead_time_days: number;
  payment_terms: string;
  currencies_accepted: string[];
  verification_status: string;
  verified_at?: string | null;
  verified_by?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}
const CATEGORIES = [
  "Electronics & Consumer Technology",
  "Solar & Energy Infrastructure",
  "Industrial Equipment & Machinery",
  "Construction & Building Materials",
  "Textiles, Packaging & Manufacturing Inputs",
];

const COUNTRIES = [
  "China", "India", "UAE", "Turkey", "Vietnam",
  "Bangladesh", "Indonesia", "Malaysia", "Thailand", "Other",
];

const statusColor: Record<string, string> = {
  verified: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  pending: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  suspended: "text-red-400 border-red-500/30 bg-red-500/10",
};

const emptyForm = {
  supplier_name: "", trade_name: "", country: "China", city: "",
  year_established: "", primary_category: "", products_offered: "",
  minimum_order_value: "", lead_time_days: "30", payment_terms: "LC",
  contact_person: "", contact_email: "", contact_phone: "",
  website: "", internal_notes: "",
};

export default function SuppliersClient({ suppliers: initialSuppliers }: { suppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const filtered = suppliers.filter(s => {
    const matchSearch = search === "" ||
      s.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.country || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.products_offered || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || s.primary_category === categoryFilter;
    const matchStatus = statusFilter === "all" || s.verification_status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const verifiedCount = suppliers.filter(s => s.verification_status === "verified").length;
  const pendingCount = suppliers.filter(s => s.verification_status === "pending").length;
  const suspendedCount = suppliers.filter(s => s.verification_status === "suspended").length;

  function startEdit(supplier: Supplier) {
    setEditingId(supplier.id);
    setForm({
      supplier_name: supplier.supplier_name,
      trade_name: supplier.trade_name || "",
      country: supplier.country,
      city: supplier.city || "",
      year_established: supplier.year_established || "",
      primary_category: supplier.primary_category,
      products_offered: supplier.products_offered || "",
      minimum_order_value: String(supplier.minimum_order_value),
      lead_time_days: String(supplier.lead_time_days),
      payment_terms: supplier.payment_terms,
      contact_person: supplier.contact_person || "",
      contact_email: supplier.contact_email || "",
      contact_phone: supplier.contact_phone || "",
      website: supplier.website || "",
      internal_notes: supplier.internal_notes || "",
    });
    setShowForm(true);
    setSelectedSupplier(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSave() {
    if (!form.supplier_name || !form.primary_category) {
      setError("Supplier name and category are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        supplier_name: form.supplier_name,
        trade_name: form.trade_name || null,
        country: form.country,
        city: form.city || null,
        year_established: form.year_established || null,
        primary_category: form.primary_category,
        products_offered: form.products_offered || null,
        minimum_order_value: parseFloat(form.minimum_order_value) || 0,
        lead_time_days: parseInt(form.lead_time_days) || 30,
        payment_terms: form.payment_terms,
        contact_person: form.contact_person || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        website: form.website || null,
        internal_notes: form.internal_notes || null,
      };

      if (editingId) {
        const res = await fetch("/api/suppliers/" + editingId, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setSuppliers(prev => prev.map(s => s.id === editingId ? { ...s, ...body } : s));
          cancelForm();
        }
      } else {
        const res = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json();
          setSuppliers(prev => [data.supplier, ...prev]);
          cancelForm();
        }
      }
    } finally { setSaving(false); }
  }

  async function handleVerify(supplierId: string, status: string) {
    setUpdating(supplierId);
    try {
      const res = await fetch("/api/suppliers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, status }),
      });
      if (res.ok) {
        setSuppliers(prev => prev.map(s => s.id === supplierId
          ? { ...s, verification_status: status, verified_at: status === "verified" ? new Date().toISOString() : s.verified_at }
          : s
        ));
        if (selectedSupplier?.id === supplierId) {
          setSelectedSupplier(prev => prev ? { ...prev, verification_status: status } : null);
        }
      }
    } finally { setUpdating(null); }
  }

  async function handleDelete(supplierId: string) {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    setUpdating(supplierId);
    try {
      const res = await fetch("/api/suppliers/" + supplierId, { method: "DELETE" });
      if (res.ok) {
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
        if (selectedSupplier?.id === supplierId) setSelectedSupplier(null);
      }
    } finally { setUpdating(null); }
  }

  const inp = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50";
  const sel = "w-full rounded-xl bg-slate-900 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50";
  const lbl = "text-xs font-medium text-slate-400 mb-1.5 block";

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
          <Link href="/suppliers" className="text-sm font-medium text-white border-b-2 border-amber-400 pb-0.5">Suppliers</Link>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-amber-400 mb-1">Supplier Management</p>
            <h2 className="text-3xl font-black">Verified Suppliers</h2>
            <p className="text-slate-400 mt-1 text-sm">Manage the KYA verified supplier network.</p>
          </div>
          {!showForm && (
            <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300 transition">
              + Add Supplier
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: suppliers.length, color: "text-white" },
            { label: "Verified", value: verifiedCount, color: "text-emerald-400" },
            { label: "Pending", value: pendingCount, color: "text-amber-400" },
            { label: "Suspended", value: suspendedCount, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className={"text-3xl font-black " + s.color}>{s.value}</p>
              <p className="text-sm font-medium text-white mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">{editingId ? "Edit Supplier" : "Add New Supplier"}</h3>
              <button onClick={cancelForm} className="text-xs text-slate-500 hover:text-white">Cancel</button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Identity */}
              <div className="col-span-2">
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-4">Identity</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Supplier Name <span className="text-amber-400">*</span></label>
                    <input value={form.supplier_name} onChange={e => update("supplier_name", e.target.value)} className={inp} placeholder="e.g. Shenzhen TechCo Ltd" />
                  </div>
                  <div>
                    <label className={lbl}>Trade Name / Brand</label>
                    <input value={form.trade_name} onChange={e => update("trade_name", e.target.value)} className={inp} placeholder="e.g. TechCo" />
                  </div>
                  <div>
                    <label className={lbl}>Country <span className="text-amber-400">*</span></label>
                    <select value={form.country} onChange={e => update("country", e.target.value)} className={sel}>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>City / Province</label>
                    <input value={form.city} onChange={e => update("city", e.target.value)} className={inp} placeholder="e.g. Shenzhen, Guangdong" />
                  </div>
                  <div>
                    <label className={lbl}>Year Established</label>
                    <input value={form.year_established} onChange={e => update("year_established", e.target.value)} className={inp} placeholder="e.g. 2005" />
                  </div>
                  <div>
                    <label className={lbl}>Primary Category <span className="text-amber-400">*</span></label>
                    <select value={form.primary_category} onChange={e => update("primary_category", e.target.value)} className={sel}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Products Offered</label>
                    <textarea value={form.products_offered} onChange={e => update("products_offered", e.target.value)} className={inp + " resize-none"} rows={2} placeholder="Describe the main products this supplier offers..." />
                  </div>
                </div>
              </div>

              {/* Commercial */}
              <div className="col-span-2">
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-4">Commercial Terms</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={lbl}>Minimum Order (USD)</label>
                    <input type="number" value={form.minimum_order_value} onChange={e => update("minimum_order_value", e.target.value)} className={inp} placeholder="e.g. 10000" />
                  </div>
                  <div>
                    <label className={lbl}>Lead Time (Days)</label>
                    <input type="number" value={form.lead_time_days} onChange={e => update("lead_time_days", e.target.value)} className={inp} placeholder="e.g. 30" />
                  </div>
                  <div>
                    <label className={lbl}>Payment Terms</label>
                    <select value={form.payment_terms} onChange={e => update("payment_terms", e.target.value)} className={sel}>
                      <option value="LC">Letter of Credit (LC)</option>
                      <option value="TT">Telegraphic Transfer (TT)</option>
                      <option value="LC/TT">LC or TT</option>
                      <option value="CAD">Cash Against Documents</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="col-span-2">
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-4">Contact Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Contact Person</label>
                    <input value={form.contact_person} onChange={e => update("contact_person", e.target.value)} className={inp} placeholder="e.g. Wang Wei" />
                  </div>
                  <div>
                    <label className={lbl}>Contact Email</label>
                    <input type="email" value={form.contact_email} onChange={e => update("contact_email", e.target.value)} className={inp} placeholder="e.g. sales@supplier.com" />
                  </div>
                  <div>
                    <label className={lbl}>Contact Phone / WeChat</label>
                    <input value={form.contact_phone} onChange={e => update("contact_phone", e.target.value)} className={inp} placeholder="e.g. +86 138 0000 0000" />
                  </div>
                  <div>
                    <label className={lbl}>Website</label>
                    <input value={form.website} onChange={e => update("website", e.target.value)} className={inp} placeholder="e.g. https://supplier.com" />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Internal Notes (not visible to customers)</label>
                    <textarea value={form.internal_notes} onChange={e => update("internal_notes", e.target.value)} className={inp + " resize-none"} rows={2} placeholder="Internal compliance notes..." />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300 transition disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Supplier"}
              </button>
              <button onClick={cancelForm} className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-slate-400 hover:text-white transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none">
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none">
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Supplier list */}
          <div className="flex flex-col gap-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="text-slate-400 mb-3">No suppliers found.</p>
                <button onClick={() => { setShowForm(true); setForm(emptyForm); }}
                  className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 transition">
                  Add First Supplier
                </button>
              </div>
            ) : filtered.map(s => (
              <div key={s.id}
                onClick={() => setSelectedSupplier(selectedSupplier?.id === s.id ? null : s)}
                className={"rounded-2xl border p-5 cursor-pointer transition " + (selectedSupplier?.id === s.id ? "border-amber-400/40 bg-amber-400/5" : "border-white/10 bg-white/5 hover:border-white/20")}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-white">{s.supplier_name}</p>
                    {s.trade_name && <p className="text-xs text-slate-500 mt-0.5">{s.trade_name}</p>}
                    <p className="text-xs text-slate-500 mt-0.5">{s.country}{s.city ? ", " + s.city : ""}</p>
                  </div>
                  <span className={"text-xs font-medium border rounded-full px-3 py-1 flex-shrink-0 " + (statusColor[s.verification_status] || statusColor.pending)}>
                    {s.verification_status}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5">{s.primary_category.split(" ")[0]}</span>
                  <span>MOQ: ${Number(s.minimum_order_value).toLocaleString()}</span>
                  <span>Lead: {s.lead_time_days}d</span>
                  <span>{s.payment_terms}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div>
            {!selectedSupplier ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center sticky top-24">
                <p className="text-slate-400">Select a supplier to view details.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden sticky top-24 max-h-[80vh] overflow-y-auto">
                <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="text-xl font-bold text-white">{selectedSupplier.supplier_name}</p>
                      {selectedSupplier.trade_name && <p className="text-xs text-slate-500">{selectedSupplier.trade_name}</p>}
                      <p className="text-xs text-slate-500 mt-1">{selectedSupplier.country}{selectedSupplier.city ? ", " + selectedSupplier.city : ""}{selectedSupplier.year_established ? " · Est. " + selectedSupplier.year_established : ""}</p>
                    </div>
                    <span className={"text-xs font-medium border rounded-full px-3 py-1 flex-shrink-0 " + (statusColor[selectedSupplier.verification_status] || statusColor.pending)}>
                      {selectedSupplier.verification_status}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap mt-3">
                    {selectedSupplier.verification_status !== "verified" && (
                      <button onClick={() => handleVerify(selectedSupplier.id, "verified")} disabled={updating === selectedSupplier.id}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 transition disabled:opacity-50">
                        {updating === selectedSupplier.id ? "..." : "✓ Verify"}
                      </button>
                    )}
                    {selectedSupplier.verification_status !== "suspended" && (
                      <button onClick={() => handleVerify(selectedSupplier.id, "suspended")} disabled={updating === selectedSupplier.id}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition disabled:opacity-50">
                        Suspend
                      </button>
                    )}
                    {selectedSupplier.verification_status === "suspended" && (
                      <button onClick={() => handleVerify(selectedSupplier.id, "pending")} disabled={updating === selectedSupplier.id}
                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50">
                        Reinstate
                      </button>
                    )}
                    <button onClick={() => startEdit(selectedSupplier)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(selectedSupplier.id)} disabled={updating === selectedSupplier.id}
                      className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-500 hover:text-red-400 transition disabled:opacity-50">
                      Delete
                    </button>
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-5">

                  {/* Category & Products */}
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Trade Details</p>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                      <div><p className="text-xs text-slate-500">Category</p><p className="text-sm text-white">{selectedSupplier.primary_category}</p></div>
                      {selectedSupplier.products_offered && <div><p className="text-xs text-slate-500">Products</p><p className="text-sm text-white">{selectedSupplier.products_offered}</p></div>}
                    </div>
                  </div>

                  {/* Commercial */}
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Commercial Terms</p>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 grid grid-cols-3 gap-3">
                      <div><p className="text-xs text-slate-500">Min Order</p><p className="text-sm text-white">${Number(selectedSupplier.minimum_order_value).toLocaleString()}</p></div>
                      <div><p className="text-xs text-slate-500">Lead Time</p><p className="text-sm text-white">{selectedSupplier.lead_time_days} days</p></div>
                      <div><p className="text-xs text-slate-500">Payment</p><p className="text-sm text-white">{selectedSupplier.payment_terms}</p></div>
                    </div>
                  </div>

                  {/* Contact */}
                  {(selectedSupplier.contact_person || selectedSupplier.contact_email || selectedSupplier.contact_phone || selectedSupplier.website) && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Contact</p>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
                        {selectedSupplier.contact_person && <div><p className="text-xs text-slate-500">Contact Person</p><p className="text-sm text-white">{selectedSupplier.contact_person}</p></div>}
                        {selectedSupplier.contact_email && <div><p className="text-xs text-slate-500">Email</p><p className="text-sm text-white">{selectedSupplier.contact_email}</p></div>}
                        {selectedSupplier.contact_phone && <div><p className="text-xs text-slate-500">Phone / WeChat</p><p className="text-sm text-white">{selectedSupplier.contact_phone}</p></div>}
                        {selectedSupplier.website && <div><p className="text-xs text-slate-500">Website</p><a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-400 hover:text-amber-300 underline">{selectedSupplier.website}</a></div>}
                      </div>
                    </div>
                  )}

                  {/* Internal notes */}
                  {selectedSupplier.internal_notes && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Internal Notes</p>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-slate-400 italic">{selectedSupplier.internal_notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Verification */}
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Verification</p>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
                      <div><p className="text-xs text-slate-500">Status</p>
                        <span className={"text-xs font-medium border rounded-full px-3 py-1 " + (statusColor[selectedSupplier.verification_status] || statusColor.pending)}>
                          {selectedSupplier.verification_status}
                        </span>
                      </div>
                      {selectedSupplier.verified_at && <div><p className="text-xs text-slate-500">Verified</p><p className="text-sm text-white">{new Date(selectedSupplier.verified_at).toLocaleDateString("en-GB")}</p></div>}
                      <div><p className="text-xs text-slate-500">Added</p><p className="text-sm text-white">{new Date(selectedSupplier.created_at).toLocaleDateString("en-GB")}</p></div>
                    </div>
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