import type { ApiClientContext } from "@/types";
import { getApiClientByKey } from "@/lib/server/db";

export async function resolveApiClient(apiKey: string | null): Promise<ApiClientContext | null> {
  if (!apiKey) return null;
  try {
    return await getApiClientByKey(apiKey);
  } catch (err) {
    console.error("resolveApiClient failed:", err);
    return null;
  }
}
