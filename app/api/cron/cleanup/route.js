/**
 * PIOS Cron — Cache Cleanup
 * ==========================
 * Triggered externally every 6 hours.
 * Removes expired AI cache entries from MongoDB.
 *
 * GET /api/cron/cleanup?key=CRON_SECRET
 */

import { cleanExpiredCache } from "@/lib/ai/cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await cleanExpiredCache();

    console.log("[CRON] Cache cleanup completed");
    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "Expired cache entries cleaned",
    });
  } catch (error) {
    console.error("[CRON] Cleanup error:", error.message);
    return Response.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
