/**
 * PIOS AI Processor
 * ==================
 * High-level AI task functions that orchestrate:
 * filtering → cache check → AI call → cache store → return
 */

import { callAI } from "./provider.js";
import { PROMPTS } from "./prompts.js";
import { hashInput, getCached, setCache } from "./cache.js";

/**
 * Summarize news articles via AI.
 * Pre-filters to top articles, checks cache, then calls AI.
 *
 * @param {Array} articles - Array of { title, description, source, url }
 * @param {number} limit - Max articles to process (default 5)
 * @returns {Array} Array of { title, summary, source, url, cached }
 */
export async function summarizeNews(articles, limit = 5) {
  if (!Array.isArray(articles) || articles.length === 0) return [];

  const filtered = articles.slice(0, limit);
  const results = [];

  for (const article of filtered) {
    if (!article.title) continue;

    const inputText = `${article.title}|${article.description || ""}`;
    const inputHash = hashInput(inputText);

    // Check cache
    const cached = await getCached(inputHash, "news");
    if (cached) {
      results.push({
        title: article.title,
        summary: cached.output,
        source: article.source?.name || article.source || "Unknown",
        url: article.url,
        cached: true,
        provider: cached.provider,
      });
      continue;
    }

    // Call AI
    try {
      const userMessage = PROMPTS.NEWS_SUMMARY.template(
        article.title,
        article.description,
      );

      const response = await callAI(
        PROMPTS.NEWS_SUMMARY.system,
        userMessage,
        { maxTokens: PROMPTS.NEWS_SUMMARY.maxTokens },
      );

      // Cache the result
      await setCache({
        inputHash,
        taskType: "news",
        input: inputText,
        output: response.text,
        provider: response.provider,
        tokensUsed: response.tokens,
      });

      results.push({
        title: article.title,
        summary: response.text,
        source: article.source?.name || article.source || "Unknown",
        url: article.url,
        cached: false,
        provider: response.provider,
      });
    } catch (error) {
      console.error(`[AI_PROCESSOR] News summary failed for "${article.title}":`, error.message);
      results.push({
        title: article.title,
        summary: article.description || "Summary unavailable.",
        source: article.source?.name || article.source || "Unknown",
        url: article.url,
        cached: false,
        provider: "none",
        error: true,
      });
    }
  }

  return results;
}

/**
 * Simplify research papers via AI.
 *
 * @param {Array} papers - Array of { title, authors, year, citationCount }
 * @param {number} limit - Max papers to process
 * @returns {Array} Array of { title, explanation, authors, year, cached }
 */
export async function simplifyResearch(papers, limit = 5) {
  if (!Array.isArray(papers) || papers.length === 0) return [];

  const filtered = papers.slice(0, limit);
  const results = [];

  for (const paper of filtered) {
    if (!paper.title) continue;

    const authorsStr = Array.isArray(paper.authors)
      ? paper.authors.map((a) => a.name || a).join(", ")
      : String(paper.authors || "Unknown");

    const inputText = `${paper.title}|${authorsStr}|${paper.year || ""}`;
    const inputHash = hashInput(inputText);

    // Check cache
    const cached = await getCached(inputHash, "research");
    if (cached) {
      results.push({
        title: paper.title,
        explanation: cached.output,
        authors: authorsStr,
        year: paper.year,
        citations: paper.citationCount,
        cached: true,
        provider: cached.provider,
      });
      continue;
    }

    // Call AI
    try {
      const userMessage = PROMPTS.RESEARCH_SIMPLIFY.template(
        paper.title,
        authorsStr,
        paper.year,
      );

      const response = await callAI(
        PROMPTS.RESEARCH_SIMPLIFY.system,
        userMessage,
        { maxTokens: PROMPTS.RESEARCH_SIMPLIFY.maxTokens },
      );

      await setCache({
        inputHash,
        taskType: "research",
        input: inputText,
        output: response.text,
        provider: response.provider,
        tokensUsed: response.tokens,
      });

      results.push({
        title: paper.title,
        explanation: response.text,
        authors: authorsStr,
        year: paper.year,
        citations: paper.citationCount,
        cached: false,
        provider: response.provider,
      });
    } catch (error) {
      console.error(`[AI_PROCESSOR] Research simplification failed for "${paper.title}":`, error.message);
      results.push({
        title: paper.title,
        explanation: "Explanation unavailable.",
        authors: authorsStr,
        year: paper.year,
        citations: paper.citationCount,
        cached: false,
        provider: "none",
        error: true,
      });
    }
  }

  return results;
}

/**
 * Classify emails via AI.
 *
 * @param {Array} emails - Array of { subject, from, snippet }
 * @param {number} limit - Max emails to process
 * @returns {Array} Array of { subject, from, label, reason, cached }
 */
export async function classifyEmails(emails, limit = 10) {
  if (!Array.isArray(emails) || emails.length === 0) return [];

  const filtered = emails.slice(0, limit);
  const results = [];

  for (const email of filtered) {
    if (!email.subject) continue;

    const inputText = `${email.subject}|${email.from || ""}|${email.snippet || ""}`;
    const inputHash = hashInput(inputText);

    // Check cache
    const cached = await getCached(inputHash, "email");
    if (cached) {
      let parsed;
      try {
        parsed = JSON.parse(cached.output);
      } catch {
        parsed = { label: "unknown", reason: cached.output };
      }

      results.push({
        subject: email.subject,
        from: email.from,
        snippet: email.snippet,
        label: parsed.label || "unknown",
        reason: parsed.reason || "",
        cached: true,
        provider: cached.provider,
      });
      continue;
    }

    // Call AI
    try {
      const userMessage = PROMPTS.EMAIL_CLASSIFY.template(
        email.subject,
        email.from,
        email.snippet,
      );

      const response = await callAI(
        PROMPTS.EMAIL_CLASSIFY.system,
        userMessage,
        { maxTokens: PROMPTS.EMAIL_CLASSIFY.maxTokens },
      );

      await setCache({
        inputHash,
        taskType: "email",
        input: inputText,
        output: response.text,
        provider: response.provider,
        tokensUsed: response.tokens,
      });

      let parsed;
      try {
        parsed = JSON.parse(response.text);
      } catch {
        parsed = { label: "unknown", reason: response.text };
      }

      results.push({
        subject: email.subject,
        from: email.from,
        snippet: email.snippet,
        label: parsed.label || "unknown",
        reason: parsed.reason || "",
        cached: false,
        provider: response.provider,
      });
    } catch (error) {
      console.error(`[AI_PROCESSOR] Email classify failed for "${email.subject}":`, error.message);
      results.push({
        subject: email.subject,
        from: email.from,
        snippet: email.snippet,
        label: "unknown",
        reason: "Classification unavailable.",
        cached: false,
        provider: "none",
        error: true,
      });
    }
  }

  return results;
}

/**
 * Analyze GA4 analytics metrics via AI.
 *
 * @param {object|Array} metrics - GA4 metrics data
 * @returns {{ insight: string, cached: boolean, provider: string }}
 */
export async function analyzeMetrics(metrics) {
  if (!metrics) return { insight: "No analytics data available.", cached: false, provider: "none" };

  const metricsJson = JSON.stringify(metrics, null, 2);
  const inputHash = hashInput(metricsJson);

  // Check cache
  const cached = await getCached(inputHash, "analytics");
  if (cached) {
    return { insight: cached.output, cached: true, provider: cached.provider };
  }

  // Call AI
  try {
    const userMessage = PROMPTS.ANALYTICS_INSIGHT.template(metricsJson);

    const response = await callAI(
      PROMPTS.ANALYTICS_INSIGHT.system,
      userMessage,
      { maxTokens: PROMPTS.ANALYTICS_INSIGHT.maxTokens },
    );

    await setCache({
      inputHash,
      taskType: "analytics",
      input: metricsJson,
      output: response.text,
      provider: response.provider,
      tokensUsed: response.tokens,
    });

    return { insight: response.text, cached: false, provider: response.provider };
  } catch (error) {
    console.error("[AI_PROCESSOR] Analytics insight failed:", error.message);
    return { insight: "Analysis unavailable.", cached: false, provider: "none", error: true };
  }
}

/**
 * Generate a smart alert from a raw event.
 *
 * @param {string} eventType - e.g. "news", "system", "email"
 * @param {string} eventData - Raw event text
 * @returns {{ alert: string, cached: boolean, provider: string }}
 */
export async function generateAlert(eventType, eventData) {
  if (!eventData) return { alert: "", cached: false, provider: "none" };

  const inputText = `${eventType}|${eventData}`;
  const inputHash = hashInput(inputText);

  // Check cache
  const cached = await getCached(inputHash, "alert");
  if (cached) {
    return { alert: cached.output, cached: true, provider: cached.provider };
  }

  // Call AI
  try {
    const userMessage = PROMPTS.SMART_ALERT.template(eventType, eventData);

    const response = await callAI(
      PROMPTS.SMART_ALERT.system,
      userMessage,
      { maxTokens: PROMPTS.SMART_ALERT.maxTokens },
    );

    await setCache({
      inputHash,
      taskType: "alert",
      input: inputText,
      output: response.text,
      provider: response.provider,
      tokensUsed: response.tokens,
    });

    return { alert: response.text, cached: false, provider: response.provider };
  } catch (error) {
    console.error("[AI_PROCESSOR] Alert generation failed:", error.message);
    return { alert: eventData, cached: false, provider: "none", error: true };
  }
}
