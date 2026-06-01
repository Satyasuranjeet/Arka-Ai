type GroqOptions = {
  prompt: string;
  temperature?: number;
  expectJson?: boolean;
  maxTokens?: number;
};

const GROQ_API_BASE = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODELS = ["llama-3.3-70b-versatile"];

function groqApiKey() {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) {
    throw new Error("GROQ_API_KEY is not set in the Trigger.dev environment.");
  }
  return key;
}

function modelCandidates() {
  const configured = (process.env.GROQ_MODELS ?? process.env.GROQ_MODEL ?? "").trim();
  if (!configured) return DEFAULT_GROQ_MODELS;
  return configured
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

function shouldTryNextModel(status: number, bodyText: string) {
  if ([429, 503].includes(status)) return true;

  const t = bodyText.toLowerCase();
  return (
    t.includes("model") &&
    (t.includes("not found") || t.includes("does not exist") || t.includes("unsupported"))
  );
}

export async function groqGenerateText(options: GroqOptions) {
  const models = modelCandidates();
  const apiKey = groqApiKey();
  let lastError = "";

  for (const model of models) {
    const body: Record<string, unknown> = {
      model,
      messages: [{ role: "user", content: options.prompt }],
      temperature: options.temperature ?? 0.3,
    };

    if (typeof options.maxTokens === "number") {
      body.max_tokens = options.maxTokens;
    }

    if (options.expectJson) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();

    if (!res.ok) {
      lastError = `${res.status} ${raw}`;
      if (shouldTryNextModel(res.status, raw)) {
        continue;
      }
      throw new Error(`Groq request failed for model ${model}: ${lastError}`);
    }

    try {
      const parsed = JSON.parse(raw);
      const content = parsed?.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) {
        return { text: content.trim(), model };
      }
      lastError = `Groq returned empty content for model ${model}`;
    } catch (error) {
      lastError = `Could not parse Groq response JSON for model ${model}: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  throw new Error(
    `Groq generation failed for models: ${models.join(", ")}. Last error: ${lastError || "unknown"}`,
  );
}
