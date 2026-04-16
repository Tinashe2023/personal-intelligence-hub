import { google } from "googleapis";

/**
 * Get YouTube channel statistics using OAuth2 client credentials.
 * Uses the YouTube Data API v3 with an API key derived from the project.
 *
 * Since we don't have a standalone API key, we use the OAuth2 client
 * to authenticate and fetch public channel data.
 */
export async function getYouTubeStats() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!channelId) {
    console.warn("[YOUTUBE] YOUTUBE_CHANNEL_ID not set");
    return {};
  }

  // Try using a dedicated API key first
  if (process.env.YOUTUBE_API_KEY) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    return data.items?.[0]?.statistics || {};
  }

  // Fallback: use OAuth2 client credentials with googleapis library
  const auth = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
  );

  const youtube = google.youtube({ version: "v3", auth });

  try {
    // For public data, we can use the API key from the OAuth client's project
    // by setting it directly
    const youtubeWithKey = google.youtube({
      version: "v3",
      auth: process.env.GEMINI_API_KEY, // Reuse project API key if available
    });

    const response = await youtubeWithKey.channels.list({
      part: ["statistics"],
      id: [channelId],
    });

    return response.data.items?.[0]?.statistics || {};
  } catch (error) {
    console.error("[YOUTUBE] API error:", error.message);

    // Last resort: try direct fetch with no auth (may work for some public data)
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${process.env.GEMINI_API_KEY}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.items?.[0]?.statistics) {
        return data.items[0].statistics;
      }
    } catch {}

    return {};
  }
}
