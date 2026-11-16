// Generates the app icon from real Old Standard TT outlines (no font needed at render time),
// then rasterizes it with macOS `sips`.
// Provenance: authored vector, no generated raster. Run: npm run icons
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import opentype from "opentype.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "icons");
mkdirSync(out, { recursive: true });

const fontPath = join(root, "node_modules/@fontsource/old-standard-tt/files/old-standard-tt-latin-700-normal.woff");
const buf = readFileSync(fontPath);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const VERMILION = "#B5321F";
const CREAM = "#F2ECDF";

function iconSvg(size, { inset }) {
  const s = size;
  const pad = inset ? s * 0.12 : 0; // maskable safe zone handled by padding the frame
  const frame = s * 0.085 + pad;
  const inner = s - frame * 2;
  const probe = font.getPath("Aa", 0, 0, 100).getBoundingBox();
  const fontSize = (100 * inner * 0.62) / (probe.x2 - probe.x1);
  const path = font.getPath("Aa", 0, 0, fontSize);
  const bb = path.getBoundingBox();
  const w = bb.x2 - bb.x1;
  const h = bb.y2 - bb.y1;
  const dx = (s - w) / 2 - bb.x1;
  const dy = (s - h) / 2 - bb.y1 + s * 0.01;
  const glyphs = font.getPath("Aa", dx, dy, fontSize).toPathData(2);
  const rule1 = s * 0.012;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
<rect width="${s}" height="${s}" fill="${VERMILION}"/>
<rect x="${frame}" y="${frame}" width="${s - frame * 2}" height="${s - frame * 2}" fill="none" stroke="${CREAM}" stroke-width="${rule1 * 2}"/>
<rect x="${frame + rule1 * 4}" y="${frame + rule1 * 4}" width="${s - (frame + rule1 * 4) * 2}" height="${s - (frame + rule1 * 4) * 2}" fill="none" stroke="${CREAM}" stroke-width="${rule1}"/>
<path d="${glyphs}" fill="${CREAM}"/>
</svg>`;
}

const variants = [
  { name: "icon-512", size: 512, inset: true },
  { name: "icon-192", size: 192, inset: true },
  { name: "apple-touch-icon", size: 180, inset: false },
];
for (const v of variants) {
  const svgFile = join(out, `${v.name}.svg`);
  writeFileSync(svgFile, iconSvg(v.size, v));
  execFileSync("sips", ["-s", "format", "png", svgFile, "--out", join(out, `${v.name}.png`)], { stdio: "ignore" });
}
writeFileSync(join(out, "favicon.svg"), iconSvg(64, { inset: false }));
console.log("icons written to public/icons");
