/**
 * Generates 20 QR code images for testing.
 *
 * Each image contains:
 *   - A QR code on a dark background (light modules)
 *   - Text below: "rank = X  id = Y"
 *
 * QR URL format:
 *   https://t.me/yaeducation_bot?start=n_191849__c_12054__v_<base64_payload>
 *
 * Where base64_payload = btoa("id=${id * 1234 + 7654}&rank=${id * rank * 7654 + 1234}")
 *
 * Usage:
 *   node scripts/generate-qr-samples.mjs
 */

import { createCanvas } from "canvas";
import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "qr-samples");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TOTAL_IMAGES = 20;
const RANKS = [0, 1, 2, 3];

const IMAGE_WIDTH = 480;
const QR_SIZE = 360; // QR code area (square)
const QR_MARGIN = 2; // QR quiet zone in modules
const TEXT_AREA_HEIGHT = 60;
const IMAGE_HEIGHT = QR_SIZE + TEXT_AREA_HEIGHT + 40; // 40 = top padding + gap

const BG_COLOR = "#1a1a2e"; // dark background
const FG_COLOR = "#e0e0ff"; // light QR modules
const TEXT_COLOR = "#c0c0e0";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildUrl(id, rank) {
  const payload = `id=${id * 1234 + 7654}&rank=${id * rank * 7654 + 1234}`;
  const base64 = Buffer.from(payload).toString("base64");
  return `https://t.me/yaeducation_bot?start=n_191849__c_12054__v_${base64}`;
}

// ---------------------------------------------------------------------------
// Generate a single image
// ---------------------------------------------------------------------------

async function generateImage(id, rank, index) {
  const url = buildUrl(id, rank);

  // Render QR to a data-URL-less buffer via the canvas renderer
  const qrCanvas = createCanvas(QR_SIZE, QR_SIZE);
  await QRCode.toCanvas(qrCanvas, url, {
    width: QR_SIZE,
    margin: QR_MARGIN,
    color: { dark: FG_COLOR, light: BG_COLOR },
    errorCorrectionLevel: "M",
  });

  // Compose final image
  const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  // Draw QR centred horizontally with some top padding
  const qrX = (IMAGE_WIDTH - QR_SIZE) / 2;
  const qrY = 20;
  ctx.drawImage(qrCanvas, qrX, qrY);

  // Label text
  const label = `rank = ${rank}  id = ${id}`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, IMAGE_WIDTH / 2, qrY + QR_SIZE + 16);

  // Write PNG
  const filename = `qr_${String(index + 1).padStart(2, "0")}_rank${rank}_id${id}.png`;
  const outPath = path.join(OUTPUT_DIR, filename);
  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(outPath, buf);

  return { filename, url, id, rank };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Generating ${TOTAL_IMAGES} QR images into ${OUTPUT_DIR}\n`);

  const results = [];

  for (let i = 0; i < TOTAL_IMAGES; i++) {
    const rank = RANKS[i % RANKS.length]; // cycle 0,1,2,3,0,1,2,3,...
    const id = randomInt(1, 99999);
    const info = await generateImage(id, rank, i);
    results.push(info);
    console.log(`  [${String(i + 1).padStart(2, " ")}/${TOTAL_IMAGES}] ${info.filename}`);
  }

  console.log(`\nDone. ${results.length} images saved to ${OUTPUT_DIR}`);

  // Print summary table
  console.log("\n--- Summary ---");
  console.log("idx | rank | id    | filename");
  console.log("----|------|-------|------------------------------------------");
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(
      `${String(i + 1).padStart(3, " ")} | ${r.rank}    | ${String(r.id).padStart(5, " ")} | ${r.filename}`
    );
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
