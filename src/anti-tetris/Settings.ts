// ——— Types ———————————————————————————————————————————————————————————————

export interface LevelConfig {
  i: number;
  k: number;
}

const FIGURE_COLORS_CONST = ['blue', 'orange', 'red', 'yellow'] as const;
const FIGURE_SHAPES_CONST = ['I', 'O', 'T', 'S', 'Z', 'L', 'J'] as const;

export const FIGURE_COLORS = FIGURE_COLORS_CONST;
export const FIGURE_SHAPES = FIGURE_SHAPES_CONST;
export type FigureShape = (typeof FIGURE_SHAPES_CONST)[number];
export type FigureColor = (typeof FIGURE_COLORS_CONST)[number];

// ——— Defaults ————————————————————————————————————————————————————————————

const DEFAULTS = {
  // — Время и скорость —
  GAME_DURATION: 45,
  GAME_SPEED: 1.0,
  PHYSICS_SPEED: 1.7,
  GRAVITY_DELAY_SEC: 2.0,
  DEFAULT_GRAVITY: -10,

  // — Уровни —
  LEVEL_CONFIG: [
    { i: 5,  k: 2 },
    { i: 5,  k: 2 },
    { i: 6,  k: 3 },
    { i: 6,  k: 3 },
    { i: 7,  k: 4 },
    { i: 7,  k: 4 },
    { i: 8,  k: 4 },
    { i: 8,  k: 4 },
    { i: 9,  k: 5 },
    { i: 10, k: 5 },
  ] as LevelConfig[],
  LEVEL_COLOR_START: 3,

  // — Монеты —
  COIN_TIME_BONUS_MIN: 1,
  COIN_TIME_BONUS_MAX: 3,
  COIN_MAX_ON_FIELD: 1,
  COIN_SPAWN_DELAY_MIN: 8,
  COIN_SPAWN_DELAY_MAX: 15,
  COIN_LIFETIME_SEC: 10,
  COIN_START_LEVEL: 2,
  COIN_RADIUS: 0.5,
  COIN_SPRITE_FRAMES: 36,
  COIN_SPRITE_FRAME_SIZE: 128,
  COIN_SPRITE_FPS: 12,

  // — Физика фигур —
  FIGURE_FRICTION: 0.3,
  FIGURE_RESTITUTION: 0.3,
  FIGURE_LINEAR_DAMPING: 0.1,
  FIGURE_ANGULAR_DAMPING: 0.1,
  FIGURE_DRAG_ANGULAR_DAMPING: 10.0,
  FIGURE_DRAG_LOSS_DISTANCE: 5.0,
  MAX_FIGURE_VELOCITY: 20,
  FIGURE_THROW_CEILING_OFFSET: 1.0,
  SPAWN_RADIUS: 2.0,

  // — Управление (MouseJoint) —
  MOUSE_JOINT_MAX_FORCE: 700,
  MOUSE_JOINT_FREQUENCY: 15,
  MOUSE_JOINT_DAMPING: 0.9,
  RUBBLE_DAMPING_FACTOR: 1.6,
  MIN_MOUSE_JOINT_FORCE: 50,
  PRESSURE_SMOOTHING_ALPHA: 0.1,
  LEGACY_GRAB_FORCE: 60,
  WRONG_FIGURE_DRAG: 0.3,
  DRAG_ZONE_RATIO: 1 / 8,

  // — Рендеринг —
  SHADOW_LIGHT_ANGLE: -Math.PI / 8 * 5,
  SHADOW_LIGHTEN_FACTOR: 0.15,
  SHADOW_DARKEN_FACTOR: 0.05,
  WORLD_SCALE: 30,
  FIELD_WIDTH: 9,

  // — Платформа —
  PLATFORM_FILL_STYLE: 'rgba(148, 135, 223, 0.3)',
  PLATFORM_STROKE_STYLE: '#9487DF',
  REFILL_DELAY_TEXT: 0.01,
  REFILL_DELAY_PLATFORM: 0.1,
  PLATFORM_REST_Y: -15,
  PLATFORM_RISE_SPEED: 9,
  PLATFORM_DESCEND_SPEED: 20,
  PLATFORM_TARGET_Y: 0.1,
  PLATFORM_HALF_HEIGHT: 0.5,
  PLATFORM_SPAWN_OFFSET_Y: 1.5,
  PLATFORM_SPAWN_GAP_Y: 2.5,
  PLATFORM_SETTLE_TIME: 0.8,
  PLATFORM_SPAWN_ANGLE: 0.7,

  // — Анимация уровня —
  LEVEL_UP_DURATION_SEC: 1.0,
  LEVEL_UP_FADE_IN_RATIO: 0.15,
  LEVEL_UP_FADE_OUT_RATIO: 0.35,
  LEVEL_UP_SCALE_PEAK: 1.3,
  LEVEL_UP_SCALE_START: 0.7,
  LEVEL_UP_FONT_SIZE_RATIO: 0.096,
  LEVEL_UP_TEXT_PREFIX: 'УРОВЕНЬ',
  LEVEL_UP_X_RATIO: 0.5,
  LEVEL_UP_Y_RATIO: 0.5,

  // — Анимация монеты —
  COIN_COLLECT_TEXT: 'ВРЕМЯ',
  COIN_COLLECT_Y_RATIO: 0.35,
  COIN_COLLECT_COLOR: '#F4EB8C',

  // — Fly-анимации —
  LEVEL_UP_FLY_TARGET_X: 0.12,
  LEVEL_UP_FLY_TARGET_Y: -0.08,
  COIN_FLY_TARGET_X: 0.5,
  COIN_FLY_TARGET_Y: -0.08,
  FLY_SCALE_END: 0.4,

  // — Метеориты —
  METEORITE_START_LEVEL: 3,
  METEORITE_PHASE2_LEVEL: 5,
  METEORITE_PHASE3_LEVEL: 7,
  METEORITE_COMPOSITIONS: {
    phase1: [[1, 0]],
    phase2: [[2, 0], [1, 1]],
    phase3: [[2, 1], [1, 2]],
  } as Record<string, [number, number][]>,
  METEORITE_SPAWN_DELAY_MIN: 2,
  METEORITE_SPAWN_DELAY_MAX: 10,
  METEORITE_DENSITY: 4.0,
  METEORITE_DESTROY_Y: -40,
  METEORITE_COLOR: 'white',

  // — UI-тексты —
  HINT_TEXT: 'кидай вверх',
  START_TEXT: 'НАЧАТЬ ИГРУ',
  TUTORIAL_TEXT: 'КИДАЙ ВВЕРХ',

  // — QR / Telegram —
  TELEGRAM_BOT_LINK: 'https://t.me/your_bot_name',
  QR_BOT_N: 191849,
  QR_BOT_C: 12054,
  QR_BOT_USERNAME: 'yaeducation_bot',
  QR_HINT_TEXT: 'Отсканируй QR и узнай свой результат!',
  RANK_TABLE: [
    { minLevel: 0, maxLevel: 3, rank: 0 },
    { minLevel: 4, maxLevel: 5, rank: 1 },
    { minLevel: 6, maxLevel: 7, rank: 2 },
    { minLevel: 8, maxLevel: Infinity, rank: 3 },
  ] as { minLevel: number; maxLevel: number; rank: number }[],

  // — Цвета (не-редактируемые, но в S для единообразия) —
  FIGURE_COLORS: FIGURE_COLORS_CONST as readonly string[],
  FIGURE_SHAPES: FIGURE_SHAPES_CONST as readonly string[],
  COLOR_PALETTE: {
    'blue':   '#9487DF',
    'yellow': '#F4EB8C',
    'orange': '#F6C578',
    'red':    '#EC775E',
  } as Record<string, string>,
  MIXED_COLOR_MAP: {} as Record<string, { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string }>,
  TEXTURE_COLORS: {
    'blue':    '#9487DF',
    'orange':  '#F6C578',
    'red':     '#EC775E',
    'yellow':  '#F4EB8C',
    'white':   '#FFFFFF',
  } as Record<string, string>,

  // — Коллизии (не-редактируемые) —
  COLLISION_CATEGORY: {
    DEFAULT: 0x0001,
    FLOOR: 0x0002,
    WALL: 0x0004,
    FIGURE: 0x0008,
    NEW_FIGURE: 0x0010,
    PLATFORM: 0x0020,
    COIN: 0x0040,
    METEORITE: 0x0080,
  },
  COLLISION_MASK: {
    FLOOR: 0x0008 | 0x0001,
    WALL: 0x0008 | 0x0010 | 0x0001 | 0x0080,
    FIGURE: 0x0002 | 0x0004 | 0x0008 | 0x0010 | 0x0040 | 0x0080,
    NEW_FIGURE: 0x0004 | 0x0010 | 0x0008 | 0x0020,
    PLATFORM: 0x0010,
    COIN: 0x0008 | 0x0010,
    METEORITE: 0x0008 | 0x0010 | 0x0004,
  },
};

// ——— Mutable settings store ——————————————————————————————————————————————

export const S: typeof DEFAULTS = { ...DEFAULTS };

// ——— Persistence ————————————————————————————————————————————————————————

const STORAGE_KEY = 'ya_edu_settings';

function jsonReplacer(_k: string, v: unknown) {
  return v === Infinity ? '__Infinity__' : v;
}

function jsonReviver(_k: string, v: unknown) {
  return v === '__Infinity__' ? Infinity : v;
}

export function getDefaults() {
  return { ...DEFAULTS };
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw, jsonReviver);
    Object.assign(S, saved);
  } catch { /* ignore corrupt data */ }
}

export function saveSettings(partial: Partial<typeof DEFAULTS>) {
  Object.assign(S, partial);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(S, jsonReplacer));
}

export function resetSettings() {
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(S, DEFAULTS);
}

export function getAllSettings(): Record<string, unknown> {
  return { ...S };
}

// ——— Server-side persistence (cross-origin sync) ————————————————————————

export async function saveSettingsToServer() {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(S, jsonReplacer),
    });
  } catch { /* ignore network errors */ }
}

export async function loadSettingsFromServer() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return;
    const text = await res.text();
    if (!text || text === '{}') return;
    const saved = JSON.parse(text, jsonReviver);
    Object.assign(S, saved);
  } catch { /* ignore network errors */ }
}

export async function resetSettingsOnServer() {
  try {
    await fetch('/api/settings', { method: 'DELETE' });
  } catch { /* ignore network errors */ }
}

// Initialize from localStorage on module load
loadSettings();

// ——— Derived helpers ————————————————————————————————————————————————————

export function getRank(level: number): number {
  const entry = S.RANK_TABLE.find(e => level >= e.minLevel && level <= e.maxLevel);
  return entry ? entry.rank : 3;
}

// ——— Settings UI schema (section → keys) ————————————————————————————————

export const SETTINGS_SECTIONS: { title: string; keys: (keyof typeof DEFAULTS)[] }[] = [
  {
    title: 'Время и скорость',
    keys: ['GAME_DURATION', 'GAME_SPEED', 'PHYSICS_SPEED', 'GRAVITY_DELAY_SEC', 'DEFAULT_GRAVITY'],
  },
  {
    title: 'Уровни',
    keys: ['LEVEL_CONFIG', 'LEVEL_COLOR_START'],
  },
  {
    title: 'Монеты',
    keys: ['COIN_TIME_BONUS_MIN', 'COIN_TIME_BONUS_MAX', 'COIN_MAX_ON_FIELD', 'COIN_SPAWN_DELAY_MIN', 'COIN_SPAWN_DELAY_MAX', 'COIN_LIFETIME_SEC', 'COIN_START_LEVEL', 'COIN_RADIUS', 'COIN_SPRITE_FRAMES', 'COIN_SPRITE_FRAME_SIZE', 'COIN_SPRITE_FPS'],
  },
  {
    title: 'Физика фигур',
    keys: ['FIGURE_FRICTION', 'FIGURE_RESTITUTION', 'FIGURE_LINEAR_DAMPING', 'FIGURE_ANGULAR_DAMPING', 'FIGURE_DRAG_ANGULAR_DAMPING', 'FIGURE_DRAG_LOSS_DISTANCE', 'MAX_FIGURE_VELOCITY', 'FIGURE_THROW_CEILING_OFFSET', 'SPAWN_RADIUS'],
  },
  {
    title: 'Управление (MouseJoint)',
    keys: ['MOUSE_JOINT_MAX_FORCE', 'MOUSE_JOINT_FREQUENCY', 'MOUSE_JOINT_DAMPING', 'RUBBLE_DAMPING_FACTOR', 'MIN_MOUSE_JOINT_FORCE', 'PRESSURE_SMOOTHING_ALPHA', 'WRONG_FIGURE_DRAG', 'DRAG_ZONE_RATIO'],
  },
  {
    title: 'Платформа',
    keys: ['PLATFORM_REST_Y', 'PLATFORM_RISE_SPEED', 'PLATFORM_DESCEND_SPEED', 'PLATFORM_TARGET_Y', 'PLATFORM_HALF_HEIGHT', 'PLATFORM_SPAWN_OFFSET_Y', 'PLATFORM_SPAWN_GAP_Y', 'PLATFORM_SETTLE_TIME', 'PLATFORM_SPAWN_ANGLE', 'REFILL_DELAY_TEXT', 'REFILL_DELAY_PLATFORM'],
  },
  {
    title: 'Метеориты',
    keys: ['METEORITE_START_LEVEL', 'METEORITE_PHASE2_LEVEL', 'METEORITE_PHASE3_LEVEL', 'METEORITE_COMPOSITIONS', 'METEORITE_SPAWN_DELAY_MIN', 'METEORITE_SPAWN_DELAY_MAX', 'METEORITE_DENSITY', 'METEORITE_DESTROY_Y', 'METEORITE_COLOR'],
  },
  {
    title: 'Анимации',
    keys: ['LEVEL_UP_DURATION_SEC', 'LEVEL_UP_FADE_IN_RATIO', 'LEVEL_UP_FADE_OUT_RATIO', 'LEVEL_UP_SCALE_PEAK', 'LEVEL_UP_SCALE_START', 'LEVEL_UP_FONT_SIZE_RATIO', 'LEVEL_UP_X_RATIO', 'LEVEL_UP_Y_RATIO', 'COIN_COLLECT_Y_RATIO', 'FLY_SCALE_END', 'LEVEL_UP_FLY_TARGET_X', 'LEVEL_UP_FLY_TARGET_Y', 'COIN_FLY_TARGET_X', 'COIN_FLY_TARGET_Y'],
  },
  {
    title: 'Рендеринг',
    keys: ['SHADOW_LIGHT_ANGLE', 'SHADOW_LIGHTEN_FACTOR', 'SHADOW_DARKEN_FACTOR', 'WORLD_SCALE', 'FIELD_WIDTH', 'PLATFORM_FILL_STYLE', 'PLATFORM_STROKE_STYLE'],
  },
  {
    title: 'UI-тексты',
    keys: ['HINT_TEXT', 'START_TEXT', 'TUTORIAL_TEXT', 'LEVEL_UP_TEXT_PREFIX', 'COIN_COLLECT_TEXT', 'COIN_COLLECT_COLOR'],
  },
  {
    title: 'QR / Telegram',
    keys: ['QR_BOT_N', 'QR_BOT_C', 'QR_BOT_USERNAME', 'QR_HINT_TEXT', 'RANK_TABLE', 'TELEGRAM_BOT_LINK'],
  },
];
