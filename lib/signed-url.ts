import { supabaseServer } from "@/lib/supabase-server";

const BUCKET = "kya-documents";
const EXPIRY_SECONDS = 3600; // 1 hour

export async function getSignedUrl(storedValue: string | null | undefined): Promise<string | null> {
  if (!storedValue) return null;

  let path = storedValue;

  const marker = `/object/public/${BUCKET}/`;
  if (storedValue.includes(marker)) {
    path = storedValue.split(marker)[1];
  } else {
    const signMarker = `/object/sign/${BUCKET}/`;
    if (storedValue.includes(signMarker)) {
      path = storedValue.split(signMarker)[1].split("?")[0];
    }
  }

  const { data, error } = await supabaseServer.storage
    .from(BUCKET)
    .createSignedUrl(path, EXPIRY_SECONDS);

  if (error || !data) {
    console.error("Signed URL generation failed for path:", path, error);
    return null;
  }

  return data.signedUrl;
}

export async function signDocumentUrls<T extends { file_url?: string | null }>(
  docs: T[]
): Promise<T[]> {
  return Promise.all(
    docs.map(async (doc) => ({
      ...doc,
      file_url: await getSignedUrl(doc.file_url),
    }))
  );
}