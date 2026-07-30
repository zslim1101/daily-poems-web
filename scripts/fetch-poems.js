#!/usr/bin/env node
/**
 * Fetch public-domain poems from PoetryDB (https://poetrydb.org) and merge
 * short excerpts into data/poems.json.
 *
 * Usage:  node scripts/fetch-poems.js [targetTotal]
 * Example: node scripts/fetch-poems.js 400
 *
 * Every author served by PoetryDB is public domain (Project Gutenberg
 * sourced). We keep a 4-6 line excerpt per poem so the card stays readable.
 */

const fs = require("fs");
const path = require("path");

const POEMS_PATH = path.join(__dirname, "..", "data", "poems.json");
const TARGET_TOTAL = Number(process.argv[2]) || 400;
const MAX_PER_AUTHOR = 8;   // keep the daily rotation varied
const EXCERPT_MIN = 4;
const EXCERPT_MAX = 6;
const MAX_LINE_LEN = 78;    // skip prose-like or overlong lines

function get(url) {
  return fetch(url, { headers: { "User-Agent": "daily-poems-web" } })
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status + " " + url);
      return r.json();
    });
}

// Stanza numbers, section markers and speaker labels that aren't verse.
function isMarker(line) {
  return /^[IVXLCDM]+\.?$/.test(line) ||        // I, XIII, IV.
    /^\d+\.?$/.test(line) ||                    // 1, 2.
    /^[A-Z][A-Z\s.'-]{5,}$/.test(line) ||       // LEANDER.  PART ONE
    /^(part|canto|book|stanza|scene|act)\b/i.test(line);
}

// Trim a poem down to a clean opening excerpt.
function excerpt(lines) {
  const cleaned = lines
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 0 && !isMarker(l));

  if (cleaned.length < EXCERPT_MIN) return null;
  if (cleaned.some((l) => l.length > MAX_LINE_LEN)) return null;

  // Prefer ending on punctuation so the excerpt doesn't cut mid-thought.
  for (let n = EXCERPT_MAX; n >= EXCERPT_MIN; n--) {
    if (cleaned.length >= n && /[.!?;:,—]$/.test(cleaned[n - 1])) {
      return cleaned.slice(0, n);
    }
  }
  return cleaned.slice(0, Math.min(EXCERPT_MAX, cleaned.length));
}

function normalise(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function main() {
  const existing = JSON.parse(fs.readFileSync(POEMS_PATH, "utf8"));
  const seen = new Set(existing.map((p) => normalise(p.title)));
  const perAuthor = {};
  existing.forEach((p) => {
    perAuthor[p.author] = (perAuthor[p.author] || 0) + 1;
  });

  console.log("starting with", existing.length, "poems");

  const { authors } = await get("https://poetrydb.org/author");
  // Shuffle so repeat runs pull from different corners of the corpus.
  authors.sort(() => Math.random() - 0.5);

  const added = [];

  for (const author of authors) {
    if (existing.length + added.length >= TARGET_TOTAL) break;
    if ((perAuthor[author] || 0) >= MAX_PER_AUTHOR) continue;

    let poems;
    try {
      poems = await get(
        "https://poetrydb.org/author/" + encodeURIComponent(author)
      );
    } catch (e) {
      console.warn("skip", author, "-", e.message);
      continue;
    }
    if (!Array.isArray(poems)) continue;

    // Shortest first: tighter poems make better daily cards.
    poems.sort((a, b) => a.lines.length - b.lines.length);

    for (const poem of poems) {
      if (existing.length + added.length >= TARGET_TOTAL) break;
      if ((perAuthor[author] || 0) >= MAX_PER_AUTHOR) break;

      const key = normalise(poem.title);
      if (seen.has(key)) continue;

      const lines = excerpt(poem.lines);
      if (!lines) continue;

      seen.add(key);
      perAuthor[author] = (perAuthor[author] || 0) + 1;
      added.push({ title: poem.title.trim(), author, lines });
    }
  }

  const merged = existing.concat(added);
  fs.writeFileSync(POEMS_PATH, JSON.stringify(merged, null, 2) + "\n", "utf8");

  console.log("added", added.length, "poems ->", merged.length, "total");
  const byAuthor = {};
  added.forEach((p) => { byAuthor[p.author] = (byAuthor[p.author] || 0) + 1; });
  console.log("new authors:", Object.keys(byAuthor).length);
}

main().catch((e) => {
  console.error("failed:", e.message);
  process.exit(1);
});
