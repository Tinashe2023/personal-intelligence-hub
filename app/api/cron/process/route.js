/**
 * PIOS Cron — AI Processing
 * ==========================
 * Triggered externally every 2 hours.
 * Runs AI summarization on news + research data.
 *
 * GET /api/cron/process?key=CRON_SECRET
 */

import { getNews } from "@/lib/news";
import { getResearchPapers } from "@/lib/research";
import { summarizeNews, simplifyResearch } from "@/lib/ai/processor";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // AI calls can be slow

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { timestamp: new Date().toISOString(), jobs: {} };

  // AI: News summarization
  try {
    const newsData = await getNews();
    const articles = newsData?.articles || [];

    if (articles.length > 0) {
      const summaries = await summarizeNews(articles, 5);
      const cached = summaries.filter((s) => s.cached).length;
      const fresh = summaries.filter((s) => !s.cached).length;
      results.jobs.newsSummary = { status: "ok", fresh, cached };
    } else {
      results.jobs.newsSummary = { status: "ok", message: "No articles to summarize" };
    }
  } catch (error) {
    results.jobs.newsSummary = { status: "error", message: error.message };
  }

  // AI: Research simplification
  try {
    const papers = await getResearchPapers();

    if (papers.length > 0) {
      const simplified = await simplifyResearch(papers, 5);
      const cached = simplified.filter((r) => r.cached).length;
      const fresh = simplified.filter((r) => !r.cached).length;
      results.jobs.researchSimplify = { status: "ok", fresh, cached };
    } else {
      results.jobs.researchSimplify = { status: "ok", message: "No papers to simplify" };
    }
  } catch (error) {
    results.jobs.researchSimplify = { status: "error", message: error.message };
  }

  console.log("[CRON] AI processing completed:", results);
  return Response.json(results);
}
