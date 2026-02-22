<template>
  <header class="GameHeader">
    <div class="HeaderContent">

      <div class="Stat Stat--level">
        <label class="Stat__label">уровень :</label>
        <span class="Stat__value">{{ level }}</span>
      </div>

      <div class="Stat Stat--time">
        <label class="Stat__label">время :</label>
        <span class="Stat__value">{{ formatTime(timer) }}</span>
      </div>

      <div class="Stat Stat--next">
        <label class="Stat__label">фигура :</label>
        <div class="TargetBox">
          <div 
            class="TargetBox__figure" 
            :class="{ 'is-white': targetColor === 'white' }"
            :style="{ color: targetColor === 'white' ? '#fff' : Settings.TEXTURE_COLORS[targetColor as FigureColor] }"
            v-html="getFigureIcon(targetShape)"
          >
          </div>
        </div>
      </div>
    </div>
    
    <div class="HeaderTimeline">
      <div class="HeaderTimeline__bg"></div>
      <div class="HeaderTimeline__value" :style="{ width: progressWidth + '%' }"></div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FigureShape, FigureColor } from '../Settings';
import * as Settings from '../Settings';

import timelineBg from '../assets/timeline-bg.png';
import timelineValue from '../assets/timeline-value.png';

const props = defineProps<{
  timer: number;
  level: number;
  targetShape: FigureShape;
  targetColor: FigureColor | 'white';
}>();

const formatTime = (seconds: number) => {
  const s = Math.ceil(seconds);
  const mins = String(Math.floor(s / 60)).padStart(2, '0');
  const secs = String(s % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

const progressWidth = computed(() => {
  const elapsed = Settings.GAME_DURATION - props.timer;
  return Math.min(100, Math.max(0, (elapsed / Settings.GAME_DURATION) * 100));
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
}

.HeaderContent {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  padding: 0.6cqw 4.5%;
}

.Stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.2cqw;
}

.Stat__label {
  color: #C2B9FA;
  font-family: 'Monocraft', monospace;
  font-size: 2.8cqw;
  font-weight: 400;
  letter-spacing: 0.05em;
  line-height: 1;
}

.Stat__value {
  color: #F6C578;
  font-family: 'Monocraft', monospace;
  font-size: 5.5cqw;
  font-weight: 400;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.Stat--level {
  flex: 0 0 auto;
  min-width: 18%;
  align-items: flex-start;
}

.Stat--time {
  flex: 1;
  align-items: flex-start;
  padding-left: 4%;
}

.Stat--next {
  flex: 0 0 auto;
  align-items: flex-start;
}

.TargetBox {
  display: flex;
  align-items: center;
  justify-content: center;
}

.TargetBox__figure {
  width: 5.5cqw;
  height: 5.5cqw;
  display: flex;
  align-items: center;
  justify-content: center;
}

.TargetBox__figure :deep(svg) {
  max-width: 100%;
  max-height: 100%;
}

.HeaderTimeline {
  height: 3.5cqw;
  width: 100%;
  position: relative;
  flex-shrink: 0;
}

.HeaderTimeline__bg {
  position: absolute;
  inset: 0;
  background-image: v-bind("`url('${timelineBg}')`");
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.HeaderTimeline__value {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background-image: v-bind("`url('${timelineValue}')`");
  background-size: cover;
  background-position: left center;
  background-repeat: no-repeat;
  z-index: 1;
}
</style>
