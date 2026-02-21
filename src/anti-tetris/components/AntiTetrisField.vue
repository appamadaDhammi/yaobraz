<template>
  <div class="GameField" ref="container">
    <canvas ref="canvas"></canvas>
    
    <div v-if="state.hintVisible" class="Hint">
      <div class="Hint__arrow">↑</div>
      <div class="Hint__text">
        <span>{{ Settings.HINT_TEXT }}</span>
        <span>{{ Settings.HINT_TEXT }}</span>
      </div>
      <div class="Hint__arrow">↑</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { AntiTetrisLoop } from '../GameLoop';
import type { GameState } from '../GameLoop';
import { InputHandler } from '../../core/InputHandler';
import * as Settings from '../Settings';
import { type FigureColor } from '../Settings';

const textureImages: Record<string, HTMLImageElement> = {};

const preloadTextures = () => {
  Object.entries(Settings.TEXTURE_MAP).forEach(([color, path]) => {
    const img = new Image();
    img.src = path;
    textureImages[color] = img;
  });
};

const container = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);

let loop: AntiTetrisLoop;
let input: InputHandler;
let rafId: number;

const state = reactive<GameState>({
  score: 0,
  level: 1,
  timer: Settings.GAME_DURATION,
  targetShape: 'I',
  targetColor: 'white',
  isGameOver: false,
  hintVisible: true,
});

const emit = defineEmits(['update-state']);

onMounted(() => {
  preloadTextures();
  if (!canvas.value || !container.value) return;

  const rect = container.value.getBoundingClientRect();
  const width = Settings.FIELD_WIDTH;
  const dynamicScale = rect.width / width;
  const height = rect.height / dynamicScale;

  canvas.value.width = rect.width;
  canvas.value.height = rect.height;

  const isSlowInit = window.location.hash.includes('slowInit=1');
  loop = new AntiTetrisLoop(width, height, isSlowInit);
  input = new InputHandler(canvas.value, dynamicScale);

  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;

  const frame = (time: number) => {
    const inputState = input.getState();
    loop.handleInput(inputState);
    loop.step(time);
    
    // Update local state and emit
    const loopState = loop.getState();
    Object.assign(state, loopState);
    emit('update-state', { ...loopState });

    render(ctx, width, height, dynamicScale);
    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
});

onUnmounted(() => {
  cancelAnimationFrame(rafId);
});

const render = (ctx: CanvasRenderingContext2D, _worldWidth: number, _worldHeight: number, scale: number) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Use passed scale
  
  // Flip Y axis
  ctx.save();
  ctx.translate(0, ctx.canvas.height);
  ctx.scale(1, -1);

  for (const figure of loop.getFigures()) {
    const pos = figure.body.getPosition();
    const angle = figure.body.getAngle();
    
    ctx.save();
    ctx.translate(pos.x * scale, pos.y * scale);
    ctx.rotate(angle);

    // Draw fixtures
    for (let f = figure.body.getFixtureList(); f; f = f.getNext()) {
      const shape = f.getShape() as any;
      ctx.beginPath();
      // Assume polygon for now
      const vertices = shape.m_vertices;
      ctx.moveTo(vertices[0].x * scale, vertices[0].y * scale);
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x * scale, vertices[i].y * scale);
      }
      ctx.closePath();

      const img = textureImages[figure.color as FigureColor];
      if (img && img.complete) {
        // Find the bounding box of the fixture to draw the texture
        const verts = shape.m_vertices;
        let minX = verts[0].x;
        let minY = verts[0].y;
        for (let i = 1; i < verts.length; i++) {
          minX = Math.min(minX, verts[i].x);
          minY = Math.min(minY, verts[i].y);
        }
        ctx.drawImage(img, minX * scale, minY * scale, 1 * scale, 1 * scale);
      } else {
        ctx.fillStyle = Settings.TEXTURE_COLORS[figure.color as FigureColor] || '#fff';
        ctx.fill();
      }
    }

    // Coin - draw once per figure at the center of the body
    if (figure.hasCoin) {
      ctx.beginPath();
      ctx.arc(0, 0, 0.3 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  ctx.restore();
};
</script>

<style scoped>
.GameField {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #000;
}

canvas {
  display: block;
}

.Hint {
  position: absolute;
  top: 15%;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  pointer-events: none;
  color: #9487DF;
  opacity: 0.8;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 5cqw;
}

.Hint__arrow {
  font-size: 2.5rem;
  animation: bounce 1.5s infinite ease-in-out;
}

.Hint__text {
  display: flex;
  gap: 1rem;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}
</style>
