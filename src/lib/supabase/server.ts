import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./types";

export function getSupabaseServer() {
  return createRouteHandlerClient<Database>({ cookies });
}

