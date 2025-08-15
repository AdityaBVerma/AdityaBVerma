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
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Card background -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="12" ry="12" fill="#0f1115" filter="url(#shadow)"/>
  <rect x="0" y="${HEIGHT - 4}" width="${WIDTH}" height="4" fill="#16a34a"/>

  <!-- Title -->
  <g transform="translate(0, 36)">
    <text x="16" y="0" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" fill="#e5e7eb">
      ${tspans}${more}
    </text>
    <text x="16" y="${HEIGHT - 24}" font-family="Inter, Arial, sans-serif" font-size="11" fill="#9ca3af">
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
