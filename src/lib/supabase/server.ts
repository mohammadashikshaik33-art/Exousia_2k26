import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseServerConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

export const getSupabaseServerClient = async (useServiceRole = false) => {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  const key = useServiceRole ? serviceRoleKey : supabaseAnonKey;
  if (!key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[Supabase Server Client] Key missing for mode (service role: ${useServiceRole}). Fallback mode active.`
      );
    }
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Fallback: Called from Server Component where cookies cannot be modified.
        }
      },
    },
  });
};
export const getSupabaseStaticClient = () => {
  if (!isSupabaseServerConfigured()) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export { supabaseUrl, supabaseAnonKey, serviceRoleKey };
