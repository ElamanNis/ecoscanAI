import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<main className="grid min-h-screen place-items-center bg-[#030508] px-4 text-sm text-[#9cb2c2]">Loading…</main>}
    >
      <RegisterClient />
    </Suspense>
  );
}

