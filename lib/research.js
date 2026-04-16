/**
 * PIOS Research Intelligence
 * ===========================
 * Aggregates papers from multiple free sources:
 *  1. Semantic Scholar API (free, no key)
 *  2. arXiv API (free, no key, XML/Atom feed)
 *
 * Deduplicates results by title similarity and returns a merged feed.
 */

import { parseStringPromise } from "xml2js";

const TOPICS = ["quantum computing", "blockchain", "federated learning", "LLM", "AI"];
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 2;

/**
 * Main entry point — fetches from all sources and merges.
 */
export async function getResearchPapers() {
  const [semanticPapers, arxivPapers] = await Promise.allSettled([
    fetchSemanticScholar(),
    fetchArxiv(),
  ]);

  const allPapers = [
    ...(semanticPapers.status === "fulfilled" ? semanticPapers.value : []),
    ...(arxivPapers.status === "fulfilled" ? arxivPapers.value : []),
  ];

  // Deduplicate by normalized title
  const seen = new Set();
  const unique = [];
  for (const paper of allPapers) {
    const key = paper.title?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(paper);
    }
  }

  // Sort by year (newest first), then by citations
  unique.sort((a, b) => {
    if ((b.year || 0) !== (a.year || 0)) return (b.year || 0) - (a.year || 0);
    return (b.citationCount || 0) - (a.citationCount || 0);
  });

  return unique;
}

// ── Semantic Scholar ─────────────────────────────────────────────────────────

async function fetchSemanticScholar() {
  const papers = [];

  for (const topic of TOPICS) {
    try {
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(topic)}&fields=title,authors,year,citationCount,externalIds&sort=PublicationDate&limit=5`,
        { cache: "no-store", headers: { "User-Agent": "PIOS-Dashboard/1.0" } }
      );

      if (response.ok) {
        const result = await response.json();
        const topicPapers = (result.data || [])
          .filter((p) => p.year && p.year >= MIN_YEAR)
          .slice(0, 2)
          .map((p) => ({ ...p, source: "semantic_scholar" }));

        papers.push(...topicPapers);
      }
    } catch (e) {
      console.error(`[RESEARCH] Semantic Scholar failed for ${topic}:`, e.message);
    }

    // Rate limit: 1 request per second
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return papers;
}

// ── arXiv ────────────────────────────────────────────────────────────────────

async function fetchArxiv() {
  const papers = [];

  // Map topics to arXiv category-friendly queries
  const arxivQueries = [
    { query: "quantum+computing", topic: "quantum computing" },
    { query: "blockchain+distributed+ledger", topic: "blockchain" },
    { query: "federated+learning", topic: "federated learning" },
    { query: "large+language+model", topic: "LLM" },
  ];

  for (const { query, topic } of arxivQueries) {
    try {
      const url = `https://export.arxiv.org/api/query?search_query=all:${query}&start=0&max_results=3&sortBy=submittedDate&sortOrder=descending`;
      const response = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": "PIOS-Dashboard/1.0" },
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const parsed = await parseStringPromise(xml, { explicitArray: false });

      const entries = parsed.feed?.entry;
      if (!entries) continue;

      const entryList = Array.isArray(entries) ? entries : [entries];

      for (const entry of entryList) {
        const published = entry.published ? new Date(entry.published) : null;
        const year = published?.getFullYear();

        if (year && year < MIN_YEAR) continue;

        // Extract authors
        const authorData = entry.author;
        const authorList = Array.isArray(authorData) ? authorData : [authorData];
        const authors = authorList
          .map((a) => (typeof a === "string" ? a : a?.name))
          .filter(Boolean);

        // Extract arXiv ID from the id URL
        const arxivId = entry.id?.split("/abs/")?.pop() || "";

        papers.push({
          title: (entry.title || "").replace(/\s+/g, " ").trim(),
          authors: authors.map((name) => ({ name })),
          year,
          citationCount: null, // arXiv doesn't provide citation counts
          paperId: arxivId,
          externalIds: { ArXiv: arxivId },
          source: "arxiv",
          abstract: (entry.summary || "").replace(/\s+/g, " ").trim().slice(0, 300),
        });
      }
    } catch (e) {
      console.error(`[RESEARCH] arXiv failed for ${topic}:`, e.message);
    }

    // Rate limit: arXiv asks for 3 second delay
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  return papers;
}
