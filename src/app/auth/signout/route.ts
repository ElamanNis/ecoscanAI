import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = getSupabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
