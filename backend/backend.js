import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { initDB } from "./database.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CX = process.env.CX;
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// Initialize DB
let db;
initDB().then((database) => {
  db = database;
  console.log("✅ Database initialized");
});

// ----------------- User Signup -----------------
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: "Missing fields" });

    const hashed = await bcrypt.hash(password, 10);
    await db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashed]);
    res.json({ success: true, message: "User registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- User Login -----------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(400).json({ success: false, error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ success: false, error: "Invalid credentials" });

    // Create JWT token
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- Middleware to check JWT -----------------
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}

// ----------------- Scrape Endpoint -----------------
async function scrapeGoogle(query, startIndex = 1) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&start=${startIndex}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google API error ${res.status}`);
  const data = await res.json();
  if (!data.items || !data.items.length) return [];

  let nextStartIndex = 1;
  if (data.queries?.nextPage?.[0]) nextStartIndex = data.queries.nextPage[0].startIndex;
  const hasMoreResults = nextStartIndex <= 100;

  return data.items.map(item => ({
    name: (item.title || "").split(" - ")[0] || null,
    title: (item.title || "").split(" - ").slice(1).join(" - ") || null,
    link: item.link || null,
    snippet: item.snippet || null,
    image: item.pagemap?.cse_thumbnail?.[0]?.src || null,
    startIndex: nextStartIndex,
    hasMoreResults
  }));
}

app.post("/scrape", authenticate, async (req, res) => {
  try {
    const { query, pages = 1 } = req.body;
    if (!query || !query.trim()) return res.status(400).json({ success: false, error: "Missing query" });

    const maxPages = Math.min(Number(pages) || 1, 10);
    let start = 1;
    const results = [];

    for (let i = 0; i < maxPages; i++) {
      const pageResults = await scrapeGoogle(query, start);
      if (!pageResults.length) break;
      results.push(...pageResults);
      start = pageResults[pageResults.length - 1]?.startIndex || start + 10;
      if (!pageResults[0]?.hasMoreResults) break;
    }

    const limited = results.slice(0, 5);

    // Save scraped query to DB
    await db.run(
      "INSERT INTO scraped_queries (user_id, query, result_count) VALUES (?, ?, ?)",
      [req.user.id, query, limited.length]
    );

    res.json({ success: true, count: limited.length, results: limited });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- Get user's scraped history -----------------
app.get("/my-scrapes", authenticate, async (req, res) => {
  try {
    const history = await db.all("SELECT * FROM scraped_queries WHERE user_id = ? ORDER BY timestamp DESC", [req.user.id]);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
