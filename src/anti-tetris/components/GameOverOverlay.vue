<template>
  <div class="GameOver" ref="containerRef">
    <div class="GameOver__scaler" :style="{ transform: `scale(${scale})` }">
      <div class="GameOver__content">
        <h1 class="GameOver__title">ИГРА ОКОНЧЕНА</h1>
        
        <div class="GameOver__stats">
          <div class="Stat">
            <span class="Stat__label">уровень:</span>
            <span class="Stat__value">{{ level }}</span>
          </div>
        </div>

        <div class="GameOver__qr" v-if="qrUrl">
          <div class="QrContainer">
            <QrcodeVue :value="qrUrl" :size="530" level="H" background="#00000000" foreground="#F4EB8C" />
          </div>
          <div class="QrHint">отсканируй, чтобы получить приз</div>
        </div>

        <button class="GameOver__btn" @click="$emit('restart')">ИГРАТЬ СНОВА</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { TELEGRAM_BOT_LINK } from '../Settings';

const props = defineProps<{
  level: number;
}>();

defineEmits(['restart']);

const qrUrl = ref('');
const scale = ref(1);
const containerRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

const updateScale = () => {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  
  const maxW = 600;
  const maxH = 1050; // Adjusted max height to slightly exceed bounding box just in case
  
  const scaleW = (rect.width * 0.9) / maxW;
  const scaleH = (rect.height * 0.95) / maxH;
  
  scale.value = Math.min(1, scaleW, scaleH);
};

onMounted(() => {
  let idCounter = parseInt(localStorage.getItem('ya_edu_anti_tetris_id') || '1', 10);
  
  function encode(id: number, rank: number) {
    return btoa(`id=${id * 1234 + 7654}&rank=${id * rank * 7654 + 1234}`);
  }
  
  const rank = Math.floor(props.level / 4) + 1;
  const payload = encode(idCounter, rank);
  
  idCounter++;
  localStorage.setItem('ya_edu_anti_tetris_id', idCounter.toString());
  
  qrUrl.value = `${TELEGRAM_BOT_LINK}?start=${payload}`;

  updateScale();
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateScale();
    });
    resizeObserver.observe(containerRef.value);
  }
  window.addEventListener('resize', updateScale);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  window.removeEventListener('resize', updateScale);
});
</script>

<style scoped>
.GameOver {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  font-family: 'Monocraft', monospace;
  color: #fff;
}

.GameOver__scaler {
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center;
}

.GameOver__content {
  text-align: center;
  animation: fadeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 600px;
}

.GameOver__title {
  font-size: 4rem;
  margin-bottom: 2.5rem;
  color: #F6C578;
  text-shadow: 0 4px 15px rgba(246, 197, 120, 0.4);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.GameOver__stats {
  display: flex;
  flex-direction: column;
  margin-bottom: 2.5rem;
  width: 100%;
}

.Stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.Stat__label {
  color: #C2B9FA;
  font-size: 2rem;
  text-transform: lowercase;
}

.Stat__value {
  color: #F6C578;
  font-size: 3.5rem;
}

.GameOver__qr {
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.QrContainer {
  background: rgba(30, 30, 40, 0.6);
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid rgba(244, 235, 140, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.QrHint {
  color: #C2B9FA;
  font-size: 1.8rem;
  opacity: 0.8;
  max-width: 300px;
  line-height: 1.4;
}

.GameOver__btn {
  background: #EC775E;
  color: #fff;
  border: none;
  padding: 1.5rem 3rem;
  font-size: 1.8rem;
  font-family: 'Monocraft', monospace;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 6px 0 rgba(0,0,0,0.3), 0 10px 20px rgba(236, 119, 94, 0.3);
  transform: translateY(0);
}

.GameOver__btn:active {
  transform: translateY(6px);
  box-shadow: 0 0 0 rgba(0,0,0,0.3), 0 4px 10px rgba(236, 119, 94, 0.2);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
