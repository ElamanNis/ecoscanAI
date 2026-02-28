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
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const resendConfirmation = async () => {
    if (!email.trim()) return;
    setError(null);
    setSuccess(null);
    setResendLoading(true);
    try {
      const supabase = createClientComponentClient();
      const { error } = await (supabase as any).auth.resend({ type: "signup", email });
      if (error) throw new Error(error.message);
      setSuccess("Письмо подтверждения отправлено повторно. Проверьте почту (и папку Спам).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить письмо");
    } finally {
      setResendLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
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
    if (!data.session) {
      setSuccess("Аккаунт создан. Подтвердите email: вам пришло письмо со ссылкой подтверждения (проверьте Спам).");
      return;
    }
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
        {success && (
          <div className="rounded-lg border border-[rgba(0,255,135,0.25)] bg-[rgba(0,255,135,0.08)] p-3 text-sm text-[#9dd6b7]">
            {success}
          </div>
        )}
        {error && <div className="text-sm text-[#ff9cb0]">{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-2 text-sm">
          {loading ? "Создаем..." : "Создать аккаунт"}
        </button>
        {success && (
          <button type="button" disabled={resendLoading} onClick={resendConfirmation} className="btn-ghost w-full py-2 text-sm">
            {resendLoading ? "Отправляем..." : "Отправить письмо ещё раз"}
          </button>
        )}
      </form>
    </main>
  );
}
