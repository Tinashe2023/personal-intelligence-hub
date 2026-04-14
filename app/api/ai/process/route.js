import { getNews } from "@/lib/news";
import { getResearchPapers } from "@/lib/research";
import {
  summarizeNews,
  simplifyResearch,
  analyzeMetrics,
} from "@/lib/ai/processor";

/**
 * POST /api/ai/process
 *
 * Manually trigger AI processing for a specific task type.
 * Accepts: { taskType: "news" | "research" | "analytics" | "all" }
 *
 * This is an admin endpoint — not called by the frontend on every page load.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { taskType = "all" } = body;

    const results = {};
    const errors = [];

    // ── News Processing ───────────────────────────────────────────────
    if (taskType === "news" || taskType === "all") {
      try {
        console.log("[AI_PROCESS] Processing news...");
        const newsData = await getNews();
        const articles = newsData?.articles || [];

        if (articles.length > 0) {
          results.news = await summarizeNews(articles, 5);
          console.log(`[AI_PROCESS] Summarized ${results.news.length} articles`);
        } else {
          results.news = [];
          console.log("[AI_PROCESS] No news articles to process");
        }
      } catch (error) {
        console.error("[AI_PROCESS] News error:", error.message);
        errors.push({ task: "news", error: error.message });
      }
    }

    // ── Research Processing ───────────────────────────────────────────
    if (taskType === "research" || taskType === "all") {
      try {
        console.log("[AI_PROCESS] Processing research papers...");
        const papers = await getResearchPapers();

        if (papers.length > 0) {
          results.research = await simplifyResearch(papers, 5);
          console.log(`[AI_PROCESS] Simplified ${results.research.length} papers`);
        } else {
          results.research = [];
          console.log("[AI_PROCESS] No papers to process");
        }
      } catch (error) {
        console.error("[AI_PROCESS] Research error:", error.message);
        errors.push({ task: "research", error: error.message });
      }
    }

    // ── Analytics Processing ──────────────────────────────────────────
    if (taskType === "analytics" || taskType === "all") {
      try {
        console.log("[AI_PROCESS] Processing analytics...");
        // For now, pass a placeholder — GA4 requires service account auth
        results.analytics = { insight: "Analytics processing requires GA4 setup.", provider: "none" };
      } catch (error) {
        console.error("[AI_PROCESS] Analytics error:", error.message);
        errors.push({ task: "analytics", error: error.message });
      }
    }

    return Response.json({
      success: true,
      taskType,
      results,
      errors: errors.length > 0 ? errors : undefined,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] /ai/process error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
