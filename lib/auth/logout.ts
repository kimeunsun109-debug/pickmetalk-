import { clearClientSessionData } from "@/lib/auth/clearClientSession";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Sign out, clear browser-side cache, then move to login. */
export async function logout(supabase: SupabaseClient) {
  clearClientSessionData();
  try {
    await supabase.auth.signOut();
  } catch {
    /* Even if the network fails, local session data has been cleared. */
  }
  window.location.href = "/login";
}
