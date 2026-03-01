import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side admin client — bypasses RLS, only use in API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
});

export const STORAGE_BUCKET = "product-images";

/**
 * Get public URL for a file in Supabase Storage
 */
export function getStorageUrl(filename: string): string {
    return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
}
