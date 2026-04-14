import cron from "node-cron";
import { getSystemStats } from "../lib/system.js";
import { getNews } from "../lib/news.js";
import { getWeather } from "../lib/weather.js";
import { getResearchPapers } from "../lib/research.js";
import { connectDB } from "../lib/mongodb.js";
import { summarizeNews, simplifyResearch } from "../lib/ai/processor.js";
import { cleanExpiredCache } from "../lib/ai/cache.js";
import { sendSystemAlert, sendDailyDigest } from "../lib/telegram.js";

await connectDB();

// ═══════════════════════════════════════════════════════════════════════════
// DATA COLLECTION JOBS
// ═══════════════════════════════════════════════════════════════════════════

// System metrics — every 5 min
cron.schedule("*/5 * * * *", async () => {
  try {
    const stats = await getSystemStats();
    console.log("[CRON] system metrics fetched", new Date().toISOString());
    // Save to MongoDB: SystemMetric.create(stats)
    
    // Send Telegram alert if thresholds exceeded
    await sendSystemAlert(stats);
  } catch (error) {
    console.error("[CRON] Error fetching system metrics:", error);
  }
});

// Weather — every 30 min
cron.schedule("*/30 * * * *", async () => {
  try {
    const weather = await getWeather();
    console.log("[CRON] weather fetched", weather.current_weather?.temperature);
    // Save to MongoDB: WeatherData.create(...)
  } catch (error) {
    console.error("[CRON] Error fetching weather:", error);
  }
});

// News — every hour
cron.schedule("0 * * * *", async () => {
  try {
    const news = await getNews();
    console.log("[CRON] news fetched:", news.totalResults, "articles");
    // Save to MongoDB: NewsItem.create(...)
  } catch (error) {
    console.error("[CRON] Error fetching news:", error);
  }
});

// Research — every 2 hours
cron.schedule("0 */2 * * *", async () => {
  try {
    const papers = await getResearchPapers();
    console.log("[CRON] research papers:", papers.length);
    // Save to MongoDB: ResearchPaper.create(...)
  } catch (error) {
    console.error("[CRON] Error fetching research papers:", error);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AI PROCESSING JOBS (run AFTER data collection)
// ═══════════════════════════════════════════════════════════════════════════

// AI: News summarization — every 30 min (offset by 5 min from data fetch)
cron.schedule("5,35 * * * *", async () => {
  try {
    console.log("[CRON-AI] Starting news summarization...");
    const newsData = await getNews();
    const articles = newsData?.articles || [];

    if (articles.length > 0) {
      const summaries = await summarizeNews(articles, 5);
      const cached = summaries.filter((s) => s.cached).length;
      const fresh = summaries.filter((s) => !s.cached).length;
      console.log(`[CRON-AI] News: ${fresh} new summaries, ${cached} from cache`);
    } else {
      console.log("[CRON-AI] No news articles to summarize");
    }
  } catch (error) {
    console.error("[CRON-AI] News summarization error:", error.message);
  }
});

// AI: Research simplification — every 2 hours (offset by 10 min)
cron.schedule("10 */2 * * *", async () => {
  try {
    console.log("[CRON-AI] Starting research simplification...");
    const papers = await getResearchPapers();

    if (papers.length > 0) {
      const results = await simplifyResearch(papers, 5);
      const cached = results.filter((r) => r.cached).length;
      const fresh = results.filter((r) => !r.cached).length;
      console.log(`[CRON-AI] Research: ${fresh} new explanations, ${cached} from cache`);
    } else {
      console.log("[CRON-AI] No papers to simplify");
    }
  } catch (error) {
    console.error("[CRON-AI] Research simplification error:", error.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MAINTENANCE JOBS
// ═══════════════════════════════════════════════════════════════════════════

// Clean expired AI cache — every 6 hours
cron.schedule("0 */6 * * *", async () => {
  try {
    await cleanExpiredCache();
    console.log("[CRON] Expired AI cache cleaned");
  } catch (error) {
    console.error("[CRON] Cache cleanup error:", error.message);
  }
});

// Daily Digest — every morning at 08:00
cron.schedule("0 8 * * *", async () => {
  try {
    console.log("[CRON] Sending daily Telegram digest...");
    const system = await getSystemStats();
    const isHealthy = system.cpu?.usage < 80 && system.ram?.percentage < 80;
    
    // In a real app we'd query the DB for yesterday's counts.
    // For now, we'll fetch the current state to populate the digest.
    const newsData = await getNews();
    
    await sendDailyDigest({
      newsCount: newsData?.totalResults || 0,
      emailCount: 10, // Mocked for now or import getFilteredEmails
      aiInsights: 5,
      systemStatus: isHealthy ? "Operational 🟢" : "Degraded 🟡",
    });
  } catch (error) {
    console.error("[CRON] Error sending daily digest:", error.message);
  }
});

console.log("PIOS Scheduler running...");
console.log("  Data jobs: system(5m), weather(30m), news(1h), research(2h)");
console.log("  AI jobs:   news-summary(30m), research-simplify(2h)");
console.log("  Alerts:    daily-digest(08:00 AM), system-alerts(5m)");
console.log("  Maintenance: cache-cleanup(6h)");
