/**
 * PIOS Cron — Data Collection
 * ============================
 * Triggered externally (e.g. cron-job.org) every 30 minutes.
 * Fetches weather, news, and research data.
 *
 * GET /api/cron/collect?key=CRON_SECRET
 */

import { getNews } from "@/lib/news";
import { getWeather } from "@/lib/weather";
import { getResearchPapers } from "@/lib/research";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // allow up to 60s for all fetches

export async function GET(request) {
  // Verify cron secret
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { timestamp: new Date().toISOString(), jobs: {} };

  // Weather
  try {
    const weather = await getWeather();
    results.jobs.weather = {
      status: "ok",
      temp: weather?.current_weather?.temperature ?? null,
    };
  } catch (error) {
    results.jobs.weather = { status: "error", message: error.message };
  }

  // News
  try {
    const news = await getNews();
    results.jobs.news = {
      status: "ok",
      articles: news?.totalResults ?? 0,
    };
  } catch (error) {
    results.jobs.news = { status: "error", message: error.message };
  }

  // Research
  try {
    const papers = await getResearchPapers();
    results.jobs.research = {
      status: "ok",
      papers: papers?.length ?? 0,
    };
  } catch (error) {
    results.jobs.research = { status: "error", message: error.message };
  }

  console.log("[CRON] Data collection completed:", results);
  return Response.json(results);
}
