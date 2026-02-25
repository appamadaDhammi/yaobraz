<template>
  <div class="GameField" ref="container" @pointerdown="handlePointerDown">
    <canvas ref="canvas"></canvas>
    <video ref="coinVideo" :src="coinWebm" autoplay loop muted playsinline style="position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px;"></video>
    
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
import coinWebm from '../assets/coin.webm';

const container = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const coinVideo = ref<HTMLVideoElement | null>(null);

let loop: AntiTetrisLoop;
let input: InputHandler;
let rafId: number;

// Text animation queue (level-up, coin collection, etc.)
interface TextAnimation {
  startTime: number;
  text: string;
  color: string;
  yRatio: number;
  flyTargetX?: number;
  flyTargetY?: number;
}
const textAnimations: TextAnimation[] = [];

const state = reactive<GameState>({
  level: 1,
  timer: Settings.GAME_DURATION,
  targetShape: 'I',
  targetColor: 'white',
  isGameOver: false,
  hintVisible: false,
  status: 'WAITING',
  tutorialActive: false,
  coinsCollected: 0,
  lastCoinBonus: 0,
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
  
  if (coinVideo.value) {
    coinVideo.value.play().catch(console.error);
  }
  
  window.addEventListener('resize', handleResize);

  const frame = (time: number) => {
    const inputState = input.getState();
    loop.handleInput(inputState);
    loop.step(time);

    // Update local state and emit
    const loopState = loop.getState();

    // Detect level-up and start animation
    if (loopState.status === 'PLAYING' && loopState.level > state.level) {
      const colorValues = Object.values(Settings.COLOR_PALETTE);
      textAnimations.push({
        startTime: time,
        text: `${Settings.LEVEL_UP_TEXT_PREFIX} ${loopState.level}`,
        color: colorValues[Math.floor(Math.random() * colorValues.length)]!,
        yRatio: Settings.LEVEL_UP_Y_RATIO,
        flyTargetX: Settings.LEVEL_UP_FLY_TARGET_X,
        flyTargetY: Settings.LEVEL_UP_FLY_TARGET_Y,
      });
    }

    // Detect coin collection and start animation
    if (loopState.status === 'PLAYING' && loopState.coinsCollected > state.coinsCollected) {
      textAnimations.push({
        startTime: time,
        text: `${Settings.COIN_COLLECT_TEXT} +${loopState.lastCoinBonus}`,
        color: Settings.COIN_COLLECT_COLOR,
        yRatio: Settings.COIN_COLLECT_Y_RATIO,
        flyTargetX: Settings.COIN_FLY_TARGET_X,
        flyTargetY: Settings.COIN_FLY_TARGET_Y,
      });
    }

    Object.assign(state, loopState);
    emit('update-state', { ...loopState });

    render(ctx, width, height, dynamicScale, dpr, time);
    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
});

onUnmounted(() => {
  cancelAnimationFrame(rafId);
  window.removeEventListener('resize', handleResize);
});

const render = (ctx: CanvasRenderingContext2D, _worldWidth: number, _worldHeight: number, scale: number, dpr: number, time: number) => {
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
    ctx.fillStyle = Settings.PLATFORM_FILL_STYLE;
    ctx.strokeStyle = Settings.PLATFORM_STROKE_STYLE;
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

  // Draw coins
  const coins = loop.getCoins();
  if (coins.length > 0 && coinVideo.value && coinVideo.value.readyState >= 2) {
    for (const coin of coins) {
      if (coin.lifetime <= 0) continue; // Skip destroying coins

      const pos = coin.body.getPosition();
      const radius = Settings.COIN_RADIUS * 1.2;
      const diameter = radius * 2;
      
      ctx.save();
      // Fade out logic before destroying
      if (coin.lifetime < 1.0) {
        ctx.globalAlpha = coin.lifetime;
      }

      ctx.globalCompositeOperation = 'screen';

      ctx.translate(pos.x * scale, pos.y * scale);
      // un-flip Y so the video isn't upside down because of `ctx.scale(1, -1)` at the start
      ctx.scale(1, -1);
      
      ctx.drawImage(
        coinVideo.value, 
        -radius * scale, 
        -radius * scale, 
        diameter * scale, 
        diameter * scale
      );
      
      ctx.restore();
    }
  }

  for (const figure of loop.getFigures()) {
    const pos = figure.body.getPosition();
    const angle = figure.body.getAngle();

    // Texture itself must be rendered at physical pixels (scale * dpr)
    const physicalScale = scale * dpr;
    const tex = generateDynamicBlockTexture(figure.color, angle, Math.round(physicalScale));

    ctx.save();
    ctx.translate(pos.x * scale, pos.y * scale);
    ctx.rotate(angle);

    // Draw fixtures
    for (let f = figure.body.getFixtureList(); f; f = f.getNext()) {
      const shape = f.getShape() as any;
      const verts = shape.m_vertices;

      let minX = verts[0].x;
      let minY = verts[0].y;
      for (let i = 1; i < verts.length; i++) {
        minX = Math.min(minX, verts[i].x);
        minY = Math.min(minY, verts[i].y);
      }

      // Destination size is in CSS pixels because context is already scaled by DPR
      ctx.drawImage(tex, minX * scale, minY * scale, 1 * scale, 1 * scale);
    }
    
    ctx.restore();
  }

  // Draw meteorites (white blocks)
  for (const meteorite of loop.getMeteorites()) {
    if (!meteorite.body) continue;
    const mPos = meteorite.body.getPosition();
    const mAngle = meteorite.body.getAngle();

    const mPhysicalScale = scale * dpr;
    const mTex = generateDynamicBlockTexture(Settings.METEORITE_COLOR, mAngle, Math.round(mPhysicalScale));

    ctx.save();
    ctx.translate(mPos.x * scale, mPos.y * scale);
    ctx.rotate(mAngle);

    for (let f = meteorite.body.getFixtureList(); f; f = f.getNext()) {
      const shape = f.getShape() as any;
      const verts = shape.m_vertices;

      let minX = verts[0].x;
      let minY = verts[0].y;
      for (let j = 1; j < verts.length; j++) {
        minX = Math.min(minX, verts[j].x);
        minY = Math.min(minY, verts[j].y);
      }

      ctx.drawImage(mTex, minX * scale, minY * scale, 1 * scale, 1 * scale);
    }

    ctx.restore();
  }

  ctx.restore();

  // ── Effects drawn in normal screen coords (Y-down) ──────────────────────
  const canvasW = ctx.canvas.width / dpr;
  const canvasH = ctx.canvas.height / dpr;

  // Text animations (level-up, coin collection, etc.)
  for (let i = textAnimations.length - 1; i >= 0; i--) {
    const anim = textAnimations[i]!;
    const elapsed = (time - anim.startTime) / 1000;
    const dur = Settings.LEVEL_UP_DURATION_SEC;

    if (elapsed >= dur) {
      textAnimations.splice(i, 1);
      continue;
    }

    const progress = elapsed / dur;
    const fadeIn  = Settings.LEVEL_UP_FADE_IN_RATIO;
    const fadeOut = Settings.LEVEL_UP_FADE_OUT_RATIO;

    let alpha: number;
    let sc: number;

    if (progress < fadeIn) {
      const p = progress / fadeIn;
      alpha = p;
      sc = Settings.LEVEL_UP_SCALE_START + (Settings.LEVEL_UP_SCALE_PEAK - Settings.LEVEL_UP_SCALE_START) * p;
    } else if (progress > 1 - fadeOut) {
      const p = (1 - progress) / fadeOut; // 1→0 as animation ends
      alpha = p;
      if (anim.flyTargetX != null && anim.flyTargetY != null) {
        const flyP = 1 - p; // 0→1 as animation ends
        const eased = flyP * flyP; // ease-in acceleration
        sc = Settings.LEVEL_UP_SCALE_PEAK + (Settings.FLY_SCALE_END - Settings.LEVEL_UP_SCALE_PEAK) * eased;
      } else {
        sc = 1 + (Settings.LEVEL_UP_SCALE_PEAK - 1) * p;
      }
    } else {
      alpha = 1;
      sc = Settings.LEVEL_UP_SCALE_PEAK;
    }

    // Compute position — fly toward target during fade-out
    let posX = canvasW * Settings.LEVEL_UP_X_RATIO;
    let posY = canvasH * anim.yRatio;
    if (anim.flyTargetX != null && anim.flyTargetY != null && progress > 1 - fadeOut) {
      const p = (1 - progress) / fadeOut;
      const flyP = 1 - p;
      const eased = flyP * flyP;
      const endX = canvasW * anim.flyTargetX;
      const endY = canvasH * anim.flyTargetY;
      posX += (endX - posX) * eased;
      posY += (endY - posY) * eased;
    }

    const fontSize = Settings.LEVEL_UP_FONT_SIZE_RATIO * scale * Settings.FIELD_WIDTH;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(posX, posY);
    ctx.scale(sc, sc);
    ctx.font = `bold ${fontSize}px 'Monocraft', monospace`;
    ctx.fillStyle = anim.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(anim.text, 0, 0);
    ctx.restore();
  }
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
