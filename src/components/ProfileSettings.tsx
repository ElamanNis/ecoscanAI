"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ProfileSettings({ fullName }: { fullName: string }) {
  const [name, setName] = useState(fullName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClientComponentClient();
    const { data: sessionRes } = await supabase.auth.getSession();
    const uid = sessionRes.session?.user?.id;
    if (!uid) {
      setSaving(false);
      setError("Нет сессии");
      return;
    }
    const { error } = await (supabase as any).from("profiles").update({ full_name: name }).eq("id", uid);
    setSaving(false);
    if (error) setError(error.message);
  };
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0c1420] px-3 py-2 text-sm text-white outline-none" />
      {error && <div className="text-sm text-[#ff9cb0]">{error}</div>}
      <button disabled={saving} className="btn-primary py-2 text-sm">{saving ? "Сохраняем..." : "Сохранить"}</button>
    </form>
  );
}
