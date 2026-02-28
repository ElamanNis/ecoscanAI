"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useMemo, useState } from "react";

type Tab = "login" | "register";

type Props = {
  open: boolean;
  defaultTab?: Tab;
  onClose: () => void;
  onAuthed: () => void;
};

export default function AuthModal({ open, defaultTab = "register", onClose, onAuthed }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab(defaultTab);
    setError(null);
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const title = useMemo(() => (tab === "login" ? "Вход" : "Регистрация"), [tab]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const supabase = createClientComponentClient();
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        onAuthed();
        onClose();
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);
      // Profile row should be created by Supabase trigger (see `supabase/SETUP.sql`).
      // Avoid client-side upsert here: it can fail if RLS/schema isn't ready and breaks onboarding.
      onAuthed();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Auth failed";
      if (String(message).toLowerCase().includes("refresh token")) {
        const supabase = createClientComponentClient();
        await supabase.auth.signOut({ scope: "local" as any }).catch(() => {});
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 px-4" onMouseDown={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-5" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg border border-[rgba(255,255,255,0.12)] px-2 py-1 text-xs text-[#9cb2c2]">
            Закрыть
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0c1420] p-1">
          <button onClick={() => setTab("login")} className={`rounded-lg px-3 py-2 text-sm ${tab === "login" ? "bg-[rgba(0,200,255,0.18)] text-[#00c8ff]" : "text-[#9cb2c2]"}`}>
            Вход
          </button>
          <button onClick={() => setTab("register")} className={`rounded-lg px-3 py-2 text-sm ${tab === "register" ? "bg-[rgba(0,200,255,0.18)] text-[#00c8ff]" : "text-[#9cb2c2]"}`}>
            Регистрация
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {tab === "register" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя (опционально)"
              className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0c1420] px-3 py-2 text-sm text-white outline-none"
            />
          )}
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
          {error && <p className="text-sm text-[#ff9cb0]">{error}</p>}
          <button type="submit" disabled={loading || !email.trim() || !password.trim()} className="btn-primary w-full py-2 text-sm">
            {loading ? "Подождите..." : tab === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </div>
  );
}
