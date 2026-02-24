<template>
  <div class="GameField" ref="container" @pointerdown="handlePointerDown">
    <canvas ref="canvas"></canvas>
    
    <div v-if="state.status === 'WAITING'" class="StartOverlay">
      <div class="StartOverlay__content">
        {{ Settings.START_TEXT }}
      </div>
    </div>
    
    <div v-if="state.hintVisible && state.tutorialActive" class="Hint">
      <div class="Hint__arrow">↑</div>
      <div class="Hint__text">
        <span>{{ Settings.TUTORIAL_TEXT }}</span>
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
import { generateDynamicBlockTexture } from '../BlockTexture';

const container = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);

let loop: AntiTetrisLoop;
let input: InputHandler;
let rafId: number;

const state = reactive<GameState>({
  level: 1,
  timer: Settings.GAME_DURATION,
  targetShape: 'I',
  targetColor: 'white',
  isGameOver: false,
  hintVisible: false,
  status: 'WAITING',
  tutorialActive: false,
});

const emit = defineEmits(['update-state']);

  let dynamicScale = 1;
  let height = 0;

  const handlePointerDown = () => {
    if (state.status === 'WAITING' && window.location.hash.includes('fullscreen-on-start')) {
      if (typeof document !== 'undefined' && document.body.requestFullscreen && !document.fullscreenElement) {
        document.body.requestFullscreen();
      }
    }
  };

  const handleResize = () => {
    if (!canvas.value || !container.value || !loop || !input) return;
    const rect = container.value.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Settings.FIELD_WIDTH;
    
    dynamicScale = rect.width / width;
    height = rect.height / dynamicScale;

    canvas.value.style.width = `${rect.width}px`;
    canvas.value.style.height = `${rect.height}px`;
    canvas.value.width = Math.floor(rect.width * dpr);
    canvas.value.height = Math.floor(rect.height * dpr);

    const ctx = canvas.value.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    input.setScale(dynamicScale);
    loop.resize(width, height);
  };

onMounted(() => {
  if (!canvas.value || !container.value) return;

  const rect = container.value.getBoundingClientRect();
  const width = Settings.FIELD_WIDTH;
  const dpr = window.devicePixelRatio || 1;
  dynamicScale = rect.width / width;
  height = rect.height / dynamicScale;

  // Set display size
  canvas.value.style.width = `${rect.width}px`;
  canvas.value.style.height = `${rect.height}px`;

  // Set actual buffer size scaled by DPR
  canvas.value.width = Math.floor(rect.width * dpr);
  canvas.value.height = Math.floor(rect.height * dpr);

  const isSlowInit = window.location.hash.includes('slowInit=1');
  loop = new AntiTetrisLoop(width, height, isSlowInit);
  input = new InputHandler(container.value, dynamicScale);

  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;

  // Scale context to use CSS pixels for drawing
  ctx.scale(dpr, dpr);
  
  window.addEventListener('resize', handleResize);

  const frame = (time: number) => {
    const inputState = input.getState();
    loop.handleInput(inputState);
    loop.step(time);
    
    // Update local state and emit
    const loopState = loop.getState();
    Object.assign(state, loopState);
    emit('update-state', { ...loopState });

    render(ctx, width, height, dynamicScale, dpr);
    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
});

onUnmounted(() => {
  cancelAnimationFrame(rafId);
  window.removeEventListener('resize', handleResize);
});

const render = (ctx: CanvasRenderingContext2D, _worldWidth: number, _worldHeight: number, scale: number, dpr: number) => {
  // Clear the drawing area (CSS pixels)
  ctx.clearRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr);
  
  // Use passed scale
  
  // Flip Y axis
  ctx.save();
  ctx.translate(0, ctx.canvas.height / dpr);
  ctx.scale(1, -1);

  // Draw platform if exists
  const platformBody = loop.getPlatformBody();
  if (platformBody) {
    const pos = platformBody.getPosition();
    ctx.save();
    ctx.translate(pos.x * scale, pos.y * scale);
    ctx.fillStyle = 'rgba(148, 135, 223, 0.3)';
    ctx.strokeStyle = '#9487DF';
    ctx.lineWidth = 2 * (scale / 30); // scale stroke based on dynamic scale
    
    for (let f = platformBody.getFixtureList(); f; f = f.getNext()) {
      const shape = f.getShape() as any;
      const verts = shape.m_vertices;
      
      ctx.beginPath();
      ctx.moveTo(verts[0].x * scale, verts[0].y * scale);
      for (let i = 1; i < verts.length; i++) {
        ctx.lineTo(verts[i].x * scale, verts[i].y * scale);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const figure of loop.getFigures()) {
    const pos = figure.body.getPosition();
    const angle = figure.body.getAngle();

    // Generate textures: one for figure color, one white texture if needed
    // Texture itself must be rendered at physical pixels (scale * dpr)
    const physicalScale = scale * dpr;
    const tex = generateDynamicBlockTexture(figure.color, angle, Math.round(physicalScale));
    const whiteTex = figure.hasWhiteBlock
      ? generateDynamicBlockTexture('white', angle, Math.round(physicalScale))
      : null;
    
    ctx.save();
    ctx.translate(pos.x * scale, pos.y * scale);
    ctx.rotate(angle);

    // Draw fixtures
    let fixtureIndex = 0;
    for (let f = figure.body.getFixtureList(); f; f = f.getNext()) {
      const shape = f.getShape() as any;
      const verts = shape.m_vertices;

      let minX = verts[0].x;
      let minY = verts[0].y;
      for (let i = 1; i < verts.length; i++) {
        minX = Math.min(minX, verts[i].x);
        minY = Math.min(minY, verts[i].y);
      }

      const isWhiteBlock = figure.hasWhiteBlock && fixtureIndex === figure.whiteBlockIndex;
      // Destination size is in CSS pixels because context is already scaled by DPR
      ctx.drawImage(isWhiteBlock ? whiteTex! : tex, minX * scale, minY * scale, 1 * scale, 1 * scale);
      fixtureIndex++;
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
  background: transparent;
}

canvas {
  display: block;
}

.Hint {
  position: absolute;
  top: 5%;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  pointer-events: none;
  color: #9487DF;
  opacity: 0.8;
  font-family: 'Monocraft', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 5cqw;
}

.Hint__arrow {
  font-size: 6.5rem;
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

.StartOverlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(10px) brightness(.5);
  pointer-events: none;
}

.StartOverlay__content {
  color: #fff;
  font-family: 'Monocraft', monospace;
  font-weight: 800;
  font-size: 6cqw;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 4rem;
  background: rgba(148, 135, 223, 0.5);
  border: 4px solid #9487DF;
  border-width: 1px 0 1px 0;
  box-shadow: 0 0 30px rgba(148, 135, 223, 0.3);
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}
</style>
