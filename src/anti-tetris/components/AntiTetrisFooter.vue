<template>
  <footer class="GameFooter">
    <div class="FooterDivider"></div>
    <div class="FooterContent">
      <span class="FooterText">Яндекс  Образование 2026</span>
    </div>
  </footer>
</template>

<style scoped>
.GameFooter {
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.FooterDivider {
  height: 0.6cqh;
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
  font-family: 'Monocraft', monospace;
  font-size: 3cqw;
}
</style>
