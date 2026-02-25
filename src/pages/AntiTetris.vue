<template>
  <div class="AntiTetris App">
    <div class="GameLayout">
      <section class="HeaderSection">
        <AntiTetrisHeader
          :timer="gameState.timer"
          :level="gameState.level"
          :targetShape="gameState.targetShape"
          :targetColor="gameState.targetColor"
        />
      </section>
      
      <section class="FieldSection">
        <AntiTetrisField @update-state="onStateUpdate" />
      </section>
      
      <section class="FooterSection">
        <AntiTetrisFooter />
      </section>
    </div>

    <GameOverOverlay 
      v-if="gameState.isGameOver" 
      :level="gameState.level" 
      @restart="restartGame"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import AntiTetrisHeader from '../anti-tetris/components/AntiTetrisHeader.vue';
import AntiTetrisField from '../anti-tetris/components/AntiTetrisField.vue';
import AntiTetrisFooter from '../anti-tetris/components/AntiTetrisFooter.vue';
import GameOverOverlay from '../anti-tetris/components/GameOverOverlay.vue';
import type { GameState } from '../anti-tetris/GameLoop';

const gameState = reactive<GameState>({
  level: 1,
  timer: 60,
  targetShape: 'I',
  targetColor: 'white',
  isGameOver: false,
  hintVisible: true,
  status: 'WAITING',
  tutorialActive: false,
  coinsCollected: 0,
  lastCoinBonus: 0,
});

const onStateUpdate = (newState: GameState) => {
  Object.assign(gameState, newState);
};

const restartGame = () => {
  window.location.reload(); // Simple restart for now
};
</script>

<style scoped>
.AntiTetris {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111; /* Dark background outside the game box */
  overflow: hidden;
}

.GameLayout {
  display: grid;
  grid-template-rows: 12.5% 81.25% 6.25%;
  width: 100%;
  height: 100%;
  max-width: calc(100vh * 9 / 16);
  max-height: calc(100vw * 16 / 9);
  aspect-ratio: 9 / 16;
  background-color: #000;
  background-image: url('../anti-tetris/assets/game-background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0 0 100px rgba(0, 0, 0, 0.5);
  position: relative;
  
  /* Relative font unit base: 1% of container width approx */
  /* We use container queries for true relative fonts if available, 
     but we can also use a variable here or just cqw */
  container-type: size;
}

.HeaderSection {
  grid-row: 1;
  z-index: 10;
}

.FieldSection {
  grid-row: 2;
  position: relative;
}

.FooterSection {
  grid-row: 3;
}
</style>
