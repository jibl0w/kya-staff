import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/sign-in");

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
          <Link href="/audit" className="text-sm text-slate-400 hover:text-white transition">Audit Log</Link>
          <Link href="/account" className="text-sm font-medium text-white border-b-2 border-amber-400 pb-0.5">Account</Link>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-400 mb-1">My Account</p>
          <h2 className="text-3xl font-black">Account Settings</h2>
          <p className="text-slate-400 mt-1 text-sm">Manage your profile, change your password, and review active sessions.</p>
        </div>

        <UserProfile routing="hash" />
      </div>
    </main>
  );
}