import type { AnalysisResult, MonthlyActionPlan, PlanResponse } from "@/types";
import { generateJsonWithFallback } from "@/lib/server/ai";

function riskToLevel(ndvi: number, change: number): "Low" | "Moderate" | "High" | "Critical" {
  if (ndvi < 0.2 || change < -12) return "Critical";
  if (ndvi < 0.35 || change < -6) return "High";
  if (ndvi < 0.5 || change < -2) return "Moderate";
  return "Low";
}

function nextMonths(count: number): string[] {
  const start = new Date();
  const months: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push(d.toLocaleString("en-US", { month: "long", year: "numeric" }));
  }
  return months;
}

function fallbackPlan(analysis: AnalysisResult, months: number, goal?: string): PlanResponse {
  const planMonths = nextMonths(months);
  const baseRisk = riskToLevel(analysis.ndvi, analysis.changePercent);
  const objective = goal || "Stabilize vegetation and increase soil productivity";
  const actionsByRisk: Record<string, string[]> = {
    Low: ["Keep current irrigation schedule", "Continue monthly NDVI monitoring", "Optimize fertilizer timing based on rain forecast"],
    Moderate: ["Increase field scouting frequency", "Apply variable-rate nutrients in stressed zones", "Review irrigation uniformity with moisture checks"],
    High: ["Start urgent stress-mitigation irrigation", "Deploy anti-erosion practices on exposed areas", "Prioritize re-vegetation in low-NDVI zones"],
    Critical: ["Activate emergency drought response", "Stop intensive operations on degraded parcels", "Run weekly satellite reassessment and field sampling"],
  };

  const plans: MonthlyActionPlan[] = planMonths.map((month, idx) => {
    const riskLevel = idx > months / 2 && baseRisk !== "Critical" ? "Moderate" : baseRisk;
    return {
      month,
      objective: idx === 0 ? objective : "Consolidate improvements and reduce risk exposure",
      actions: actionsByRisk[riskLevel].slice(0, 3),
      kpi: idx === 0 ? "NDVI +0.02 and no additional vegetation loss" : "Stable NDVI trend and lower high-risk area share",
      riskLevel,
    };
  });

  return {
    region: analysis.region,
    generatedAt: new Date().toISOString(),
    horizonMonths: months,
    summary: `${months}-month plan generated for ${analysis.region}. Focus: ${objective}. Current NDVI is ${analysis.ndvi.toFixed(3)} (${analysis.ndviCategory}).`,
    plans,
  };
}

export async function generateMonthlyPlan(analysis: AnalysisResult, months: 3 | 6 | 12, goal?: string): Promise<PlanResponse> {
  try {
    const prompt = `You are an agronomy and satellite-analytics planner.
Create a practical ${months}-month action plan based on this analysis:
- Region: ${analysis.region}
- NDVI: ${analysis.ndvi} (${analysis.ndviCategory})
- Change: ${analysis.changePercent}%
- Land use: forest ${analysis.landUse.forest}%, agriculture ${analysis.landUse.agriculture}%, urban ${analysis.landUse.urban}%, water ${analysis.landUse.water}%, bare ${analysis.landUse.bare}%
- Alerts: ${analysis.alerts.map((a) => a.message).join("; ") || "none"}
- User goal: ${goal || "increase resilience and crop productivity"}

Respond ONLY valid JSON:
{
  "summary":"text",
  "plans":[
    {
      "month":"Month YYYY",
      "objective":"text",
      "actions":["a","b","c"],
      "kpi":"text",
      "riskLevel":"Low|Moderate|High|Critical"
    }
  ]
}
Return exactly ${months} plan items.`;

    const ai = await generateJsonWithFallback(prompt);
    if (!ai.ok || !ai.data) return fallbackPlan(analysis, months, goal);
    const parsed = ai.data as { summary?: string; plans?: MonthlyActionPlan[] };
    if (!Array.isArray(parsed.plans) || parsed.plans.length === 0) return fallbackPlan(analysis, months, goal);

    const normalized = parsed.plans.slice(0, months).map((item, idx) => ({
      // Always use server-generated month labels so the UI doesn't show stale years like "March 2024".
      month: nextMonths(months)[idx],
      objective: item.objective || "Improve ecosystem stability",
      actions: Array.isArray(item.actions) ? item.actions.slice(0, 3) : ["Monitor NDVI weekly", "Adjust irrigation", "Optimize nutrient usage"],
      kpi: item.kpi || "Improve NDVI and reduce stressed area",
      riskLevel: ["Low", "Moderate", "High", "Critical"].includes(item.riskLevel) ? item.riskLevel : "Moderate",
    })) as MonthlyActionPlan[];

    return {
      region: analysis.region,
      generatedAt: new Date().toISOString(),
      horizonMonths: months,
      summary: parsed.summary || `${months}-month operational plan generated for ${analysis.region}.`,
      plans: normalized,
    };
  } catch (error) {
    console.error("Plan generation failed:", error);
    return fallbackPlan(analysis, months, goal);
  }
}
