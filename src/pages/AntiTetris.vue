<template>
  <div class="AntiTetris App">
    <div class="AntiTetris__container">
      <router-link to="/" class="BackLink">← Back</router-link>
      <h1 class="AntiTetris__title">Anti-Tetris</h1>
      <p class="AntiTetris__status">Coming Soon...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.AntiTetris {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--field-color);
  color: var(--text-color);
}

.AntiTetris__container {
  text-align: center;
}

.AntiTetris__title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.AntiTetris__status {
  opacity: 0.6;
}

.BackLink {
  position: fixed;
  top: 2rem;
  left: 2rem;
  color: var(--text-color);
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.BackLink:hover {
  opacity: 1;
}
</style>
