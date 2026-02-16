<template>
  <div class="Welcome App">
    <div class="Welcome__container">
      <h1 class="Welcome__title">Games Stand</h1>
      <div class="Welcome__links">
        <router-link to="/anti-tetris" class="Welcome__link">Anti-Tetris</router-link>
        <router-link to="/binary-maze" class="Welcome__link">Binary-Maze</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.Welcome {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.Welcome__container {
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 3rem;
  border-radius: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.Welcome__title {
  font-size: 3rem;
  margin-bottom: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.Welcome__links {
  display: flex;
  gap: 1.5rem;
  flex-direction: column;
}

.Welcome__link {
  display: inline-block;
  padding: 1rem 2.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  text-decoration: none;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.Welcome__link:hover {
  background: var(--paddle-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}
</style>
