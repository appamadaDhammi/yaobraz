/** Длительность раунда в секундах */
export const GAME_DURATION = 600;

/** Множитель скорости игры (влияет на всё) */
export const GAME_SPEED = 1.0;

/** Множитель скорости физики (влияет только на движение) */
export const PHYSICS_SPEED = 1.6;

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

/** Палитра цветов фигур (теперь ключи текстур) */
export const FIGURE_COLORS = [
  'blue',
  'orange',
  'red',
  'yellow',
  'red-yellow',
  'yellow-blue',
] as const;

/** Базовые цвета палитры */
export const COLOR_PALETTE: Record<string, string> = {
  'blue':   '#9487DF',
  'yellow': '#F4EB8C',
  'orange': '#F6C578',
  'red':    '#EC775E',
};

/** Раскладка квадрантов для смешанных цветов (2×2) */
export const MIXED_COLOR_MAP: Record<string, { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string }> = {
  'red-yellow':  { topLeft: '#EC775E', topRight: '#F4EB8C', bottomLeft: '#F4EB8C', bottomRight: '#EC775E' },
  'yellow-blue': { topLeft: '#F4EB8C', topRight: '#9487DF', bottomLeft: '#9487DF', bottomRight: '#F4EB8C' },
};

/** Гекс-цвета для UI (соответствующие текстурам) */
export const TEXTURE_COLORS: Record<(typeof FIGURE_COLORS)[number] | 'white', string> = {
  'blue':    '#9487DF',
  'orange':  '#F6C578',
  'red':     '#EC775E',
  'yellow':  '#F4EB8C',
  'red-yellow':  '#F0A16E',
  'yellow-blue': '#C4B9DE',
  'white':   '#FFFFFF',
};
/** Угол падения света для теней блоков (в радианах, 0 = вправо, PI/2 = вниз) */
export const SHADOW_LIGHT_ANGLE = -Math.PI / 8 * 5;

/** Коэффициент осветления для освещенных граней (0-1) */
export const SHADOW_LIGHTEN_FACTOR = 0.15;

/** Коэффициент затемнения для теневых граней (0-1) */
export const SHADOW_DARKEN_FACTOR = 0.05;

/** Типы фигур */
export const FIGURE_SHAPES = ['I', 'O', 'T', 'S', 'Z', 'L', 'J'] as const;

/** Максимальная сила MouseJoint */
export const MOUSE_JOINT_MAX_FORCE = 700;

/** Частота отклика MouseJoint (частота колебаний) */
export const MOUSE_JOINT_FREQUENCY = 15;

/** Коэффициент демпфирования MouseJoint (0-1) */
export const MOUSE_JOINT_DAMPING = 0.9;

/** Коэффициент экспоненциального затухания силы от давления (веса сверху) */
export const RUBBLE_DAMPING_FACTOR = 1.6;

/** Минимальная сила MouseJoint, чтобы фигура не застревала совсем */
export const MIN_MOUSE_JOINT_FORCE = 50;

/** Коэффициент сглаживания давления (0-1, меньше = медленнее изменения) */
export const PRESSURE_SMOOTHING_ALPHA = 0.1;

/** Сила захвата фигуры (impulse magnitude) - LEGACY */
export const LEGACY_GRAB_FORCE = 60;

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

/** Поверхностное трение фигур */
export const FIGURE_FRICTION = 0.3;

/** Упругость фигур (0-1, bounciness) */
export const FIGURE_RESTITUTION = 0.05;

/** Затухание линейной скорости фигуры */
export const FIGURE_LINEAR_DAMPING = 0.1;

/** Затухание угловой скорости фигуры (по умолчанию) */
export const FIGURE_ANGULAR_DAMPING = 0.1;

/** Затухание угловой скорости фигуры ПОД ХВАТОМ (чтобы не крутилась бешено) */
export const FIGURE_DRAG_ANGULAR_DAMPING = 10.0;

/** Дистанция между точкой хвата и таргетом, при которой хват рвется */
export const FIGURE_DRAG_LOSS_DISTANCE = 4.0;

/** Максимальная линейная скорость фигуры (предотвращает туннелирование) */
export const MAX_FIGURE_VELOCITY = 20;
