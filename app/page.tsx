import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { SignOutButton } from "@clerk/nextjs";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export default async function StaffDashboard() {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/sign-in");

  const user = await currentUser();

  const [
    { data: transactions },
    { data: documents },
    { data: txnDocs },
    { data: kycProfiles },
    { data: kybProfiles },
    { data: steps },
    { data: flaggedTxns },
    { data: eddRequests },
  ] = await Promise.all([
    supabaseServer.from("transactions").select("id, transaction_ref, status, current_step, total_value, currency, created_at, supplier_name, user_id, risk_flag, monitoring_status"),
    supabaseServer.from("documents").select("id, status, verification_status, document_type, user_id, uploaded_at"),
    supabaseServer.from("transaction_documents").select("id, status, document_type, uploaded_at"),
    supabaseServer.from("kyc_profiles").select("user_id, first_name, last_name, kyc_status"),
    supabaseServer.from("kyb_profiles").select("user_id, company_name, kyb_status"),
    supabaseServer.from("transaction_steps").select("id, status, transaction_id"),
    supabaseServer.from("transactions").select("id, transaction_ref, supplier_name, total_value, currency, user_id, risk_flag_reason, created_at").eq("risk_flag", true).order("created_at", { ascending: false }),
    supabaseServer.from("edd_requests").select("id, status").in("status", ["pending", "in_progress"]),
  ]);

  const txns = transactions || [];
  const docs = documents || [];
  const tradeDocs = txnDocs || [];
  const kyc = kycProfiles || [];
  const kyb = kybProfiles || [];
  const flagged = flaggedTxns || [];
  const activeEdd = eddRequests || [];

  const activeTxns = txns.filter(t => t.status === "active" || t.status === "draft");
  const completeTxns = txns.filter(t => t.status === "complete");
  const totalVal = txns.reduce((sum, t) => sum + (Number(t.total_value) || 0), 0);

  const pendingKycDocs = docs.filter(d => (d.status || d.verification_status) === "pending").length;
  const pendingTradeDocs = tradeDocs.filter(d => d.status === "pending").length;
  const totalPending = pendingKycDocs + pendingTradeDocs;

  const verifiedKyc = kyc.filter(p => p.kyc_status === "approved").length;
  const verifiedKyb = kyb.filter(p => p.kyb_status === "approved").length;

  const recentTxns = [...txns]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  function getCustomerName(uid: string) {
    const k = kyc.find(p => p.user_id === uid);
    if (k) return (k.first_name + " " + k.last_name).trim();
    const b = kyb.find(p => p.user_id === uid);
    if (b) return b.company_name;
    return "Unknown";
  }

  const STEP_NAMES = [
    "Customer Onboarding", "Supplier Selection", "Trade Setup", "Form M Submission",
    "Funding Instruction", "LC Issuance", "Pre-Shipment Inspection", "Shipment",
    "Document Validation", "FX Processing", "USD Credit", "Payment Instruction",
    "Payment Execution", "LC Liquidation", "Transaction Completion",
  ];

  const statusColors: Record<string, string> = {
    draft: "text-slate-400 border-slate-500/30 bg-slate-500/10",
    active: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    complete: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  };

  const adminName = user ? ((user.firstName || "") + " " + (user.lastName || "")).trim() || user.emailAddresses?.[0]?.emailAddress : "Staff";

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-white/10 px-8 py-5 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black">KY<span className="text-amber-400">A</span></h1>
          <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-0.5 text-xs font-medium text-amber-400">Staff Portal</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-white border-b-2 border-amber-400 pb-0.5">Dashboard</Link>
          <Link href="/documents" className="text-sm text-slate-400 hover:text-white transition relative">
            Documents
            {totalPending > 0 && (
              <span className="absolute -top-2 -right-3 rounded-full bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center font-bold">
                {totalPending > 9 ? "9+" : totalPending}
              </span>
            )}
          </Link>
          <Link href="/transactions" className="text-sm text-slate-400 hover:text-white transition">Transactions</Link>
          <Link href="/customers" className="text-sm text-slate-400 hover:text-white transition">Customers</Link>
        </nav>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-white">{adminName}</p>
            <p className="text-xs text-slate-500">Staff</p>
          </div>
          <SignOutButton redirectUrl="/sign-in">
            <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-white/20 transition">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-10">

        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-400 mb-1">Operations Overview</p>
          <h2 className="text-3xl font-black">Staff Dashboard</h2>
          <p className="text-slate-400 mt-1 text-sm">{new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        {/* Transaction monitoring alert */}
        {flagged.length > 0 && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-400">⚠ {flagged.length} transaction{flagged.length > 1 ? "s" : ""} flagged by monitoring</p>
                <p className="text-xs text-slate-400 mt-0.5">High value or suspicious transactions require compliance review</p>
              </div>
            </div>
            <Link href="/transactions" className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 transition flex-shrink-0 ml-4">
              Review Now →
            </Link>
          </div>
        )}

        {/* EDD alert */}
        {activeEdd.length > 0 && (
          <div className="mb-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
              <div>
                <p className="font-semibold text-purple-400">{activeEdd.length} active EDD request{activeEdd.length > 1 ? "s" : ""}</p>
                <p className="text-xs text-slate-400 mt-0.5">Enhanced Due Diligence in progress</p>
              </div>
            </div>
            <Link href="/customers" className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-400 transition flex-shrink-0 ml-4">
              View Customers →
            </Link>
          </div>
        )}

        {/* Documents pending alert */}
        {totalPending > 0 && (
          <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-400">{totalPending} document{totalPending > 1 ? "s" : ""} pending review</p>
                <p className="text-xs text-slate-400 mt-0.5">{pendingKycDocs} KYC/KYB · {pendingTradeDocs} Trade</p>
              </div>
            </div>
            <Link href="/documents" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 transition flex-shrink-0 ml-4">
              Review Now →
            </Link>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Transactions", value: activeTxns.length, color: "text-amber-400", sub: "In progress" },
            { label: "Completed", value: completeTxns.length, color: "text-emerald-400", sub: "All time" },
            { label: "Flagged", value: flagged.length, color: flagged.length > 0 ? "text-red-400" : "text-white", sub: "Monitoring alerts" },
            { label: "Pending Review", value: totalPending, color: totalPending > 0 ? "text-amber-400" : "text-white", sub: "Documents awaiting action" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className={"text-3xl font-black " + s.color}>{s.value}</p>
              <p className="text-sm font-medium text-white mt-2">{s.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">

          {/* Customer stats */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold mb-4 flex items-center justify-between">
              Customers
              <Link href="/customers" className="text-xs text-amber-400 hover:text-amber-300">View all →</Link>
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "Personal KYC", total: kyc.length, verified: verifiedKyc, color: "bg-blue-500" },
                { label: "Business KYB", total: kyb.length, verified: verifiedKyb, color: "bg-purple-500" },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.verified}/{item.total} verified</p>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5">
                    <div className={"h-1.5 rounded-full " + item.color} style={{ width: item.total > 0 ? (item.verified / item.total * 100) + "%" : "0%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document stats */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold mb-4 flex items-center justify-between">
              Documents
              <Link href="/documents" className="text-xs text-amber-400 hover:text-amber-300">Review →</Link>
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "KYC / KYB Documents", pending: pendingKycDocs, approved: docs.filter(d => (d.status || d.verification_status) === "approved").length, total: docs.length },
                { label: "Trade Documents", pending: pendingTradeDocs, approved: tradeDocs.filter(d => d.status === "approved").length, total: tradeDocs.length },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium mb-2">{item.label}</p>
                  <div className="flex gap-3 text-xs">
                    <span className="text-amber-400">{item.pending} pending</span>
                    <span className="text-emerald-400">{item.approved} approved</span>
                    <span className="text-slate-500">{item.total} total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "Review Pending Documents", href: "/documents", color: "bg-amber-400 text-slate-950 hover:bg-amber-300", badge: totalPending > 0 ? totalPending : null },
                { label: "Manage Transactions", href: "/transactions", color: "border border-white/10 text-white hover:bg-white/5" },
                { label: "View Customers", href: "/customers", color: "border border-white/10 text-white hover:bg-white/5" },
              ].map(action => (
                <Link key={action.label} href={action.href}
                  className={"rounded-xl px-4 py-3 text-sm font-medium transition flex items-center justify-between " + action.color}>
                  {action.label}
                  {action.badge && (
                    <span className="rounded-full bg-red-500 text-white text-xs px-2 py-0.5 font-bold">{action.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Total value summary */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Platform Value</p>
            <p className="text-3xl font-black text-amber-400">${(totalVal / 1000).toFixed(0)}k <span className="text-sm font-normal text-slate-500">USD across all transactions</span></p>
          </div>
          <Link href="/transactions" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white hover:border-white/20 transition">
            View All →
          </Link>
        </div>

        {/* Recent transactions */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold">Recent Transactions</h3>
            <Link href="/transactions" className="text-xs text-amber-400 hover:text-amber-300">View all →</Link>
          </div>
          {recentTxns.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400">No transactions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentTxns.map(txn => (
                <div key={txn.id} className={"px-6 py-4 flex items-center justify-between gap-4 " + (txn.risk_flag ? "bg-red-500/5" : "")}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="font-medium text-white text-sm">{txn.supplier_name}</p>
                      <span className={"text-xs font-medium border rounded-full px-2 py-0.5 " + (statusColors[txn.status] || statusColors.draft)}>
                        {txn.status}
                      </span>
                      {txn.risk_flag && (
                        <span className="text-xs font-medium border rounded-full px-2 py-0.5 text-red-400 border-red-500/30 bg-red-500/10">
                          ⚠ Flagged
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="font-mono">{txn.transaction_ref}</span>
                      <span>·</span>
                      <span>{getCustomerName(txn.user_id)}</span>
                      <span>·</span>
                      <span>Step {txn.current_step} of 15 — {STEP_NAMES[txn.current_step - 1] || ""}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-amber-400">${Number(txn.total_value).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{new Date(txn.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <Link href={"/transactions/" + txn.id}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-white/20 transition flex-shrink-0">
                    View →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center border-t border-white/10 pt-6">
          <p className="text-xs text-slate-600">KYA Digital Services Ltd · Staff Portal · Not a PSP · Not a Bank · CAC Registered · Nigeria</p>
        </div>

      </div>
    </main>
  );
}