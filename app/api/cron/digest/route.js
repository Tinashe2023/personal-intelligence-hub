/**
 * PIOS Cron — Daily Telegram Digest
 * ===================================
 * Triggered externally once per day (e.g. 08:00 AM).
 * Sends a summary digest to Telegram.
 *
 * GET /api/cron/digest?key=CRON_SECRET
 */

import { getNews } from "@/lib/news";
import { sendDailyDigest } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const newsData = await getNews();

    await sendDailyDigest({
      newsCount: newsData?.totalResults || 0,
      emailCount: 10,
      aiInsights: 5,
      systemStatus: "Operational 🟢",
    });

    console.log("[CRON] Daily digest sent to Telegram");
    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "Daily digest sent",
    });
  } catch (error) {
    console.error("[CRON] Digest error:", error.message);
    return Response.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
