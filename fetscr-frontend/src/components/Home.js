// src/components/Home.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState([]);
  const navigate = useNavigate();

  // Load recent queries from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("fetscr_recent_queries");
    if (stored) {
      try {
        setRecentQueries(JSON.parse(stored));
      } catch {
        setRecentQueries([]);
      }
    }
  }, []);

  const handleSearch = async (e, customQuery) => {
    if (e) e.preventDefault();

    const finalQuery = customQuery || query.trim();
    if (!finalQuery) {
      alert("Please enter a query");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("fetscr_token");
      if (!token) {
        alert("Please login to scrape data.");
        navigate("/login");
        return;
      }

      const res = await fetch("http://localhost:5000/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Attach token
        },
        body: JSON.stringify({ query: finalQuery, pages: 3 }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Scrape failed");
      }

      // Save results in sessionStorage
      sessionStorage.setItem(
        "fetscr_results",
        JSON.stringify({ results: data.results, query: finalQuery })
      );

      // Update recent queries (keep only last 5)
      const newRecent = [
        { query: finalQuery, count: data.results.length, time: new Date().toISOString() },
        ...recentQueries.filter((r) => r.query !== finalQuery),
      ].slice(0, 5);

      setRecentQueries(newRecent);
      localStorage.setItem("fetscr_recent_queries", JSON.stringify(newRecent));

      // Navigate to results page
      navigate("/results", { state: { results: data.results, query: finalQuery } });
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container" id="home">
      <h1 className="main-heading">FETSCR</h1>
      <p className="subtitle">Scraping Data Made Simple</p>

      <form className="search-box" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="Enter your query..."
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {recentQueries.length > 0 && (
        <div className="recent-queries">
          <h3>Recently Scraped</h3>
          <ul>
            {recentQueries.map((r, i) => (
              <li key={i}>
                <button
                  className="recent-query-btn"
                  onClick={() => handleSearch(null, r.query)}
                >
                  {r.query}
                </button>
                <span className="recent-meta">
                  ({r.count} results, {new Date(r.time).toLocaleString()})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
