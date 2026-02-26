import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { SubscriptionTier } from "@/lib/supabase/types";
import Link from "next/link";
import ProfileSettings from "@/components/ProfileSettings";

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = getSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    redirect("/login");
  }
  const user = session.user;
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("id,full_name,subscription_tier,api_usage_count")
    .eq("id", user.id)
    .maybeSingle();
  const { data: scans } = await (supabase as any)
    .from("scans_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);
  return { user, profile, scans };
}

export default async function DashboardPage() {
  const { user, profile, scans } = await getData();
  const tier = ((profile as any)?.subscription_tier || "free") as SubscriptionTier;
  return (
    <main className="min-h-screen bg-[#030508] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Личный кабинет</h1>
          <form action="/auth/signout" method="post">
            <button className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1 text-sm text-[#cfe0ea]">Выйти</button>
          </form>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-5">
            <div className="text-sm text-[#8ea6b7]">Тариф</div>
            <div className="mt-1 text-xl text-white capitalize">{tier}</div>
            <Link href="#pricing" className="mt-3 inline-block text-xs text-[#00c8ff]">Изменить тариф</Link>
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-5">
            <div className="text-sm text-[#8ea6b7]">Email</div>
            <div className="mt-1 text-xl text-white">{user.email}</div>
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-5">
            <div className="text-sm text-[#8ea6b7]">Использовано</div>
            <div className="mt-1 text-xl text-white">{profile?.api_usage_count ?? 0}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-5">
          <div className="mb-3 text-lg text-white">История сканирований</div>
          {scans && scans.length ? (
            <div className="space-y-2">
              {scans.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0c1420] p-3 text-sm text-[#cfe0ea]">
                  <span>{s.region}</span>
                  <span className="font-['JetBrains_Mono'] text-[#00c8ff]">{s.ndvi.toFixed(3)} ({s.ndvi_category})</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[#8ea6b7]">Нет данных</div>
          )}
        </div>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-5" id="settings">
          <div className="mb-3 text-lg text-white">Настройки профиля</div>
          <ProfileSettings fullName={profile?.full_name || ""} />
        </div>
      </div>
    </main>
  );
}
