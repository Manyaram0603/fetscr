// backend.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // <-- load .env file

const app = express();


app.use(cors());
app.use(express.json());

// IMPORTANT: Move these to environment variables in production.
// For now you can keep the values here while developing.
const PORT = process.env.PORT || 5000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CX = process.env.CX;

// Helper: fetch one page of results from Google Custom Search
async function scrapeGoogle(query, startIndex = 1) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CX}&q=${encodeURIComponent(
    query
  )}&start=${startIndex}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!data.items || !data.items.length) return [];

  let nextStartIndex = 1;
  if (data.queries?.nextPage?.[0]) {
    nextStartIndex = data.queries.nextPage[0].startIndex;
  }

  const hasMoreResults = nextStartIndex <= 100;

  return data.items.map((item) => {
    const titleParts = (item.title || "").split(" - ");
    return {
      name: titleParts[0] || null,
      title: titleParts.slice(1).join(" - ") || null,
      link: item.link || null,
      snippet: item.snippet || null,
      image: item.pagemap?.cse_thumbnail?.[0]?.src || null,
      startIndex: nextStartIndex,
      hasMoreResults,
    };
  });
}

// POST /scrape
// Body: { query: string, pages?: number }
// returns: { success: true, count, results }
app.post("/scrape", async (req, res) => {
  try {
    const { query, pages = 1 } = req.body;

    if (!query || !query.toString().trim()) {
      return res.status(400).json({ success: false, error: "Missing query" });
    }

    const maxPages = Math.min(Number(pages) || 1, 10); // safeguard: max 10 pages
    let start = 1;
    const results = [];

    for (let i = 0; i < maxPages; i++) {
      const pageResults = await scrapeGoogle(query, start);
      if (!pageResults.length) break;

      results.push(...pageResults);

      // update start for next iteration
      const last = pageResults[pageResults.length - 1];
      start = last?.startIndex || start + 10;

      if (!pageResults[0]?.hasMoreResults) break;
    }
    const limited = results.slice(0, 5);

    res.json({ success: true, count: limited.length, results: limited });
  } catch (err) {
    console.error("Scrape error:", err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
});

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
