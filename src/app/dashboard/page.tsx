import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileSettings from "@/components/ProfileSettings";
import BillingButtons from "@/components/BillingButtons";
import { getSupabaseServer } from "@/lib/supabase/server";
import { SubscriptionTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = getSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login?returnTo=/dashboard");
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

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const { count: monthlyUsage } = await (supabase as any)
    .from("scans_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth);

  return { user, profile, scans, monthlyUsage: monthlyUsage ?? 0 };
}

export default async function DashboardPage() {
  const { user, profile, scans, monthlyUsage } = await getData();
  const tier = ((profile as any)?.subscription_tier || "free") as SubscriptionTier;

  return (
    <main className="min-h-screen bg-[#030508] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Личный кабинет</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/#analyze"
              className="rounded-lg border border-[rgba(0,200,255,0.2)] px-3 py-1 text-sm text-[#00c8ff]"
            >
              Перейти к анализу
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1 text-sm text-[#cfe0ea]"
            >
              На главную
            </Link>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1 text-sm text-[#cfe0ea]">
                Выйти
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-5">
            <div className="text-sm text-[#8ea6b7]">Тариф</div>
            <div className="mt-1 text-xl text-white capitalize">{tier}</div>
            <Link href="/#pricing" className="mt-3 inline-block text-xs text-[#00c8ff]">
              Изменить тариф
            </Link>
            <div className="mt-3">
              <BillingButtons tier={tier} />
            </div>
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-5">
            <div className="text-sm text-[#8ea6b7]">Email</div>
            <div className="mt-1 text-xl text-white">{user.email}</div>
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-5">
            <div className="text-sm text-[#8ea6b7]">Использовано</div>
            <div className="mt-1 text-xl text-white">{monthlyUsage}</div>
            <div className="mt-1 text-xs text-[#7f95a7]">Анализов в этом месяце</div>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#08121d] p-5">
          <div className="mb-3 text-lg text-white">История сканирований</div>
          {scans && scans.length ? (
            <div className="space-y-2">
              {scans.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0c1420] p-3 text-sm text-[#cfe0ea]"
                >
                  <span>{s.region}</span>
                  <span className="font-['JetBrains_Mono'] text-[#00c8ff]">
                    {s.ndvi.toFixed(3)} ({s.ndvi_category})
                  </span>
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
