import { getAllCachedByType } from "@/lib/ai/cache";

/**
 * GET /api/ai/insights
 *
 * Returns pre-computed AI insights from cache.
 * Does NOT trigger AI calls — just reads cached results.
 * AI processing happens via cron scheduler or POST /api/ai/process.
 */
export async function GET() {
  try {
    const [
      newsSummaries,
      researchInsights,
      emailLabels,
      analyticsInsights,
      alerts,
    ] = await Promise.all([
      getAllCachedByType("news", 10),
      getAllCachedByType("research", 10),
      getAllCachedByType("email", 15),
      getAllCachedByType("analytics", 5),
      getAllCachedByType("alert", 10),
    ]);

    // Parse email labels from JSON strings
    const parsedEmailLabels = emailLabels.map((entry) => {
      let parsed;
      try {
        parsed = JSON.parse(entry.output);
      } catch {
        parsed = { label: "unknown", reason: entry.output };
      }
      return {
        input: entry.input,
        label: parsed.label,
        reason: parsed.reason,
        provider: entry.provider,
        createdAt: entry.createdAt,
      };
    });

    return Response.json({
      newsSummaries: newsSummaries.map((e) => ({
        input: e.input,
        summary: e.output,
        provider: e.provider,
        createdAt: e.createdAt,
      })),
      researchInsights: researchInsights.map((e) => ({
        input: e.input,
        explanation: e.output,
        provider: e.provider,
        createdAt: e.createdAt,
      })),
      emailLabels: parsedEmailLabels,
      analyticsInsights: analyticsInsights.map((e) => ({
        insight: e.output,
        provider: e.provider,
        createdAt: e.createdAt,
      })),
      alerts: alerts.map((e) => ({
        alert: e.output,
        provider: e.provider,
        createdAt: e.createdAt,
      })),
      counts: {
        news: newsSummaries.length,
        research: researchInsights.length,
        email: emailLabels.length,
        analytics: analyticsInsights.length,
        alerts: alerts.length,
      },
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] /ai/insights error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
