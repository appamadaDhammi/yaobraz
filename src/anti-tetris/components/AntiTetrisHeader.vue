<template>
  <header class="GameHeader">
    <div class="HeaderContent">
      <div class="Stat Stat--score">
        <label class="Stat__label">SCORE</label>
        <span class="Stat__value">{{ score.toString().padStart(4, '0') }}</span>
      </div>

      <div class="Stat Stat--time">
        <label class="Stat__label">TIME</label>
        <span class="Stat__value">{{ formatTime(timer) }}</span>
      </div>

      <div class="Stat Stat--next">
        <label class="Stat__label">NEXT</label>
        <div class="TargetBox">
          <div 
            class="TargetBox__figure" 
            :class="{ 'is-white': targetColor === 'white' }"
            :style="{ color: targetColor === 'white' ? '#fff' : targetColor }"
            v-html="getFigureIcon(targetShape)"
          >
          </div>
        </div>
      </div>
    </div>
    
    <div class="HeaderDivider">
      <div class="HeaderDivider__progress" :style="{ width: progressWidth + '%' }"></div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FigureShape, FigureColor } from '../Settings';

const props = defineProps<{
  timer: number;
  score: number;
  level: number;
  targetShape: FigureShape;
  targetColor: FigureColor | 'white';
}>();

const formatTime = (seconds: number) => {
  const s = Math.ceil(seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const progressWidth = computed(() => {
  // Simple progress based on level/score or fixed for now as per SVG
  return 27.4; // Matches the ~296px width in 1080px SVG
});

const getFigureIcon = (shape: FigureShape) => {
  const icons: Record<FigureShape, string> = {
    I: '<svg viewBox="0 0 10 40"><rect width="10" height="40" fill="currentColor"/></svg>',
    O: '<svg viewBox="0 0 20 20"><rect width="20" height="20" fill="currentColor"/></svg>',
    T: '<svg viewBox="0 0 30 20"><path d="M0,0 h30 v10 h-10 v10 h-10 v-10 h-10 z" fill="currentColor"/></svg>',
    S: '<svg viewBox="0 0 30 20"><path d="M10,0 h20 v10 h-10 v10 h-20 v-10 h10 z" fill="currentColor"/></svg>',
    Z: '<svg viewBox="0 0 30 20"><path d="M0,0 h20 v10 h10 v10 h-20 v-10 h-10 z" fill="currentColor"/></svg>',
    L: '<svg viewBox="0 0 20 30"><path d="M0,0 h10 v20 h10 v10 h-20 z" fill="currentColor"/></svg>',
    J: '<svg viewBox="0 0 20 30"><path d="M0,20 h10 v-20 h10 v30 h-20 z" fill="currentColor"/></svg>',
  };
  return icons[shape];
};
</script>

<style scoped>
.GameHeader {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  padding-top: 2rem;
}

.HeaderContent {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 4.5%;
  margin-bottom: 2rem;
}

.Stat {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
}

.Stat__label {
  color: #C2B9FA;
  opacity: 0.5;
  font-family: 'Inter', sans-serif;
  font-size: 3.5cqw;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin-bottom: 0.2rem;
}

.Stat__value {
  color: #F2EB98;
  font-family: 'Inter', sans-serif;
  font-size: 5.5cqw;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.Stat--next {
  gap: 1.5rem;
}

.TargetBox {
  width: 120px;
  height: 40px;
  background-color: #F6C578;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.TargetBox__figure {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.TargetBox__figure :deep(svg) {
  max-width: 90%;
  max-height: 90%;
}

.HeaderDivider {
  height: 30px;
  width: 100%;
  background-color: #9487DF;
  position: relative;
  box-shadow: inset 10px 10px 0 rgba(255,255,255,0.5), inset -10px -10px 0 rgba(0,0,0,0.25);
}

.HeaderDivider__progress {
  height: 40px;
  background-color: #F4EB8C;
  position: absolute;
  top: -5px;
  left: 0;
}
</style>
