<template>
  <div class="Settings App">
    <div class="Settings__container">
      <router-link to="/" class="Settings__back">&larr; Назад</router-link>

      <h1 class="Settings__title">Настройки</h1>

      <div class="Settings__actions">
        <button class="Btn Btn--reset" @click="handleReset">Сбросить всё</button>
      </div>

      <section v-for="section in SETTINGS_SECTIONS" :key="section.title" class="Settings__section">
        <h2 class="Settings__subtitle">{{ section.title }}</h2>
        <div class="ParamList">
          <div v-for="key in section.keys" :key="key" class="ParamList__item">
            <label class="ParamList__label" :for="'s-' + key">{{ key }}</label>

            <input
              v-if="typeof form[key] === 'number'"
              :id="'s-' + key"
              class="ParamList__input"
              type="number"
              step="any"
              :value="form[key]"
              @change="onNumberChange(key, $event)"
            />

            <input
              v-else-if="typeof form[key] === 'string'"
              :id="'s-' + key"
              class="ParamList__input ParamList__input--text"
              type="text"
              :value="form[key]"
              @change="onStringChange(key, $event)"
            />

            <textarea
              v-else
              :id="'s-' + key"
              class="ParamList__textarea"
              :value="jsonStringify(form[key])"
              @change="onJsonChange(key, $event)"
            ></textarea>
          </div>
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
import { ref, reactive, onMounted } from 'vue';
import {
  S,
  SETTINGS_SECTIONS,
  getAllSettings,
  saveSettings,
  saveSettingsToServer,
  resetSettings,
  resetSettingsOnServer,
  loadSettingsFromServer,
  getDefaults,
} from '@/anti-tetris/Settings';

const form = reactive<Record<string, unknown>>(getAllSettings());

const currentUrl = ref('');
const gameUrl = ref('');
const settingsUrl = ref('');
const idCounter = ref(1);

function jsonReplacer(_k: string, v: unknown) {
  return v === Infinity ? '__Infinity__' : v;
}

function jsonReviver(_k: string, v: unknown) {
  return v === '__Infinity__' ? Infinity : v;
}

function jsonStringify(value: unknown): string {
  return JSON.stringify(value, jsonReplacer, 2);
}

function apply(key: string, value: unknown) {
  form[key] = value;
  saveSettings({ [key]: value });
  saveSettingsToServer();
}

function onNumberChange(key: string, e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value);
  if (!isNaN(v)) apply(key, v);
}

function onStringChange(key: string, e: Event) {
  apply(key, (e.target as HTMLInputElement).value);
}

function onJsonChange(key: string, e: Event) {
  try {
    const parsed = JSON.parse((e.target as HTMLTextAreaElement).value, jsonReviver);
    apply(key, parsed);
    (e.target as HTMLTextAreaElement).classList.remove('is-error');
  } catch {
    (e.target as HTMLTextAreaElement).classList.add('is-error');
  }
}

function handleReset() {
  resetSettings();
  resetSettingsOnServer();
  const fresh = getDefaults();
  for (const k of Object.keys(fresh)) {
    form[k] = (fresh as Record<string, unknown>)[k];
  }
}

onMounted(async () => {
  await loadSettingsFromServer();
  const fresh = getAllSettings();
  for (const k of Object.keys(fresh)) {
    form[k] = (fresh as Record<string, unknown>)[k];
  }

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
  max-width: 700px;
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

.Settings__actions {
  display: flex;
  gap: 0.75rem;
}

.Btn {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.Btn--reset {
  background: #EC775E;
  color: #fff;
}

.Btn--reset:hover {
  opacity: 0.85;
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

.ParamList {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.ParamList__item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.3rem 0;
}

.ParamList__label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.82rem;
  flex-shrink: 0;
  padding-top: 0.35rem;
  max-width: 50%;
  word-break: break-all;
}

.ParamList__value {
  color: #F6C578;
  font-weight: 600;
  font-size: 1rem;
}

.ParamList__input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.4rem;
  color: #F6C578;
  font-size: 0.9rem;
  font-family: monospace;
  padding: 0.35rem 0.5rem;
  width: 140px;
  text-align: right;
  transition: border-color 0.15s;
}

.ParamList__input--text {
  width: 220px;
  text-align: left;
}

.ParamList__input:focus {
  outline: none;
  border-color: #818cf8;
}

.ParamList__textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.4rem;
  color: #F6C578;
  font-size: 0.78rem;
  font-family: monospace;
  padding: 0.4rem 0.5rem;
  width: 280px;
  min-height: 60px;
  resize: vertical;
  transition: border-color 0.15s;
}

.ParamList__textarea:focus {
  outline: none;
  border-color: #818cf8;
}

.ParamList__textarea.is-error {
  border-color: #EC775E;
}
</style>
