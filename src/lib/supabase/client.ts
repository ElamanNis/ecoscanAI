import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./types";

export function getSupabaseClient() {
  return createClientComponentClient<Database>();
}

