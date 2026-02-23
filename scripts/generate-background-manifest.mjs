import fs from "node:fs";
import path from "node:path";

const videosDir = path.resolve("public/videos");
const thumbsDir = path.resolve("public/thumbs");
const outFile = path.resolve("public/backgrounds.json");

const videoExts = new Set([".mp4", ".mov", ".webm"]);
const thumbExts = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const titleize = (name) =>
  name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const listFiles = (dir, exts) => {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((n) => exts.has(path.extname(n).toLowerCase()));
};

// Map baseName -> best match
const videos = listFiles(videosDir, videoExts);
const thumbs = listFiles(thumbsDir, thumbExts);

const videoMap = new Map();
for (const file of videos) {
  const base = path.basename(file, path.extname(file));
  videoMap.set(base, file);
}

const thumbMap = new Map();
for (const file of thumbs) {
  const base = path.basename(file, path.extname(file));
  thumbMap.set(base, file);
}

// Prefer items that have BOTH video + thumb (so UI never missing)
const bases = Array.from(
  new Set([...videoMap.keys(), ...thumbMap.keys()]),
).sort((a, b) => a.localeCompare(b));

const items = bases
  .map((base) => {
    const v = videoMap.get(base);
    const t = thumbMap.get(base);
    if (!v || !t) return null;
    return {
      key: base,
      label: titleize(base),
      videoSrc: `/videos/${v}`,
      thumbSrc: `/thumbs/${t}`,
    };
  })
  .filter(Boolean);

fs.writeFileSync(outFile, JSON.stringify(items, null, 2), "utf8");
console.log(`✅ Wrote ${items.length} backgrounds -> ${outFile}`);
