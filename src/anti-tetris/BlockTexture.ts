/**
 * Dynamic pixel-art block texture generator with rotation-aware lighting.
 *
 * Generates a 1×1 sub-cell texture where edge shading is computed from
 * the figure's current rotation angle and a fixed light source at the
 * screen's top-left corner.
 *
 * Edge width = 1/6 of block size.
 *
 * The texture canvas uses standard image coordinates (Y-down).
 * When drawn into the game's Y-flipped canvas context, the image is
 * vertically mirrored — this is accounted for in sub-cell placement.
 */

import { S as Settings } from './Settings';

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


/** 
 * Map a dot-product value to a colour:
 * positive → l (lighten)
 * near 0 → c (base color)
 * slightly negative → d (darken)
 * very negative → D (darkest)
 */
function edgeColor(base: string, dot: number): string {
  if (dot > 0.1) return lighten(base, dot * Settings.SHADOW_LIGHTEN_FACTOR); // l
  if (dot < -0.1) {
    if (dot < -0.7) return darken(base, Math.abs(dot) * Settings.SHADOW_DARKEN_FACTOR * 1.5); // D
    return darken(base, Math.abs(dot) * Settings.SHADOW_DARKEN_FACTOR); // d
  }
  return base; // c
}

// ---------------------------------------------------------------------------
// Sub-cell rendering
// ---------------------------------------------------------------------------

/**
 * Draw one sub-cell of a block with dynamically computed edge shading
 * based on dot products with the light direction.
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

  // 1. Base fill (center 'c')
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, size, size);

  // 2. Edge strips
  const topC = edgeColor(baseColor, topDot);
  const bottomC = edgeColor(baseColor, bottomDot);
  const leftC = edgeColor(baseColor, leftDot);
  const rightC = edgeColor(baseColor, rightDot);

  // Physics top → texture bottom strip (Y-flip)
  ctx.fillStyle = topC;
  ctx.fillRect(x, y + size - edge, size, edge);

  // Physics bottom → texture top strip
  ctx.fillStyle = bottomC;
  ctx.fillRect(x, y, size, edge);

  // Physics left → texture left strip
  ctx.fillStyle = leftC;
  ctx.fillRect(x, y, edge, size);

  // Physics right → texture right strip
  ctx.fillStyle = rightC;
  ctx.fillRect(x + size - edge, y, edge, size);

  // 3. Corners - average of the two adjacent edge dot products
  // Physics TL → texture bottom-left
  ctx.fillStyle = edgeColor(baseColor, (topDot + leftDot) / 2);
  ctx.fillRect(x, y + size - edge, edge, edge);

  // Physics TR → texture bottom-right
  ctx.fillStyle = edgeColor(baseColor, (topDot + rightDot) / 2);
  ctx.fillRect(x + size - edge, y + size - edge, edge, edge);

  // Physics BL → texture top-left
  ctx.fillStyle = edgeColor(baseColor, (bottomDot + leftDot) / 2);
  ctx.fillRect(x, y, edge, edge);

  // Physics BR → texture top-right
  ctx.fillStyle = edgeColor(baseColor, (bottomDot + rightDot) / 2);
  ctx.fillRect(x + size - edge, y, edge, edge);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a dynamic block texture for a figure at the given rotation angle.
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

  const mixedInfo = Settings.MIXED_COLOR_MAP[colorKey];
  let baseColor: string;

  if (mixedInfo) {
    // Use the average / primary color for a 1×1 cell — pick topLeft as representative
    baseColor = mixedInfo.topLeft;
  } else {
    baseColor = Settings.COLOR_PALETTE[colorKey] || '#FFFFFF';
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

  // Single 1×1 sub-cell covering the full block
  drawShadedSubCell(ctx, 0, 0, size, baseColor, topDot, rightDot, bottomDot, leftDot);

  return canvas;
}
