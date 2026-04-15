/**
 * PIOS News Intelligence
 * =======================
 * Fetches targeted English-language news from NewsAPI.
 * Filters out entertainment/tabloid sources.
 */

const QUERY =
  "quantum computing OR blockchain technology OR geopolitics OR KAIST OR LPU university OR artificial intelligence research";

// Sources to exclude (entertainment, tabloid, non-English)
const EXCLUDED_DOMAINS =
  "yahoo.com,buzzfeed.com,tmz.com,people.com,eonline.com,pagesix.com";

export async function getNews() {
  const params = new URLSearchParams({
    q: QUERY,
    language: "en",
    sortBy: "publishedAt",
    pageSize: "20",
    excludeDomains: EXCLUDED_DOMAINS,
    apiKey: process.env.NEWS_API_KEY,
  });

  const res = await fetch(
    `https://newsapi.org/v2/everything?${params.toString()}`,
    { next: { revalidate: 3600 } }, // cache 1 hour
  );

  return res.json();
}
