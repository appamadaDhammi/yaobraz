<template>
  <footer class="GameFooter">
    <div class="FooterDivider"></div>
    <div class="FooterContent">
      <span class="FooterText">ANTI-TETRIS DESIGN SYNC 2026</span>
    </div>
  </footer>
</template>

<style scoped>
.GameFooter {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  flex-direction: column;
}

.FooterDivider {
  height: 10px;
  width: 100%;
  background-color: #F2EB98;
}

.FooterContent {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.FooterText {
  color: #F2EB98;
  opacity: 0.3;
  font-family: 'Inter', sans-serif;
  font-size: 3cqw;
  font-weight: 700;
  letter-spacing: 0.5em;
  text-transform: uppercase;
}
</style>
