"use server";

import { redirect } from "next/navigation";
import { getRedirectPathByRole } from "./utils";
import { validateNextParam } from "@/lib/auth/validateNextParam";
import { createSessionMetadata, setSessionMetadataCookie, clearSessionCookies } from "@/lib/session";
import type { UserRole } from "@/types/auth";

import { createClient as createServerSupabase } from "@/lib/supabase/server";

/**
 * Sign in with email and password.
 *
 * Uses SSR client so session cookies are set on the server response before the
 * redirect. Calling redirect() inside the Server Action ensures the cookie
 * headers and the 303 redirect are sent in the same HTTP response, so the
 * dashboard layout sees a valid session immediately without requiring a refresh.
 */
export async function signInWithEmail(email: string, password: string, next?: string | null) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("No user returned from authentication");
  }

  // Get the user's role from profiles table
  const role = await getUserRole(data.user.id, supabase);
  const baseRedirectPath = getRedirectPathByRole(role);
  if (!baseRedirectPath) {
    await supabase.auth.signOut();
    throw new Error("Your account does not have a valid Fixify role.");
  }

  // Set session metadata tracking
  try {
    if (role) {
      const metadata = await createSessionMetadata(data.user.id, role);
      await setSessionMetadataCookie(metadata);
    }
  } catch (err) {
    console.warn("Session metadata tracking warning:", err);
  }

  // Validate and resolve the next parameter
  const redirectPath = validateNextParam(next, role, baseRedirectPath);

  // redirect() throws a NEXT_REDIRECT internally — this is intentional.
  // It ensures cookies + redirect are sent in a single HTTP response so the
  // target page (dashboard layout) always sees the valid session immediately.
  redirect(redirectPath);
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(next?: string | null) {
  const supabase = await createServerSupabase();

  const callbackUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`);
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    callbackUrl.searchParams.set("next", next);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.url) {
    return { url: data.url };
  }

  throw new Error("No OAuth URL returned");
}

/**
 * Get user's role from profiles table
 */
export async function getUserRole(userId: string, authenticatedClient?: Awaited<ReturnType<typeof createServerSupabase>>): Promise<UserRole | null> {
  const supabase = authenticatedClient || await createServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("[getUserRole] Error:", error);
    return null;
  }

  return data.role as UserRole;
}

/**
 * Get the current user and their role
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const role = await getUserRole(user.id, supabase);
  if (!role) return null;

  return {
    id: user.id,
    email: user.email,
    role,
  };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[Auth Actions] signOut error:", err);
  }

  // Clear all session and auth cookies
  await clearSessionCookies();

  // Return redirect path with logged_out flag
  return { success: true, redirectPath: "/auth/login?logged_out=1" };
}

/**
 * Verify and refresh session if needed
 * Called by middleware to ensure session is valid
 */
export async function verifySession() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
