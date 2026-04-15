/**
 * PIOS Cron — Data Collection + Persistence (Fire-and-Forget)
 * ==============================================================
 * Triggered externally (cron-job.org) every 30 minutes.
 * Responds immediately with 200, then fetches & persists data
 * in the background (weather, news, research, system metrics).
 *
 * GET /api/cron/collect?key=CRON_SECRET
 */

import { getNews } from "@/lib/news";
import { getWeather } from "@/lib/weather";
import { getResearchPapers } from "@/lib/research";
import { getSystemStats } from "@/lib/system";
import { sendSystemAlert } from "@/lib/telegram";
import { connectDB } from "@/lib/mongodb";
import WeatherData from "@/models/WeatherData";
import NewsItem from "@/models/NewsItem";
import ResearchPaper from "@/models/ResearchPaper";
import SystemMetric from "@/models/SystemMetric";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fire collection in the background — don't await
  collectInBackground().catch((err) =>
    console.error("[CRON] Background collection failed:", err.message)
  );

  // Respond immediately so cron-job.org gets a fast 200
  return Response.json({
    status: "accepted",
    message: "Data collection started in background",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Runs all data collection + MongoDB persistence in the background.
 */
async function collectInBackground() {
  const startTime = Date.now();
  console.log("[CRON] Background data collection started...");

  await connectDB();

  // ── System Metrics (fast — local os module) ─────────────────────────────
  try {
    const stats = await getSystemStats();

    await SystemMetric.create({
      cpu: { usage: stats.cpu?.usage, cores: stats.cpu?.cores },
      ram: {
        used: stats.ram?.usedBytes,
        total: stats.ram?.totalBytes,
        percentage: stats.ram?.percentage,
      },
      disk: {
        used: stats.disk?.[0]?.percentage,
        total: 100,
        percentage: stats.disk?.[0]?.percentage,
      },
    });

    await sendSystemAlert(stats);
    console.log("[CRON] System metrics saved");
  } catch (error) {
    console.error("[CRON] System error:", error.message);
  }

  // ── Weather (fast — single API call) ────────────────────────────────────
  try {
    const weather = await getWeather();
    const current = weather?.current_weather;

    if (current) {
      await WeatherData.create({
        temperature: current.temperature,
        humidity: weather.hourly?.relativehumidity_2m?.[0] ?? null,
        windSpeed: current.windspeed,
        weatherCode: current.weathercode,
        location: {
          latitude: parseFloat(process.env.OPENMETEO_LAT),
          longitude: parseFloat(process.env.OPENMETEO_LNG),
        },
      });
    }
    console.log("[CRON] Weather saved:", current?.temperature + "°C");
  } catch (error) {
    console.error("[CRON] Weather error:", error.message);
  }

  // ── News (medium — single API call) ─────────────────────────────────────
  try {
    const news = await getNews();
    const articles = news?.articles || [];

    let savedCount = 0;
    for (const article of articles.slice(0, 20)) {
      const exists = await NewsItem.findOne({ url: article.url }).lean();
      if (!exists) {
        const category = categorizeArticle(article.title + " " + (article.description || ""));
        await NewsItem.create({
          title: article.title,
          source: article.source?.name || "Unknown",
          url: article.url,
          category,
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
        });
        savedCount++;
      }
    }
    console.log(`[CRON] News: ${savedCount} new articles saved`);
  } catch (error) {
    console.error("[CRON] News error:", error.message);
  }

  // ── Research Papers (slow — arXiv has 3s delays) ────────────────────────
  try {
    const papers = await getResearchPapers();

    let savedCount = 0;
    for (const paper of papers) {
      const exists = await ResearchPaper.findOne({ title: paper.title }).lean();
      if (!exists) {
        await ResearchPaper.create({
          title: paper.title,
          authors: paper.authors?.map((a) => a.name || a) || [],
          year: paper.year,
          citationCount: paper.citationCount,
          source: paper.source || "semantic_scholar",
          abstract: paper.abstract || "",
          paperId: paper.paperId,
        });
        savedCount++;
      }
    }
    console.log(`[CRON] Research: ${savedCount} new papers saved`);
  } catch (error) {
    console.error("[CRON] Research error:", error.message);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[CRON] Background collection completed in ${elapsed}s`);
}

/**
 * Simple keyword-based categorization for news articles.
 */
function categorizeArticle(text) {
  const lower = (text || "").toLowerCase();
  if (/quantum/.test(lower)) return "quantum";
  if (/blockchain|crypto|defi|web3/.test(lower)) return "blockchain";
  if (/geopolit|sanctions|diplomacy|conflict|nato|treaty/.test(lower)) return "geopolitics";
  if (/\bai\b|artificial intelligence|machine learning|neural|deep learning|llm/.test(lower)) return "ai";
  return "other";
}
