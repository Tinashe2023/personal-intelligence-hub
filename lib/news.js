const QUERY =
  "quantum OR blockchain OR geopolitics OR KAIST OR LPU OR AI research";

export async function getNews() {
  const res = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(QUERY)}&sortBy=publishedAt&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`,
    { next: { revalidate: 3600 } }, // cache 1 hour
  );
  return res.json();
}
