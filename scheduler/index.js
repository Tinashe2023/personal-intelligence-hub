/**
 * PIOS Scheduler — DEPRECATED
 * ============================
 *
 * This standalone scheduler has been replaced by HTTP-triggered
 * cron API routes that work with Render's serverless deployment:
 *
 *   /api/cron/collect   → Data collection (weather, news, research, system)
 *   /api/cron/process   → AI processing (summarization, simplification)
 *   /api/cron/digest    → Daily Telegram digest
 *   /api/cron/cleanup   → Expired AI cache cleanup
 *
 * These routes are triggered by external cron services like cron-job.org.
 *
 * This file is kept for reference only. To run cron jobs locally,
 * hit the API routes directly:
 *
 *   curl http://localhost:3000/api/cron/collect?key=YOUR_CRON_SECRET
 *   curl http://localhost:3000/api/cron/process?key=YOUR_CRON_SECRET
 */

console.log("⚠️  This standalone scheduler is deprecated.");
console.log("   Cron jobs are now handled via /api/cron/* routes.");
console.log("   See: https://personal-intelligence-hub.onrender.com/api/cron/collect?key=CRON_SECRET");
