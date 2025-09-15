import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Open SQLite database
export async function openDB() {
  return open({
    filename: "./fetscr.db",
    driver: sqlite3.Database
  });
}

// Initialize tables
export async function initDB() {
  const db = await openDB();

  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  // Scraped queries table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scraped_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      query TEXT,
      result_count INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  return db;
}
