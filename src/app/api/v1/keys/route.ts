import { NextRequest, NextResponse } from "next/server";
import { issueApiKey, listApiKeys } from "@/lib/server/db";

function isAdmin(request: NextRequest): boolean {
  const token = request.headers.get("x-admin-token") || "";
  const admin = process.env.ADMIN_API_TOKEN || "";
  // #region agent log
  fetch("http://127.0.0.1:7425/ingest/6e171a64-100c-471f-a0f7-68ec2fd33586", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "7da2b2",
    },
    body: JSON.stringify({
      sessionId: "7da2b2",
      runId: "initial",
      hypothesisId: "H4",
      location: "src/app/api/v1/keys/route.ts:isAdmin",
      message: "isAdmin evaluated",
      data: {
        hasHeaderToken: !!token,
        hasAdminEnv: !!admin,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!admin) return false;
  return token === admin;
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
  }
  const keys = await listApiKeys();
  return NextResponse.json({
    keys: keys.map((k) => ({
      keyId: k.keyId,
      plan: k.plan,
      active: k.active,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      label: k.label,
      apiKeyPreview: `${k.apiKey.slice(0, 10)}...`,
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as { plan?: "free" | "pro" | "enterprise"; label?: string };
  const plan = payload.plan || "free";
  if (!["free", "pro", "enterprise"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan. Use free|pro|enterprise" }, { status: 400 });
  }

  const key = await issueApiKey(plan, payload.label);
  return NextResponse.json({
    message: "API key created",
    key: {
      apiKey: key.apiKey,
      keyId: key.keyId,
      plan: key.plan,
      requestLimitPerMinute: key.requestLimitPerMinute,
      createdAt: key.createdAt,
      label: key.label,
    },
  });
}

