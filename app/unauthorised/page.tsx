export default function UnauthorisedPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-black mb-4">KY<span className="text-amber-400">A</span></h1>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 max-w-md">
          <p className="text-red-400 font-semibold text-lg mb-2">Access Denied</p>
          <p className="text-slate-400 text-sm">
            You do not have permission to access the KYA Staff portal. If you believe this is an error please contact your administrator.
          </p>
        </div>
      </div>
    </main>
  );
}