"use server";

import { createClient } from "@/lib/supabase/server";

export async function debugCheckSession() {
  try {
    const supabase = await createClient();
    
    // Try to get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log("[DEBUG] Current user:", user?.id, user?.email);
    if (userError) {
      console.log("[DEBUG] User error:", userError);
    }

    // Try to get the profile
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      console.log("[DEBUG] Profile:", profile);
      if (profileError) {
        console.log("[DEBUG] Profile error:", profileError);
      }
    }

    return {
      user: user ? { id: user.id, email: user.email } : null,
      error: userError || null,
    };
  } catch (err) {
    console.log("[DEBUG] Exception:", err);
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
