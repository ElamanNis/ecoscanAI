import { HfInference } from "@huggingface/inference";

const groqKey = process.env.GROQ_API_KEY || "";
const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const hfKey = process.env.HUGGINGFACE_API_KEY || "";
const hfModel = process.env.HF_TEXT_MODEL || "HuggingFaceH4/zephyr-7b-beta";
const hfEndpointBase = process.env.HF_ENDPOINT || "https://router.huggingface.co";

const hf = hfKey ? new HfInference(hfKey) : null;

type GroqChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function buildHfEndpointUrl(model: string): string {
  const base = hfEndpointBase.replace(/\/+$/, "");
  if (base.includes("/models/")) return base;
  if (base.endsWith("/models")) return `${base}/${model}`;
  return `${base}/models/${model}`;
}

async function callGroq(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: groqModel,
      temperature: 0.2,
      max_tokens: 1200,
      messages,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Groq HTTP ${res.status}: ${txt.slice(0, 500)}`);
  }

  const data = (await res.json()) as GroqChatResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Groq returned empty content");
  return content;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export async function generateJsonWithFallback(prompt: string): Promise<{
  ok: boolean;
  provider: "groq" | "huggingface" | "none";
  data: Record<string, unknown> | null;
  error?: string;
}> {
  const errors: string[] = [];

  if (groqKey) {
    try {
      const text = await callGroq([
        {
          role: "system",
          content: "Return only valid JSON. Do not wrap in markdown.",
        },
        { role: "user", content: prompt },
      ]);
      const parsed = extractJsonObject(text);
      if (parsed) return { ok: true, provider: "groq", data: parsed };
      errors.push("Groq returned non-JSON response");
    } catch (e) {
      errors.push(`Groq unavailable: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  } else {
    errors.push("Groq unavailable: GROQ_API_KEY is missing");
  }

  if (hf) {
    try {
      const result = await hf.textGeneration({
        endpointUrl: buildHfEndpointUrl(hfModel),
        model: hfModel,
        inputs: prompt,
        parameters: {
          max_new_tokens: 900,
          temperature: 0.2,
          return_full_text: false,
        },
      });
      const parsed = extractJsonObject(result.generated_text || "");
      if (parsed) return { ok: true, provider: "huggingface", data: parsed };
      errors.push("HuggingFace returned non-JSON response");
    } catch (e) {
      errors.push(`HuggingFace unavailable: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  } else {
    errors.push("HuggingFace unavailable: HUGGINGFACE_API_KEY is missing");
  }

  return { ok: false, provider: "none", data: null, error: errors.join(" | ") };
}

export async function generateTextWithFallback(
  message: string,
  context: string,
  history: Array<{ role: string; content: string }>
): Promise<{ ok: boolean; provider: "groq" | "huggingface" | "none"; text: string; error?: string }> {
  const errors: string[] = [];

  if (groqKey) {
    try {
      const system = `You are EcoScan AI, an expert satellite and climate analyst.
Use only numbers from context.
Reply in the same language as user.
Be concise and practical.`;
      const historyMessages = history.slice(-8).map((h) => ({
        role: (h.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: h.content,
      }));
      const text = await callGroq([
        { role: "system", content: `${system}\n\nCONTEXT:\n${context}` },
        ...historyMessages,
        { role: "user", content: message },
      ]);
      return { ok: true, provider: "groq", text };
    } catch (e) {
      errors.push(`Groq unavailable: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  } else {
    errors.push("Groq unavailable: GROQ_API_KEY is missing");
  }

  if (hf) {
    try {
      const historyText = history
        .slice(-8)
        .map((h) => `${h.role === "assistant" ? "Assistant" : "User"}: ${h.content}`)
        .join("\n");
      const prompt = `You are EcoScan AI, an expert satellite and climate analyst.
Use only numbers from context. Reply in user's language.

CONTEXT:
${context}

CHAT HISTORY:
${historyText}

User: ${message}
Assistant:`;

      const result = await hf.textGeneration({
        endpointUrl: buildHfEndpointUrl(hfModel),
        model: hfModel,
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          return_full_text: false,
        },
      });
      const text = (result.generated_text || "").trim();
      if (!text) throw new Error("Empty HuggingFace response");
      return { ok: true, provider: "huggingface", text };
    } catch (e) {
      errors.push(`HuggingFace unavailable: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  } else {
    errors.push("HuggingFace unavailable: HUGGINGFACE_API_KEY is missing");
  }

  return { ok: false, provider: "none", text: "", error: errors.join(" | ") };
}
