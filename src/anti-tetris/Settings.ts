/** Длительность раунда в секундах */
export const GAME_DURATION = 100;

/** Множитель скорости игры (влияет на всё) */
export const GAME_SPEED = 1.0;

/** Множитель скорости физики (влияет только на движение) */
export const PHYSICS_SPEED = 1.6;

/** Настройки по уровням: i — цел. кол-во фигур на поле, k — порог для повышения уровня */
export interface LevelConfig {
  /** Целевое количество фигур на поле при этом уровне */
  i: number;
  /** Кол-во оставшихся фигур, при котором срабатывает пополнение и повышается уровень */
  k: number;
}

export const LEVEL_CONFIG: LevelConfig[] = [
  { i: 4,  k: 2 }, // Level 1
  { i: 4,  k: 2 }, // Level 2
  { i: 5,  k: 3 }, // Level 3
  { i: 5,  k: 3 }, // Level 4
  { i: 6,  k: 3 }, // Level 5
  { i: 6,  k: 3 }, // Level 6
  { i: 7,  k: 3 }, // Level 7
  { i: 7,  k: 3 }, // Level 8
  { i: 8,  k: 3 }, // Level 9
  { i: 8, k: 3 }, // Level 10+
];

/** Уровень, с которого цель начинает учитывать цвет */
export const LEVEL_COLOR_START = 3;

/** Бонус времени за монету (секунды) */
export const COIN_TIME_BONUS = 4;

/** Максимальное количество монет на поле одновременно */
export const COIN_MAX_ON_FIELD = 1;

/** Минимальное время между спауном монет (секунды) */
export const COIN_SPAWN_DELAY_MIN = 5;

/** Максимальное время между спауном монет (секунды) */
export const COIN_SPAWN_DELAY_MAX = 15;

/** Время жизни монеты до её исчезновения (секунды) */
export const COIN_LIFETIME_SEC = 10;

/** Радиус монеты (в игровых единицах) */
export const COIN_RADIUS = 0.5;

/** Палитра цветов фигур (теперь ключи текстур) */
export const FIGURE_COLORS = [
  'blue',
  'orange',
  'red',
  'yellow',
  // 'red-yellow',
  // 'yellow-blue',
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
  // 'red-yellow':  { topLeft: '#EC775E', topRight: '#F4EB8C', bottomLeft: '#F4EB8C', bottomRight: '#EC775E' },
  // 'yellow-blue': { topLeft: '#F4EB8C', topRight: '#9487DF', bottomLeft: '#9487DF', bottomRight: '#F4EB8C' },
};

/** Гекс-цвета для UI (соответствующие текстурам) */
export const TEXTURE_COLORS: Record<(typeof FIGURE_COLORS)[number] | 'white', string> = {
  'blue':    '#9487DF',
  'orange':  '#F6C578',
  'red':     '#EC775E',
  'yellow':  '#F4EB8C',
  // 'red-yellow':  '#F0A16E',
  // 'yellow-blue': '#C4B9DE',
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

/** Текст на стартовом экране */
export const START_TEXT = 'НАЧАТЬ ИГРУ';

/** Текст туториала */
export const TUTORIAL_TEXT = 'КИДАЙ ВВЕРХ';

/** Ссылка на Telegram бота */
export const TELEGRAM_BOT_LINK = import.meta.env.VITE_TELEGRAM_BOT_LINK || 'https://t.me/your_bot_name';

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
export const FIGURE_RESTITUTION = 0.3;

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

/** Отступ выше видимого поля, при превышении которого фигура считается выброшенной (в игровых единицах) */
export const FIGURE_THROW_CEILING_OFFSET = 2.0;

export const SPAWN_RADIUS = 2.0;

/** Collision Categories */
export const COLLISION_CATEGORY = {
  DEFAULT: 0x0001,
  FLOOR: 0x0002,
  WALL: 0x0004,
  FIGURE: 0x0008,
  NEW_FIGURE: 0x0010,
  PLATFORM: 0x0020,
  COIN: 0x0040,
  METEORITE: 0x0080,
};

/** Collision Masks */
export const COLLISION_MASK = {
  FLOOR: COLLISION_CATEGORY.FIGURE | COLLISION_CATEGORY.DEFAULT,
  WALL: COLLISION_CATEGORY.FIGURE | COLLISION_CATEGORY.NEW_FIGURE | COLLISION_CATEGORY.PLATFORM | COLLISION_CATEGORY.DEFAULT | COLLISION_CATEGORY.METEORITE,
  FIGURE: COLLISION_CATEGORY.FLOOR | COLLISION_CATEGORY.WALL | COLLISION_CATEGORY.FIGURE | COLLISION_CATEGORY.NEW_FIGURE | COLLISION_CATEGORY.PLATFORM | COLLISION_CATEGORY.COIN | COLLISION_CATEGORY.METEORITE,
  NEW_FIGURE: COLLISION_CATEGORY.WALL | COLLISION_CATEGORY.FIGURE | COLLISION_CATEGORY.NEW_FIGURE | COLLISION_CATEGORY.PLATFORM | COLLISION_CATEGORY.COIN | COLLISION_CATEGORY.METEORITE,
  PLATFORM: COLLISION_CATEGORY.FIGURE | COLLISION_CATEGORY.NEW_FIGURE | COLLISION_CATEGORY.WALL,
  COIN: COLLISION_CATEGORY.FIGURE | COLLISION_CATEGORY.NEW_FIGURE,
  METEORITE: COLLISION_CATEGORY.FIGURE | COLLISION_CATEGORY.NEW_FIGURE | COLLISION_CATEGORY.WALL,
};

/** Начальная Y-позиция появляющейся платформы (ниже экрана) */
export const PLATFORM_START_Y = -8;

/** Скорость подъема платформы */
export const PLATFORM_SPEED = 8;

/** Отступ по Y для первой фигуры на платформе */
export const PLATFORM_SPAWN_OFFSET_Y = 2;

/** Вертикальный зазор между фигурами на платформе */
export const PLATFORM_SPAWN_GAP_Y = 2.5;

/** Буфер по Y между топовой фигурой и уровнем пола при расчёте старта платформы */
export const PLATFORM_MIN_Y_BUFFER = 2;

/** Цвет заливки платформы */
export const PLATFORM_FILL_STYLE = 'rgba(148, 135, 223, 0.3)';

/** Цвет обводки платформы */
export const PLATFORM_STROKE_STYLE = '#9487DF';

// ——— Анимация нового уровня ——————————————————————————————————————————————————

/** Длительность анимации надписи "новый уровень" (секунды) */
export const LEVEL_UP_DURATION_SEC = 1.0;

/** Доля длительности, уходящая на плавное появление */
export const LEVEL_UP_FADE_IN_RATIO = 0.15;

/** Доля длительности, уходящая на плавное исчезновение */
export const LEVEL_UP_FADE_OUT_RATIO = 0.35;

/** Пиковый масштаб текста в момент появления */
export const LEVEL_UP_SCALE_PEAK = 1.3;

/** Начальный масштаб текста при появлении */
export const LEVEL_UP_SCALE_START = 0.7;

/** Размер шрифта как доля от ширины игрового поля (в игровых единицах × scale) */
export const LEVEL_UP_FONT_SIZE_RATIO = 0.096;

/** Текст перед номером нового уровня */
export const LEVEL_UP_TEXT_PREFIX = 'УРОВЕНЬ';

/** Горизонтальная позиция надписи "новый уровень" (доля ширины холста, 0–1) */
export const LEVEL_UP_X_RATIO = 0.5;

/** Вертикальная позиция надписи "новый уровень" (доля высоты холста, 0–1) */
export const LEVEL_UP_Y_RATIO = 0.5;

// ——— Анимация сбора монеты ——————————————————————————————————————————————————

/** Текст при сборе монеты */
export const COIN_COLLECT_TEXT = 'ВРЕМЯ';

/** Вертикальная позиция надписи сбора монеты (доля высоты холста, 0–1) */
export const COIN_COLLECT_Y_RATIO = 0.35;

/** Цвет надписи сбора монеты */
export const COIN_COLLECT_COLOR = '#F4EB8C';

// ——— Метеорит ——————————————————————————————————————————————————————————————

/** Уровень, с которого начинают падать метеориты */
export const METEORITE_START_LEVEL = 5;

/** Минимальное время между спауном метеоритов (секунды) */
export const METEORITE_SPAWN_DELAY_MIN = 2;

/** Максимальное время между спауном метеоритов (секунды) */
export const METEORITE_SPAWN_DELAY_MAX = 10;

/** Максимальное количество метеоритов на поле одновременно */
export const METEORITE_MAX_ON_FIELD = 1;

/** Плотность каждого блока метеорита (2 блока × 4.0 = масса 8, фигура ~4) */
export const METEORITE_DENSITY = 4.0;

/** Y-порог, ниже которого метеорит уничтожается */
export const METEORITE_DESTROY_Y = -40;

/** Цветовой ключ метеорита для рендеринга */
export const METEORITE_COLOR = 'white';

