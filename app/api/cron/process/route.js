/**
 * PIOS Cron — AI Processing (Fire-and-Forget)
 * =============================================
 * Triggered externally every 2 hours.
 * Responds immediately with 200 so cron-job.org doesn't timeout,
 * then continues AI processing in the background.
 *
 * Since Render runs a persistent Node.js process (not serverless),
 * the background work will continue after the response is sent.
 *
 * GET /api/cron/process?key=CRON_SECRET
 */

import { getNews } from "@/lib/news";
import { getResearchPapers } from "@/lib/research";
import { summarizeNews, simplifyResearch } from "@/lib/ai/processor";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fire the AI processing in the background — don't await it
  processInBackground().catch((err) =>
    console.error("[CRON-AI] Background processing failed:", err.message)
  );

  // Respond immediately so cron-job.org gets a fast 200
  return Response.json({
    status: "accepted",
    message: "AI processing started in background",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Runs AI summarization + simplification in the background.
 * Processes 3 items each to stay within rate limits.
 */
async function processInBackground() {
  const startTime = Date.now();
  console.log("[CRON-AI] Background processing started...");

  // AI: News summarization (limit to 3 to keep it fast)
  try {
    const newsData = await getNews();
    const articles = newsData?.articles || [];

    if (articles.length > 0) {
      const summaries = await summarizeNews(articles, 3);
      const cached = summaries.filter((s) => s.cached).length;
      const fresh = summaries.filter((s) => !s.cached).length;
      console.log(`[CRON-AI] News: ${fresh} new summaries, ${cached} from cache`);
    }
  } catch (error) {
    console.error("[CRON-AI] News summarization error:", error.message);
  }

  // AI: Research simplification (limit to 3)
  try {
    const papers = await getResearchPapers();

    if (papers.length > 0) {
      const simplified = await simplifyResearch(papers, 3);
      const cached = simplified.filter((r) => r.cached).length;
      const fresh = simplified.filter((r) => !r.cached).length;
      console.log(`[CRON-AI] Research: ${fresh} new explanations, ${cached} from cache`);
    }
  } catch (error) {
    console.error("[CRON-AI] Research simplification error:", error.message);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[CRON-AI] Background processing completed in ${elapsed}s`);
}
