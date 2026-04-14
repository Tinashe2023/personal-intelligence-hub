/**
 * PIOS AI Prompt Templates
 * ========================
 * Centralized prompt definitions for all AI use cases.
 * Each prompt is designed for minimal token usage with maximum insight.
 */

export const PROMPTS = {
  // ── News Summarization ─────────────────────────────────────────────────
  NEWS_SUMMARY: {
    system: `You are a concise intelligence analyst. Summarize news for a tech researcher interested in quantum computing, blockchain, geopolitics, and AI. Focus on actionable insights.`,
    template: (title, description) =>
      `Summarize this article in exactly 2 concise lines. Focus on key impact and relevance.\n\nTitle: ${title}\nDescription: ${description || "N/A"}`,
    maxTokens: 100,
  },

  // ── Research Paper Simplification ──────────────────────────────────────
  RESEARCH_SIMPLIFY: {
    system: `You are an academic advisor who explains complex research papers in simple, accessible language. Be precise and highlight the key contribution.`,
    template: (title, authors, year) =>
      `Explain this paper's key contribution in 2-3 simple sentences. What problem does it solve and why does it matter?\n\nTitle: ${title}\nAuthors: ${authors || "Unknown"}\nYear: ${year || "N/A"}`,
    maxTokens: 120,
  },

  // ── Email Classification ───────────────────────────────────────────────
  EMAIL_CLASSIFY: {
    system: `You are an email classifier. Categorize emails into exactly ONE of: research, internship, important, spam. Return ONLY a JSON object with "label" and "reason" fields. Keep the reason under 10 words.`,
    template: (subject, from, snippet) =>
      `Classify this email:\n\nSubject: ${subject}\nFrom: ${from}\nSnippet: ${snippet || ""}`,
    maxTokens: 60,
  },

  // ── Analytics Insights ─────────────────────────────────────────────────
  ANALYTICS_INSIGHT: {
    system: `You are a website analytics expert. Identify trends and anomalies from metrics data. Be specific with numbers. Flag anything unusual.`,
    template: (metricsJson) =>
      `Analyze these website metrics and provide 2-3 key insights. Flag any anomalies:\n\n${metricsJson}`,
    maxTokens: 100,
  },

  // ── Smart Alerts ───────────────────────────────────────────────────────
  SMART_ALERT: {
    system: `You are an alert system. Convert raw events into meaningful, human-readable 1-line alerts. Be specific and impactful. No filler words.`,
    template: (eventType, eventData) =>
      `Convert this event into a meaningful 1-line alert:\n\nType: ${eventType}\nData: ${eventData}`,
    maxTokens: 50,
  },
};

/**
 * Get the prompt config for a given task type.
 */
export function getPromptConfig(taskType) {
  const map = {
    news: PROMPTS.NEWS_SUMMARY,
    research: PROMPTS.RESEARCH_SIMPLIFY,
    email: PROMPTS.EMAIL_CLASSIFY,
    analytics: PROMPTS.ANALYTICS_INSIGHT,
    alert: PROMPTS.SMART_ALERT,
  };
  return map[taskType] || null;
}
