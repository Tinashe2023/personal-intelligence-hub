/**
 * PIOS Cron — Data Collection + Persistence
 * ============================================
 * Triggered externally (cron-job.org) every 30 minutes.
 * Fetches weather, news, research, and system data,
 * then persists to MongoDB for caching & historical tracking.
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
export const maxDuration = 120; // arXiv + Semantic Scholar can be slow

export async function GET(request) {
  // Verify cron secret
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const results = { timestamp: new Date().toISOString(), jobs: {} };

  // ── System Metrics ──────────────────────────────────────────────────────
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

    // Trigger Telegram alert if thresholds exceeded
    await sendSystemAlert(stats);

    results.jobs.system = {
      status: "ok",
      cpu: stats.cpu?.usage?.toFixed(1) + "%",
      ram: stats.ram?.percentage?.toFixed(1) + "%",
    };
  } catch (error) {
    results.jobs.system = { status: "error", message: error.message };
  }

  // ── Weather ─────────────────────────────────────────────────────────────
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

    results.jobs.weather = {
      status: "ok",
      temp: current?.temperature ?? null,
    };
  } catch (error) {
    results.jobs.weather = { status: "error", message: error.message };
  }

  // ── News ────────────────────────────────────────────────────────────────
  try {
    const news = await getNews();
    const articles = news?.articles || [];

    if (articles.length > 0) {
      // Categorize and save (avoid duplicates by URL)
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
      results.jobs.news = {
        status: "ok",
        total: articles.length,
        newlySaved: savedCount,
      };
    } else {
      results.jobs.news = { status: "ok", total: 0, newlySaved: 0 };
    }
  } catch (error) {
    results.jobs.news = { status: "error", message: error.message };
  }

  // ── Research Papers ─────────────────────────────────────────────────────
  try {
    const papers = await getResearchPapers();

    if (papers.length > 0) {
      let savedCount = 0;
      for (const paper of papers) {
        const exists = await ResearchPaper.findOne({
          title: paper.title,
        }).lean();
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
      results.jobs.research = {
        status: "ok",
        total: papers.length,
        newlySaved: savedCount,
      };
    } else {
      results.jobs.research = { status: "ok", total: 0, newlySaved: 0 };
    }
  } catch (error) {
    results.jobs.research = { status: "error", message: error.message };
  }

  console.log("[CRON] Data collection + persistence completed:", JSON.stringify(results));
  return Response.json(results);
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
