/** Длительность раунда в секундах */
export const GAME_DURATION = 60;

/** Минимальное кол-во фигур для вызова пополнения */
export const MIN_FIGURES_TO_REFILL = 3;

/** Кол-во новых фигур при пополнении */
export const FIGURES_PER_REFILL = 6;

/** Бонус времени за монету (секунды) */
export const COIN_TIME_BONUS = 10;

/** Доп. шанс появления 2-й монеты в наборе */
export const COIN_SECOND_BONUS_CHANCE = 0.1;

/** Очки за одну правильную фигуру (множится на уровень) */
export const POINTS_PER_FIGURE = 100;

/** Палитра цветов фигур */
export const FIGURE_COLORS = [
  '#00f0f0', // I — cyan
  '#f0f000', // O — yellow
  '#a000f0', // T — purple
  '#00f000', // S — green
  '#f00000', // Z — red
  '#f0a000', // L — orange
  '#0000f0', // J — blue
] as const;

/** Типы фигур */
export const FIGURE_SHAPES = ['I', 'O', 'T', 'S', 'Z', 'L', 'J'] as const;

/** Сила захвата фигуры (impulse magnitude) */
export const GRAB_FORCE = 60;

/** Множитель затухания для нецелевых фигур (0–1, меньше = быстрее тормозит) */
export const WRONG_FIGURE_DRAG = 0.3;

/** Доля верхней части контейнера, где действует затухание */
export const DRAG_ZONE_RATIO = 1 / 8;

/** Подсказка на стрелке */
export const HINT_TEXT = 'кидай вверх';

export type FigureShape = (typeof FIGURE_SHAPES)[number];
export type FigureColor = (typeof FIGURE_COLORS)[number];

export const WORLD_SCALE = 30; // 30 pixels per meter (LEGACY, to be removed)
export const FIELD_WIDTH = 9; // target width in game units

/** Задержка перед включением гравитации (сек) */
export const GRAVITY_DELAY_SEC = 2.0;

/** Стандартная сила гравитации */
export const DEFAULT_GRAVITY = -10;
