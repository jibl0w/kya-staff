import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";
import CustomersClient from "./CustomersClient";

const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];
const EVIDENCE_BUCKET = "kya-documents";

export default async function CustomersPage() {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/sign-in");

  const [
    { data: kycProfiles },
    { data: kybProfiles },
    { data: documents },
    { data: transactions },
    { data: eddRequests },
  ] = await Promise.all([
    supabaseServer.from("kyc_profiles").select("*"),
    supabaseServer.from("kyb_profiles").select("*"),
    supabaseServer.from("documents").select("user_id, status, verification_status, document_type"),
    supabaseServer.from("transactions").select("user_id, status, total_value, currency, transaction_ref"),
    supabaseServer.from("edd_requests").select("*").order("created_at", { ascending: false }),
  ]);

  // Generate signed URLs for re-hosted selfie evidence (private bucket).
  // Maps user_id -> temporary viewable URL. Valid 1 hour; regenerated each load.
  const selfieUrls: Record<string, string> = {};
  const allProfiles = [...(kycProfiles || []), ...(kybProfiles || [])];
  await Promise.all(
    allProfiles.map(async (p: any) => {
      if (p.selfie_url && !p.selfie_url.startsWith("http")) {
        const { data } = await supabaseServer.storage
          .from(EVIDENCE_BUCKET)
          .createSignedUrl(p.selfie_url, 3600);
        if (data?.signedUrl) selfieUrls[p.user_id] = data.signedUrl;
      }
    })
  );

  return (
    <CustomersClient
      kycProfiles={kycProfiles || []}
      kybProfiles={kybProfiles || []}
      documents={documents || []}
      transactions={transactions || []}
      eddRequests={eddRequests || []}
      selfieUrls={selfieUrls}
    />
  );
}