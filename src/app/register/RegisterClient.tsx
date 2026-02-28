"use client";

import Link from "next/link";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";

function safeReturnTo(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClientComponentClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      if (String(error.message || "").toLowerCase().includes("refresh token")) {
        await supabase.auth.signOut({ scope: "local" as any }).catch(() => {});
      }
      setError(error.message);
      return;
    }
    // Profile row is created by DB trigger (see `supabase/SETUP.sql`) and backed up by `/api/me` auto-create.
    setLoading(false);
    router.replace(returnTo);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#030508] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Регистрация</h1>
          <Link href="/" className="text-xs text-[#00c8ff]">
            На главную
          </Link>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя"
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0c1420] px-3 py-2 text-sm text-white outline-none"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0c1420] px-3 py-2 text-sm text-white outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0c1420] px-3 py-2 text-sm text-white outline-none"
        />
        {error && <div className="text-sm text-[#ff9cb0]">{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-2 text-sm">
          {loading ? "Создаем..." : "Создать аккаунт"}
        </button>
      </form>
    </main>
  );
}
