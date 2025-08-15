// .github/scripts/updateBlogCards.js
import fs from "fs";
import Parser from "rss-parser";

const FEED_URL = "https://adityabverma.hashnode.dev/rss.xml";
const OUTPUT_FILES = ["blog-card1.svg", "blog-card2.svg"]; // latest two posts
const WIDTH = 600;
const HEIGHT = 150;

// Escape text for SVG/XML
function escapeForXML(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

// Simple word-wrap for SVG <text> using <tspan>
function wrapTitle(title, maxCharsPerLine = 42, maxLines = 3) {
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

function svgCard({ title, imageURL }) {
  const safeTitle = escapeForXML(title || "Untitled Post");
  const { lines, truncated } = wrapTitle(safeTitle);

  // Build tspans for wrapped title
  const tspans = lines
    .map((line, i) => {
      const dy = i === 0 ? 0 : 22; // line height
      return `<tspan x="150" dy="${dy}">${line}</tspan>`;
    })
    .join("");

  const more = truncated ? "…" : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Blog card">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.25"/>
    </filter>
    <clipPath id="thumbClip">
      <rect x="16" y="16" width="118" height="118" rx="12" ry="12"/>
    </clipPath>
  </defs>

  <!-- Card background -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="16" ry="16" fill="#0f1115" filter="url(#shadow)"/>
  <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="#16a34a"/>
  
  <!-- Thumbnail -->
  <image href="${imageURL}" x="16" y="16" width="118" height="118" clip-path="url(#thumbClip)" preserveAspectRatio="xMidYMid slice"/>
  <rect x="16" y="16" width="118" height="118" rx="12" ry="12" fill="none" stroke="#1f2937" stroke-width="1"/>

  <!-- Title -->
  <g transform="translate(0, 42)">
    <text x="150" y="0" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#e5e7eb">
      ${tspans}${more}
    </text>
    <text x="150" y="64" font-family="Inter, Arial, sans-serif" font-size="12" fill="#9ca3af">
      Latest from Hashnode • updates every 6h
    </text>
  </g>
</svg>`;
}

function firstImageFromHTML(html = "") {
  // Try to grab the first <img src="...">
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

(async function main() {
  const parser = new Parser({ headers: { "User-Agent": "github-action" } });
  const feed = await parser.parseURL(FEED_URL);

  // Get the latest two items
  const items = (feed.items || []).slice(0, 2);

  for (let i = 0; i < OUTPUT_FILES.length; i++) {
    const post = items[i];
    let title = post?.title || "Untitled Post";
    let imageURL =
      firstImageFromHTML(post?.["content:encoded"] || post?.content || "") ||
      post?.enclosure?.url ||
      "https://via.placeholder.com/118?text=Blog";

    const svg = svgCard({ title, imageURL });
    fs.writeFileSync(OUTPUT_FILES[i], svg, "utf8");
  }

  console.log("Blog cards generated:", OUTPUT_FILES.join(", "));
})().catch((err) => {
  console.error("Failed to generate blog cards:", err);
  process.exit(1);
});
