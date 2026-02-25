<template>
  <header class="GameHeader">
    <div class="HeaderContent">

      <div class="Stat Stat--level">
        <label class="Stat__label">уровень:</label>
        <span class="Stat__value">{{ level }}</span>
      </div>

      <div class="Stat Stat--time">
        <label class="Stat__label">время:</label>
        <span class="Stat__value">{{ formatTime(timer) }}</span>
      </div>

      <div class="Stat Stat--next">
        <label class="Stat__label">фигура:</label>
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
  return 100 - Math.min(100, Math.max(0, (elapsed / Settings.GAME_DURATION) * 100));
});

/** Block positions matching the header SVG orientation (10-unit grid). */
const HEADER_BLOCKS: Record<FigureShape, { vb: string; cells: [number, number][] }> = {
  I: { vb: '0 0 40 10', cells: [[0,0], [10,0], [20,0], [30,0]] },
  O: { vb: '0 0 20 20', cells: [[0,0], [10,0], [0,10], [10,10]] },
  T: { vb: '0 0 30 20', cells: [[0,0], [10,0], [20,0], [10,10]] },
  S: { vb: '0 0 30 20', cells: [[10,0], [20,0], [0,10], [10,10]] },
  Z: { vb: '0 0 30 20', cells: [[0,0], [10,0], [10,10], [20,10]] },
  L: { vb: '0 0 30 20', cells: [[0,10], [10,10], [20,10], [20,0]] },
  J: { vb: '0 0 30 20', cells: [[0,0], [0,10], [10,10], [20,10]] },
};

const getFigureIcon = (shape: FigureShape) => {
  const { vb, cells } = HEADER_BLOCKS[shape];
  const rects = cells.map(([x, y]) =>
    `<rect x="${x}" y="${y}" width="10" height="10" fill="currentColor"/>`,
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="100%" height="100%">${rects}</svg>`;
};
</script>

<style scoped>
.GameHeader {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
  padding-right: 1.3cqw;
}

.HeaderContent {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: stretch;
  justify-content: space-between;
  padding: .6cqh 4.5%;
}

.Stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.3cqw;
}

.Stat__label {
  color: #C2B9FA;
  font-family: 'Monocraft', monospace;
  font-size: 3.6cqw;
  font-weight: 400;
  letter-spacing: 0.05em;
  line-height: 1;
}

.Stat__value {
  color: #F6C578;
  font-family: 'Monocraft', monospace;
  font-size: 6.5cqw;
  font-weight: 400;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.Stat--level {
  flex: 0 0 auto;
  min-width: 18%;
  align-items: center;
}

.Stat--time {
  flex: 1;
  align-items: center;
  padding-left: 4%;
}

.Stat--next {
  flex: 0 0 auto;
  align-items: center;
}

.TargetBox {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 6.5cqw;
}

.TargetBox__figure {
  width: 10cqw;
  height: 5cqw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  right: 0;
  /*top: 16px;*/
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
