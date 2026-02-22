<template>
  <div class="GameOver">
    <div class="GameOver__content">
      <h1 class="GameOver__title">Игра окончена!</h1>
      <div class="GameOver__stats">
        <div class="Stat">
          <span class="Stat__label">Уровень:</span>
          <span class="Stat__value">{{ level }}</span>
        </div>
      </div>
      <button class="GameOver__btn" @click="$emit('restart')">Играть снова</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  level: number;
}>();

defineEmits(['restart']);
</script>

<style scoped>
.GameOver {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  color: #fff;
  font-family: 'Monocraft', monospace;
}

.GameOver__content {
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

.GameOver__title {
  font-size: 3rem;
  margin-bottom: 2rem;
  background: linear-gradient(to right, #ff416c, #ff4b2b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.GameOver__stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 3rem;
}

.Stat {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  font-size: 1.5rem;
}

.Stat__label {
  opacity: 0.7;
}

.Stat__value {
  font-weight: bold;
}

.GameOver__btn {
  background: #fff;
  color: #000;
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

.GameOver__btn:hover {
  transform: scale(1.05);
  background: #eee;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
</style>
