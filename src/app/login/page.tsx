import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={<main className="grid min-h-screen place-items-center bg-[#030508] px-4 text-sm text-[#9cb2c2]">Loading…</main>}
    >
      <LoginClient />
    </Suspense>
  );
}

