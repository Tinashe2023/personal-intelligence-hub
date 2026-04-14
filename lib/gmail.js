import { google } from "googleapis";

const auth = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
);
auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth });

// Each keyword is queried independently so every category gets at least 1 slot
const EMAIL_KEYWORDS = ["research", "citation", "articles", "scholarship", "snyk", "conference"];

async function fetchOneEmailForKeyword(keyword) {
  try {
    const { data } = await gmail.users.messages.list({
      userId: "me",
      q: keyword,
      maxResults: 1, // Only the most recent match for this keyword
    });

    const messages = data.messages || [];
    if (messages.length === 0) return null;

    const { data: m } = await gmail.users.messages.get({
      userId: "me",
      id: messages[0].id,
      format: "metadata",
      metadataHeaders: ["Subject", "From"],
    });

    return {
      id: m.id,
      keyword,
      subject: m.payload.headers.find((h) => h.name === "Subject")?.value,
      from: m.payload.headers.find((h) => h.name === "From")?.value,
      snippet: m.snippet,
    };
  } catch {
    return null;
  }
}

export async function getFilteredEmails() {
  const results = await Promise.allSettled(
    EMAIL_KEYWORDS.map((kw) => fetchOneEmailForKeyword(kw))
  );

  const seen = new Set();
  const emails = [];

  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const email = result.value;
    // Deduplicate — same message might match multiple keywords
    if (seen.has(email.id)) continue;
    seen.add(email.id);
    emails.push(email);
    if (emails.length >= 6) break; // Card fits up to 6 items
  }

  return emails;
}
