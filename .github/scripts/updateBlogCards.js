// .github/scripts/updateBlogCards.js
import fs from "fs";
import Parser from "rss-parser";

const OUTPUT_FILES = ["blog-card1.svg", "blog-card2.svg", "blog-card3.svg"]; // latest three posts
const WIDTH = 500;  // fits 3 cards in a row
const HEIGHT = 90;  // slimmer height for aesthetics

function escapeForXML(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

// Better wrapping — avoids breaking unless necessary
function wrapTitle(title, maxCharsPerLine = 50, maxLines = 2) {
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
    .map((line, i) => `<tspan x="16" dy="${i === 0 ? 0 : 18}">${line}</tspan>`)
    .join("");
  const more = truncated ? "…" : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Blog card">
  <defs>
    <!-- Frosted glass blur -->
    <filter id="glassBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>

    <!-- Soft shadow -->
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Main frosted glass background -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="14" ry="14" 
        fill="rgba(255, 255, 255, 0.08)" 
        stroke="rgba(255, 255, 255, 0.18)" 
        stroke-width="1"
        filter="url(#shadow)"/>

  <!-- Light overlay for depth -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="14" ry="14"
        fill="rgba(255, 255, 255, 0.04)" 
        filter="url(#glassBlur)"/>

  <!-- Title text -->
  <g transform="translate(0, 30)">
    <text x="16" y="0" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="600" fill="rgba(255,255,255,0.95)">
      ${tspans}${more}
    </text>
    <text x="16" y="${HEIGHT - 14}" font-family="Inter, Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.65)">
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

  console.log("Blog cards generated (Apple Music style):", OUTPUT_FILES.join(", "));
})().catch((err) => {
  console.error("Failed to generate blog cards:", err);
  process.exit(1);
});
