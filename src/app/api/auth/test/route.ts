import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: `Auth Error: ${error.message}` },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "No user data returned" },
        { status: 401 }
      );
    }

    // Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    return NextResponse.json({
      userId: data.user.id,
      email: data.user.email,
      role: profile?.role || "unknown",
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Server Error: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
