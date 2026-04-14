/**
 * PIOS Telegram Bot — Alert Sender
 * ==================================
 * Sends formatted messages to your Telegram via the Bot API.
 * Uses TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from .env.local.
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

/**
 * Send a plain text message to Telegram.
 */
export async function sendMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[TELEGRAM] Bot token or chat ID not set — skipping alert");
    return null;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error("[TELEGRAM] Send failed:", data.description);
      return null;
    }

    return data.result;
  } catch (error) {
    console.error("[TELEGRAM] Error:", error.message);
    return null;
  }
}

/**
 * Send a formatted dashboard alert.
 * @param {string} category - e.g. "🧠 AI", "📰 News", "⚠️ System"
 * @param {string} title - Alert title
 * @param {string} body - Alert body text
 */
export async function sendAlert(category, title, body) {
  const message = `<b>${category}</b>\n<b>${title}</b>\n\n${body}\n\n<i>— PIOS Dashboard</i>`;
  return sendMessage(message);
}

/**
 * Send a system health alert when metrics exceed thresholds.
 */
export async function sendSystemAlert(metrics) {
  const alerts = [];

  if (metrics.cpu?.usage > 90) {
    alerts.push(`🔴 CPU at <b>${metrics.cpu.usage.toFixed(1)}%</b>`);
  }
  if (metrics.ram?.percentage > 90) {
    alerts.push(`🔴 RAM at <b>${metrics.ram.percentage.toFixed(1)}%</b> (${metrics.ram.used} / ${metrics.ram.total})`);
  }
  if (metrics.disk?.[0]?.percentage > 95) {
    alerts.push(`🔴 Disk at <b>${metrics.disk[0].percentage.toFixed(1)}%</b>`);
  }

  if (alerts.length > 0) {
    const message = `<b>⚠️ System Alert</b>\n\n${alerts.join("\n")}\n\n<i>— PIOS Dashboard</i>`;
    return sendMessage(message);
  }

  return null;
}

/**
 * Send a daily digest summary.
 */
export async function sendDailyDigest({ newsCount, emailCount, aiInsights, systemStatus }) {
  const lines = [
    `<b>📋 Daily PIOS Digest</b>`,
    ``,
    `📰 News articles: <b>${newsCount || 0}</b>`,
    `📧 Filtered emails: <b>${emailCount || 0}</b>`,
    `🧠 AI insights generated: <b>${aiInsights || 0}</b>`,
    `💻 System: <b>${systemStatus || "Operational"}</b>`,
  ];

  const message = lines.join("\n") + `\n\n<i>— PIOS Dashboard</i>`;
  return sendMessage(message);
}

/**
 * Send AI-generated smart alert.
 */
export async function sendSmartAlert(alertText) {
  return sendAlert("🧠 AI Insight", "Smart Alert", alertText);
}
