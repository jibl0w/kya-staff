"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  "Electronics & Consumer Technology",
  "Solar & Energy Infrastructure",
  "Industrial Equipment & Machinery",
  "Construction & Building Materials",
  "Textiles, Packaging & Manufacturing Inputs",
  "Electric Vehicles & Accessories",
  "Agriculture & Farming Equipment",
];

interface Product {
  id: string;
  supplier_id: string;
  account_id: string | null;
  product_name: string;
  category: string;
  keywords: string | null;
  model_number: string | null;
  description: string | null;
  specifications: string | null;
  assembly_options: string | null;
  pricing: string | null;
  moq: string | null;
  lead_time: string | null;
  certifications: string | null;
  country_of_origin: string | null;
  warranty: string | null;
  media_link: string | null;
  status: string;
  suppliers?: { supplier_name: string } | null;
}

interface Supplier { id: string; supplier_name: string; verification_status: string; }
interface Account { id: string; supplier_id: string; label: string; currency: string; }

const EMPTY = {
  supplier_id: "", account_id: "", product_name: "", category: "", keywords: "",
  model_number: "", description: "", specifications: "", assembly_options: "",
  pricing: "", moq: "", lead_time: "", certifications: "", country_of_origin: "China",
  warranty: "", media_link: "", status: "active",
};

export default function ProductsClient({
  products, suppliers, accounts,
}: { products: Product[]; suppliers: Supplier[]; accounts: Account[] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Accounts belonging to the currently-selected supplier (for the account dropdown).
  const supplierAccounts = accounts.filter((a) => a.supplier_id === form.supplier_id);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return !q ||
      p.product_name.toLowerCase().includes(q) ||
      (p.model_number || "").toLowerCase().includes(q) ||
      (p.suppliers?.supplier_name || "").toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
  });

  async function handleSubmit() {
    setError("");
    if (!form.supplier_id || !form.product_name || !form.category) {
      setError("Supplier, product name and category are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        setError(data.error || "Failed to save product.");
        setSaving(false);
      }
    } catch {
      setError("Failed to save product.");
      setSaving(false);
    }
  }

  const lbl = "block text-xs font-medium text-slate-400 mb-1";
  const inp = "w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition">&larr; Dashboard</Link>
          <span className="text-white/20">/</span>
          <span className="text-sm text-slate-400">Products</span>
        </div>
        <span className="text-xl font-black">KY<span className="text-amber-400">A</span> <span className="text-xs font-normal text-slate-500">Staff</span></span>
      </header>

      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">Product Management</h1>
            <p className="text-sm text-slate-400 mt-1">{products.length} product{products.length !== 1 ? "s" : ""} in the catalogue</p>
          </div>
          <button onClick={() => { setForm({ ...EMPTY }); setShowForm(!showForm); setError(""); }}
            className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 transition">
            {showForm ? "Cancel" : "+ Add Product"}
          </button>
        </div>

        {showForm && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-5">Add New Product</h2>
            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Supplier *</label>
                <select value={form.supplier_id} onChange={(e) => { set("supplier_id", e.target.value); set("account_id", ""); }} className={inp}>
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.supplier_name}{s.verification_status !== "verified" ? " (unverified)" : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Category *</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inp}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Product Name *</label>
                <input value={form.product_name} onChange={(e) => set("product_name", e.target.value)} className={inp} placeholder="e.g. Flail Mower" />
              </div>
              <div>
                <label className={lbl}>Model / SKU</label>
                <input value={form.model_number} onChange={(e) => set("model_number", e.target.value)} className={inp} placeholder="e.g. HSC-4.0-500-DCB" />
              </div>
              <div>
                <label className={lbl}>Bank Account (settlement)</label>
                <select value={form.account_id} onChange={(e) => set("account_id", e.target.value)} className={inp} disabled={!form.supplier_id}>
                  <option value="">{form.supplier_id ? "Select account (optional)" : "Select a supplier first"}</option>
                  {supplierAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.label} ({a.currency})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inp}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Keywords (comma-separated)</label>
                <input value={form.keywords} onChange={(e) => set("keywords", e.target.value)} className={inp} placeholder="mower, brush cutting, grass" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Description</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={inp} rows={2} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Specifications</label>
                <textarea value={form.specifications} onChange={(e) => set("specifications", e.target.value)} className={inp} rows={2} placeholder="Rated Power: 4.0kW; Manual start; ..." />
              </div>
              <div>
                <label className={lbl}>Assembly Options</label>
                <input value={form.assembly_options} onChange={(e) => set("assembly_options", e.target.value)} className={inp} placeholder="Fully Assembled, CKD, SKD" />
              </div>
              <div>
                <label className={lbl}>Pricing (tiered)</label>
                <input value={form.pricing} onChange={(e) => set("pricing", e.target.value)} className={inp} placeholder="$358 @110u / $350 @550u" />
              </div>
              <div>
                <label className={lbl}>MOQ</label>
                <input value={form.moq} onChange={(e) => set("moq", e.target.value)} className={inp} placeholder="110 units" />
              </div>
              <div>
                <label className={lbl}>Lead Time</label>
                <input value={form.lead_time} onChange={(e) => set("lead_time", e.target.value)} className={inp} placeholder="25-35 days" />
              </div>
              <div>
                <label className={lbl}>Certifications</label>
                <input value={form.certifications} onChange={(e) => set("certifications", e.target.value)} className={inp} placeholder="CE, RoHS" />
              </div>
              <div>
                <label className={lbl}>Country of Origin</label>
                <input value={form.country_of_origin} onChange={(e) => set("country_of_origin", e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Warranty</label>
                <input value={form.warranty} onChange={(e) => set("warranty", e.target.value)} className={inp} placeholder="1 year after sale" />
              </div>
              <div>
                <label className={lbl}>Media Link (cloud)</label>
                <input value={form.media_link} onChange={(e) => set("media_link", e.target.value)} className={inp} placeholder="https://drive.google.com/..." />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={saving}
              className="mt-5 rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 transition disabled:opacity-50">
              {saving ? "Saving…" : "Save Product"}
            </button>
          </div>
        )}

        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 mb-4 focus:outline-none focus:border-amber-400/50" />

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-slate-400 text-xs">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Supplier</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Model</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No products found.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white font-medium">{p.product_name}</td>
                  <td className="px-4 py-3 text-slate-400">{p.suppliers?.supplier_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{p.category}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{p.model_number || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={"text-xs px-2 py-0.5 rounded-full " + (p.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400")}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}