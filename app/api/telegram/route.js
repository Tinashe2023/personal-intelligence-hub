import { sendMessage, sendAlert } from "@/lib/telegram";

/**
 * POST /api/telegram
 * Send a test message or custom alert via Telegram.
 *
 * Body: { message: "text" } — send raw text
 *   OR: { category: "🧠 AI", title: "Alert", body: "..." } — formatted alert
 */
export async function POST(request) {
  try {
    const body = await request.json();

    let result;

    if (body.message) {
      // Raw message
      result = await sendMessage(body.message);
    } else if (body.category && body.title && body.body) {
      // Formatted alert
      result = await sendAlert(body.category, body.title, body.body);
    } else {
      return Response.json(
        { error: "Provide either { message } or { category, title, body }" },
        { status: 400 },
      );
    }

    if (result) {
      return Response.json({ success: true, messageId: result.message_id });
    } else {
      return Response.json(
        { error: "Failed to send message. Check bot token and chat ID." },
        { status: 500 },
      );
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/telegram
 * Quick test — sends a ping message to verify the bot is working.
 */
export async function GET() {
  try {
    const result = await sendMessage(
      "✅ <b>PIOS Bot Connected!</b>\n\nYour dashboard alerts are active.",
    );

    if (result) {
      return Response.json({ success: true, messageId: result.message_id });
    } else {
      return Response.json(
        { error: "Bot not responding. Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID." },
        { status: 500 },
      );
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
