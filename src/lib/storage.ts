const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public`;

export function storageUrl(path: string) {
  return `${STORAGE_BASE}/${path}`;
}
