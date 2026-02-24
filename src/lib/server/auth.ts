import type { ApiClientContext } from "@/types";
import { getApiClientByKey } from "@/lib/server/db";

export async function resolveApiClient(apiKey: string | null): Promise<ApiClientContext | null> {
  if (!apiKey) return null;
  return getApiClientByKey(apiKey);
}
