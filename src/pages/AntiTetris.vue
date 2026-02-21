<template>
  <div class="AntiTetris App">
    <div class="GameLayout">
      <section class="HeaderSection">
        <AntiTetrisHeader 
          :timer="gameState.timer" 
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
      :score="gameState.score" 
      :level="gameState.level" 
      @restart="restartGame"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import AntiTetrisHeader from '../anti-tetris/components/AntiTetrisHeader.vue';
import AntiTetrisField from '../anti-tetris/components/AntiTetrisField.vue';
import AntiTetrisFooter from '../anti-tetris/components/AntiTetrisFooter.vue';
import GameOverOverlay from '../anti-tetris/components/GameOverOverlay.vue';
import { GameState } from '../anti-tetris/GameLoop';

const gameState = reactive<GameState>({
  score: 0,
  level: 1,
  timer: 60,
  targetShape: 'I',
  targetColor: 'white',
  isGameOver: false,
  hintVisible: true,
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
  overflow: hidden;
  background-color: #000;
}

.GameLayout {
  display: grid;
  grid-template-rows: 12.5vh 75vh 12.5vh;
  width: 100%;
  height: 100%;
}

.HeaderSection {
  grid-row: 1;
}

.FieldSection {
  grid-row: 2;
  position: relative;
}

.FooterSection {
  grid-row: 3;
}
</style>
