/**
 * Dynamic pixel-art block texture generator with rotation-aware lighting.
 *
 * Generates a 2×2 sub-cell texture where edge shading is computed from
 * the figure's current rotation angle and a fixed light source at the
 * screen's top-left corner.
 *
 * Edge width = 1/6 of block size.
 *
 * The texture canvas uses standard image coordinates (Y-down).
 * When drawn into the game's Y-flipped canvas context, the image is
 * vertically mirrored — this is accounted for in sub-cell placement.
 */

import * as Settings from './Settings';
import type { FigureColor } from './Settings';

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [r, g, b].map(c => clamp(c).toString(16).padStart(2, '0')).join('');
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

/** Map a dot-product value to a colour: positive → lighten, negative → darken. */
function edgeColor(base: string, dot: number): string {
  if (dot > 0) return lighten(base, dot * Settings.SHADOW_LIGHTEN_FACTOR);
  if (dot < 0) return darken(base, Math.abs(dot) * Settings.SHADOW_DARKEN_FACTOR);
  return base;
}

// ---------------------------------------------------------------------------
// Sub-cell rendering
// ---------------------------------------------------------------------------

/**
 * Draw one sub-cell of a block with dynamically computed edge shading.
 *
 * Dot values are the dot products of the physics edge normal (rotated by
 * the figure angle) with the light-source direction. Positive = lit,
 * negative = shadowed.
 *
 * Mapping between physics edges and texture-canvas positions accounts
 * for the game canvas Y-flip:
 *   physics top    → texture bottom strip
 *   physics bottom → texture top strip
 *   physics left   → texture left strip   (no X flip)
 *   physics right  → texture right strip
 */
function drawShadedSubCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  baseColor: string,
  topDot: number,
  rightDot: number,
  bottomDot: number,
  leftDot: number,
) {
  const edge = Math.max(1, Math.round(size / 6));

  // 1. Base fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, size, size);

  // 2. Edge strips (physics direction → texture position)

  // Physics top → texture bottom strip
  ctx.fillStyle = edgeColor(baseColor, topDot);
  ctx.fillRect(x, y + size - edge, size, edge);

  // Physics bottom → texture top strip
  ctx.fillStyle = edgeColor(baseColor, bottomDot);
  ctx.fillRect(x, y, size, edge);

  // Physics left → texture left strip
  ctx.fillStyle = edgeColor(baseColor, leftDot);
  ctx.fillRect(x, y, edge, size);

  // Physics right → texture right strip
  ctx.fillStyle = edgeColor(baseColor, rightDot);
  ctx.fillRect(x + size - edge, y, edge, size);

  // 3. Corner intersections (average of two adjacent edges)

  // Physics top-left → texture bottom-left
  ctx.fillStyle = edgeColor(baseColor, (topDot + leftDot) / 2);
  ctx.fillRect(x, y + size - edge, edge, edge);

  // Physics top-right → texture bottom-right
  ctx.fillStyle = edgeColor(baseColor, (topDot + rightDot) / 2);
  ctx.fillRect(x + size - edge, y + size - edge, edge, edge);

  // Physics bottom-left → texture top-left
  ctx.fillStyle = edgeColor(baseColor, (bottomDot + leftDot) / 2);
  ctx.fillRect(x, y, edge, edge);

  // Physics bottom-right → texture top-right
  ctx.fillStyle = edgeColor(baseColor, (bottomDot + rightDot) / 2);
  ctx.fillRect(x + size - edge, y, edge, edge);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a dynamic block texture for a figure at the given rotation angle.
 *
 * Call once per figure per frame — reuse across all fixtures of that figure.
 *
 * @param colorKey  Figure colour key (e.g. 'blue', 'red-yellow')
 * @param angle     Current physics body angle (radians)
 * @param size      Texture size in pixels (= 1 physics unit × scale)
 * @returns         An HTMLCanvasElement ready for drawImage
 */
export function generateDynamicBlockTexture(
  colorKey: string,
  angle: number,
  size: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Determine sub-cell colours (screen-space quadrant positions)
  const mixedInfo = Settings.MIXED_COLOR_MAP[colorKey];
  let screenTL: string, screenTR: string, screenBL: string, screenBR: string;

  if (mixedInfo) {
    screenTL = mixedInfo.topLeft;
    screenTR = mixedInfo.topRight;
    screenBL = mixedInfo.bottomLeft;
    screenBR = mixedInfo.bottomRight;
  } else {
    const c = Settings.COLOR_PALETTE[colorKey] || '#FFFFFF';
    screenTL = screenTR = screenBL = screenBR = c;
  }

  // --- Compute edge dot products ---
  // Light source is driven by Settings.SHADOW_LIGHT_ANGLE
  // Note: Physics Y is up, X is right.
  const lx = Math.cos(Settings.SHADOW_LIGHT_ANGLE);
  const ly = -Math.sin(Settings.SHADOW_LIGHT_ANGLE); // Negative because angle assumes Y-down in screen coords, but physics is Y-up

  const sinA = Math.sin(angle);
  const cosA = Math.cos(angle);

  // Rotated edge normals dotted with light direction
  const topDot    = (-sinA) * lx + ( cosA) * ly; // normal (0, 1) rotated
  const rightDot  = ( cosA) * lx + ( sinA) * ly; // normal (1, 0) rotated
  const bottomDot = ( sinA) * lx + (-cosA) * ly; // normal (0,-1) rotated
  const leftDot   = (-cosA) * lx + (-sinA) * ly; // normal (-1,0) rotated

  // --- Draw 2×2 sub-cells ---
  // Texture canvas is Y-down; game canvas is Y-flipped.
  // texture (0,0) → screen bottom-left;  texture (0,half) → screen top-left
  //
  // So: screen-TL → texture (0, half)
  //     screen-TR → texture (half, half)
  //     screen-BL → texture (0, 0)
  //     screen-BR → texture (half, 0)

  const half = size / 2;

  drawShadedSubCell(ctx, 0,    0,    half, screenBL, topDot, rightDot, bottomDot, leftDot);
  drawShadedSubCell(ctx, half, 0,    half, screenBR, topDot, rightDot, bottomDot, leftDot);
  drawShadedSubCell(ctx, 0,    half, half, screenTL, topDot, rightDot, bottomDot, leftDot);
  drawShadedSubCell(ctx, half, half, half, screenTR, topDot, rightDot, bottomDot, leftDot);

  return canvas;
}
