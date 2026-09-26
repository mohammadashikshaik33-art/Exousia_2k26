import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

export const getSupabaseBrowserClient = () => {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Supabase Browser Client] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Falling back to local static mock datasets."
      );
    }
    return null;
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
export { supabaseUrl, supabaseAnonKey };
