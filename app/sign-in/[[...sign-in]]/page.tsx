import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-white">
          KY<span className="text-amber-400">A</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Staff Operations Portal</p>
      </div>
      <SignIn />
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-700">Restricted access — authorised KYA staff only</p>
      </div>
    </main>
  );
}