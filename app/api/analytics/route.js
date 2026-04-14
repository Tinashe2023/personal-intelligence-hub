import { getGA4Stats, getGA4DailyStats, getGA4TopPages } from "@/lib/analytics";

export async function GET() {
  try {
    const [stats, daily, topPages] = await Promise.allSettled([
      getGA4Stats(),
      getGA4DailyStats(),
      getGA4TopPages(),
    ]);

    return Response.json({
      stats: stats.status === "fulfilled" ? stats.value : null,
      daily: daily.status === "fulfilled" ? daily.value : [],
      topPages: topPages.status === "fulfilled" ? topPages.value : [],
      error: stats.status === "rejected" ? stats.reason?.message : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
