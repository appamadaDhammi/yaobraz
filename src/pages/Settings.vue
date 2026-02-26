<template>
  <div class="Settings App">
    <div class="Settings__container">
      <router-link to="/" class="Settings__back">&larr; Назад</router-link>

      <h1 class="Settings__title">Настройки</h1>

      <section class="Settings__section">
        <h2 class="Settings__subtitle">Формула ранка</h2>
        <table class="RankTable">
          <thead>
            <tr>
              <th class="RankTable__th">Уровень</th>
              <th class="RankTable__th">Ранк</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in rankTable" :key="entry.minLevel" class="RankTable__row">
              <td class="RankTable__td">
                {{ entry.maxLevel === Infinity ? `${entry.minLevel}+` : `${entry.minLevel}–${entry.maxLevel}` }}
              </td>
              <td class="RankTable__td">{{ entry.rank }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="Settings__section">
        <h2 class="Settings__subtitle">QR-параметры</h2>
        <div class="ParamList">
          <div class="ParamList__item">
            <span class="ParamList__label">Bot</span>
            <span class="ParamList__value">@{{ QR_BOT_USERNAME }}</span>
          </div>
          <div class="ParamList__item">
            <span class="ParamList__label">n_</span>
            <span class="ParamList__value">{{ QR_BOT_N }}</span>
          </div>
          <div class="ParamList__item">
            <span class="ParamList__label">c_</span>
            <span class="ParamList__value">{{ QR_BOT_C }}</span>
          </div>
        </div>
        <div class="Settings__formula">
          <code>btoa("id=${id*1234+7654}&amp;rank=${id*rank*7654+1234}")</code>
        </div>
      </section>

      <section class="Settings__section">
        <h2 class="Settings__subtitle">Сеть</h2>
        <div class="ParamList">
          <div class="ParamList__item">
            <span class="ParamList__label">Текущий URL</span>
            <span class="ParamList__value Settings__url">{{ currentUrl }}</span>
          </div>
          <div class="ParamList__item">
            <span class="ParamList__label">Игра</span>
            <span class="ParamList__value Settings__url">{{ gameUrl }}</span>
          </div>
          <div class="ParamList__item">
            <span class="ParamList__label">Настройки</span>
            <span class="ParamList__value Settings__url">{{ settingsUrl }}</span>
          </div>
        </div>
        <p class="Settings__note">
          Сервер слушает 0.0.0.0 — доступен с любого устройства в той же сети по IP-адресу машины.
        </p>
      </section>

      <section class="Settings__section">
        <h2 class="Settings__subtitle">Счётчик ID</h2>
        <div class="ParamList">
          <div class="ParamList__item">
            <span class="ParamList__label">Следующий ID</span>
            <span class="ParamList__value">{{ idCounter }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RANK_TABLE, QR_BOT_N, QR_BOT_C, QR_BOT_USERNAME } from '@/anti-tetris/Settings';

const rankTable = RANK_TABLE;
const currentUrl = ref('');
const gameUrl = ref('');
const settingsUrl = ref('');
const idCounter = ref(1);

onMounted(() => {
  currentUrl.value = window.location.href;
  gameUrl.value = `${window.location.origin}/anti-tetris`;
  settingsUrl.value = `${window.location.origin}/settings`;
  idCounter.value = parseInt(localStorage.getItem('ya_edu_anti_tetris_id') || '1', 10);
});
</script>

<style scoped>
.Settings {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background-color: var(--bg-color);
  color: var(--text-color);
  overflow-y: auto;
  padding: 2rem 1rem;
}

.Settings__container {
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.Settings__back {
  color: var(--paddle-color);
  text-decoration: none;
  font-size: 1rem;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.Settings__back:hover {
  opacity: 1;
}

.Settings__title {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.Settings__section {
  background: rgba(255, 255, 255, 0.05);
  padding: 1.25rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.Settings__subtitle {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
}

.Settings__formula {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  font-size: 0.85rem;
  color: #F4EB8C;
  overflow-x: auto;
}

.Settings__note {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.4;
}

.Settings__url {
  word-break: break-all;
  font-size: 0.85rem;
}

.RankTable {
  width: 100%;
  border-collapse: collapse;
}

.RankTable__th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.RankTable__row:not(:last-child) .RankTable__td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.RankTable__td {
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
}

.ParamList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ParamList__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
}

.ParamList__label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.ParamList__value {
  color: #F6C578;
  font-weight: 600;
  font-size: 1rem;
}
</style>
