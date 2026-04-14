/**
 * PIOS AI Provider — Fallback Routing Engine
 * ============================================
 * Routes AI requests through: Groq → Gemini → OpenRouter
 * with automatic fallback on failure/rate-limit.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_MAX_TOKENS = 150;
const REQUEST_TIMEOUT_MS = 15000; // 15 second timeout per provider

/**
 * Main entry point — calls AI with automatic fallback.
 *
 * @param {string} systemPrompt - System/role instruction
 * @param {string} userMessage - The actual content to process
 * @param {object} options - { maxTokens, temperature }
 * @returns {{ text: string, provider: string, tokens: number }}
 */
export async function callAI(systemPrompt, userMessage, options = {}) {
  const { maxTokens = DEFAULT_MAX_TOKENS, temperature = 0.3 } = options;

  const providers = [
    { name: "groq", fn: () => callGroq(systemPrompt, userMessage, maxTokens, temperature) },
    { name: "gemini", fn: () => callGemini(systemPrompt, userMessage, maxTokens, temperature) },
    { name: "openrouter", fn: () => callOpenRouter(systemPrompt, userMessage, maxTokens, temperature) },
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      if (result && result.text) {
        return { ...result, provider: provider.name };
      }
    } catch (error) {
      console.warn(`[AI_PROVIDER] ${provider.name} failed:`, error.message);
      // Continue to next provider
    }
  }

  // All providers failed
  throw new Error("All AI providers failed. Check API keys and rate limits.");
}

// ── Groq (Primary) ────────────────────────────────────────────────────────

async function callGroq(systemPrompt, userMessage, maxTokens, temperature) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Groq HTTP ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    const tokens = data.usage?.total_tokens || 0;

    if (!text) throw new Error("Empty response from Groq");

    return { text, tokens };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Google Gemini (Secondary) ─────────────────────────────────────────────

async function callGemini(systemPrompt, userMessage, maxTokens, temperature) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `${GEMINI_API_URL}?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [{ text: userMessage }],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const tokens = data.usageMetadata?.totalTokenCount || 0;

    if (!text) throw new Error("Empty response from Gemini");

    return { text, tokens };
  } finally {
    clearTimeout(timeout);
  }
}

// ── OpenRouter (Fallback) ─────────────────────────────────────────────────

async function callOpenRouter(systemPrompt, userMessage, maxTokens, temperature) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pios-dashboard.local",
        "X-Title": "PIOS Dashboard",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    const tokens = data.usage?.total_tokens || 0;

    if (!text) throw new Error("Empty response from OpenRouter");

    return { text, tokens };
  } finally {
    clearTimeout(timeout);
  }
}
