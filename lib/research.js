const TOPICS = ["quantum computing", "blockchain", "federated learning", "LLM", "AI"];

// Only fetch papers from the last 2 years to keep results current
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 2;

export async function getResearchPapers() {
  const papers = [];

  for (const topic of TOPICS) {
    try {
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(topic)}&fields=title,authors,year,citationCount,externalIds&sort=PublicationDate&limit=5`,
        { headers: { "User-Agent": "PIOS-Dashboard/1.0" } }
      );
      
      if (response.ok) {
        const result = await response.json();
        const topicPapers = result.data || [];
        
        // Filter to recent papers only, then take the 2 most recent per topic
        const filtered = topicPapers
          .filter((p) => p.year && p.year >= MIN_YEAR)
          .slice(0, 2);
          
        papers.push(...filtered);
      }
    } catch (e) {
      console.error(`Research fetch failed for ${topic}:`, e);
    }
    
    // Add a 1000ms delay to avoid rate limiting (429 Too Many Requests)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return papers;
}
