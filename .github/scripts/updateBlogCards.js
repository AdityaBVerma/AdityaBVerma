// .github/scripts/updateBlogCards.js
import fs from "fs";
import Parser from "rss-parser";

const OUTPUT_FILES = ["blog-card1.svg", "blog-card2.svg", "blog-card3.svg"]; // latest three posts
const WIDTH = 400;  // smaller width to fit 3 in same row space for 2
const HEIGHT = 100; // reduced height

function escapeForXML(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapTitle(title, maxCharsPerLine = 38, maxLines = 2) {
  const words = String(title).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = (cur ? cur + " " : "") + w;
    if (test.length > maxCharsPerLine) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = test;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  const usedWords = lines.join(" ").split(/\s+/).length;
  const totalWords = words.length;
  const truncated = usedWords < totalWords;
  return { lines, truncated };
}

function svgCard({ title }) {
  const safeTitle = escapeForXML(title || "Untitled Post");
  const { lines, truncated } = wrapTitle(safeTitle);
  const tspans = lines
    .map((line, i) => `<tspan x="16" dy="${i === 0 ? 0 : 20}">${line}</tspan>`)
    .join("");
  const more = truncated ? "…" : "";

 return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Blog card">
  <defs>
    <!-- Background blur filter -->
    <filter id="glassBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>

    <!-- Drop shadow -->
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1" stdDeviation="4" flood-opacity="0.25"/>
    </filter>

    <!-- Gradient for bottom accent -->
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#16a34a" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0.8"/>
    </linearGradient>
  </defs>

  <!-- Transparent glass background -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="16" ry="16" 
        fill="rgba(255, 255, 255, 0.08)" 
        stroke="rgba(255, 255, 255, 0.18)" 
        stroke-width="1"
        filter="url(#shadow)"/>

  <!-- Inner overlay for blur (glass effect) -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="16" ry="16"
        fill="url(#accentGradient)" fill-opacity="0.05" filter="url(#glassBlur)"/>

  <!-- Bottom accent bar -->
  <rect x="0" y="${HEIGHT - 4}" width="${WIDTH}" height="4" fill="url(#accentGradient)"/>

  <!-- Title -->
  <g transform="translate(0, 36)">
    <text x="16" y="0" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" fill="rgba(255,255,255,0.95)">
      ${tspans}${more}
    </text>
    <text x="16" y="${HEIGHT - 24}" font-family="Inter, Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.7)">
      Latest from Hashnode • updates every 6h
    </text>
  </g>
</svg>`;
}

(async function main() {
  const parser = new Parser();
  const xml = fs.readFileSync("rss.xml", "utf8");
  const feed = await parser.parseString(xml);
  const items = (feed.items || []).slice(0, 3); // get 3 latest posts

  for (let i = 0; i < OUTPUT_FILES.length; i++) {
    const post = items[i];
    let title = post?.title || "Untitled Post";
    const svg = svgCard({ title });
    fs.writeFileSync(OUTPUT_FILES[i], svg, "utf8");
  }

  console.log("Blog cards generated (3 posts, no thumbnails):", OUTPUT_FILES.join(", "));
})().catch((err) => {
  console.error("Failed to generate blog cards:", err);
  process.exit(1);
});
