import { describe, it, expect, beforeEach } from 'vitest';
import { AntiTetrisLoop, type GameState } from '../GameLoop';
import * as Settings from '../Settings';

/**
 * Integration tests for AntiTetrisLoop.
 *
 * These run the real Planck physics engine (no mocks) and verify
 * that the game initialises, steps, and responds to input without
 * throwing any errors.
 */

const FIELD_W = Settings.FIELD_WIDTH;
const FIELD_H = FIELD_W * (13 / 9); // 9:13 aspect ratio (from the project)

/** Start the game and wait for the platform settle phase to complete. */
function startGameAndSettle(loop: AntiTetrisLoop): void {
  loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });
  const fps60 = 1000 / 60;
  loop.step(1);
  for (let i = 1; i <= 120; i++) {
    loop.step(1 + i * fps60);
  }
}

/** Force refill() to work by setting platform state, simulate delay + platform arrival, then reset. */
function forceRefill(loop: AntiTetrisLoop): void {
  (loop as any).platformLoaded = true;
  (loop as any).platformPhase = 'idle';
  (loop as any).refill();
  // Simulate the delay sequence: level increments during delay, then platform rises
  (loop as any).state.level++;
  (loop as any).refillDelayTextShown = true;
  (loop as any).isRefilling = false;
  (loop as any).platformPhase = 'idle';
  (loop as any).platformLoaded = true;
}

describe('AntiTetrisLoop – initialisation', () => {
  it('constructs without errors (fast precompute mode)', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    expect(loop).toBeDefined();
  });

  it('constructs without errors (slow / debug mode)', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, true);
    expect(loop).toBeDefined();
  });

  it('spawns the expected number of initial figures (WAITING state)', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    expect(loop.getFigures().length).toBe(Settings.LEVEL_CONFIG[0]!.i);
  });

  it('has a valid initial game state', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    const state: GameState = loop.getState();

    expect(state.level).toBe(1);
    expect(state.timer).toBe(Settings.GAME_DURATION);
    expect(state.isGameOver).toBe(false);
    expect(Settings.FIGURE_SHAPES).toContain(state.targetShape);
  });

  it('starts in WAITING state with zero gravity', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    const state = loop.getState();
    expect(state.status).toBe('WAITING');
    expect(loop.getWorld().getGravity().y).toBe(0);
  });

  it('spawns level-1 figure count during WAITING state initialisation', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    expect(loop.getFigures().length).toBe(Settings.LEVEL_CONFIG[0]!.i);
  });
});

describe('AntiTetrisLoop – start transition', () => {
  it('transitions from WAITING to PLAYING on input', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    expect(loop.getState().status).toBe('WAITING');

    // Simulate input
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    expect(loop.getState().status).toBe('PLAYING');
    expect(loop.getState().tutorialActive).toBe(true);
    expect(loop.getWorld().getGravity().y).toBe(Settings.DEFAULT_GRAVITY);
  });

  it('creates platform when game starts', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    expect(loop.getPlatformBody()).toBeNull();

    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });
    expect(loop.getPlatformBody()).not.toBeNull();
  });

  it('platform starts at rest position', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    const pos = loop.getPlatformBody().getPosition();
    expect(pos.y).toBe(Settings.PLATFORM_REST_Y);
  });

  it('hides tutorial after first figure is thrown', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    // Start game
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });
    expect(loop.getState().tutorialActive).toBe(true);

    const figures = loop.getFigures();
    // Find a regular figure (not pre-spawned)
    const regularFig = figures.find(f => !f.isNewFigure)!;
    const idx = figures.indexOf(regularFig);

    // Simulate throwing a figure (manual call to handleFigureThrown)
    loop['handleFigureThrown'](regularFig, idx);

    expect(loop.getState().tutorialActive).toBe(false);
    expect(loop.getState().hintVisible).toBe(false);
  });
});

describe('AntiTetrisLoop – stepping', () => {
  let loop: AntiTetrisLoop;

  beforeEach(() => {
    loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
  });

  it('runs a single physics step without errors', () => {
    // First call sets lastTime; second call runs the actual step
    loop.step(0);
    loop.step(16); // ~1 frame at 60 fps
  });

  it('runs 300 steps (≈5 s at 60 fps) without errors (WAITING stage)', () => {
    const fps60 = 1000 / 60;
    for (let i = 0; i < 300; i++) {
      loop.step(i * fps60);
    }
    // Timer should NOT have decreased in WAITING state
    const state = loop.getState();
    expect(state.timer).toBe(Settings.GAME_DURATION);
  });

  it('figures stay inside the field after 300 steps', () => {
    const fps60 = 1000 / 60;
    for (let i = 0; i < 300; i++) {
      loop.step(i * fps60);
    }

    for (const figure of loop.getFigures()) {
      const pos = figure.body.getPosition();
      // Figures should be above the floor (y >= 0)
      expect(pos.y).toBeGreaterThanOrEqual(-1);
      // Figures should be inside horizontal bounds
      expect(pos.x).toBeGreaterThan(-5);
      expect(pos.x).toBeLessThan(FIELD_W + 5);
    }
  });
});

describe('AntiTetrisLoop – input handling', () => {
  let loop: AntiTetrisLoop;

  beforeEach(() => {
    loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    // Let figures settle a bit
    const fps60 = 1000 / 60;
    for (let i = 0; i < 120; i++) {
      loop.step(i * fps60);
    }
  });

  it('handles justPressed on empty area without errors', () => {
    loop.handleInput({ justPressed: true, isPressed: true, justReleased: false, x: 0, y: 0 });
  });

  it('handles press → hold → release cycle without errors', () => {
    const figures = loop.getFigures();
    const firstFigure = figures[0]!;
    const pos = firstFigure.body.getPosition();

    // Press on the figure
    loop.handleInput({ justPressed: true, isPressed: true, justReleased: false, x: pos.x, y: pos.y });

    // Hold and drag upwards a few frames
    const fps60 = 1000 / 60;
    let t = 120 * fps60;
    for (let i = 0; i < 30; i++) {
      t += fps60;
      loop.step(t);
      loop.handleInput({ justPressed: false, isPressed: true, justReleased: false, x: pos.x, y: pos.y + i * 0.5 });
    }

    // Release
    loop.handleInput({ justPressed: false, isPressed: false, justReleased: true, x: pos.x, y: pos.y + 15 });
  });
});

describe('AntiTetrisLoop – platform refill', () => {
  it('refills figures when count drops below threshold', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    startGameAndSettle(loop);

    // Manually destroy regular figures down to the trigger threshold
    const world = loop.getWorld();
    const figures = loop.getFigures();
    const threshold = Settings.LEVEL_CONFIG[0]!.k;
    while (figures.filter(f => !f.isNewFigure).length > threshold) {
      const idx = figures.findIndex(f => !f.isNewFigure);
      if (idx === -1) break;
      figures[idx]!.destroy(world);
      figures.splice(idx, 1);
    }

    // Step enough for: refill trigger + platform rise (15 units at 9 u/s ≈ 1.67s ≈ 100 frames)
    const fps60 = 1000 / 60;
    for (let i = 0; i < 200; i++) {
      loop.step(200 + i * fps60);
    }

    // Level must have incremented (platform reached the top)
    expect(loop.getState().level).toBeGreaterThanOrEqual(2);
  });

  it('pre-spawns NEW_FIGURE figures below the field', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    // After starting, pre-spawned NEW_FIGURE figures should exist
    const fps60 = 1000 / 60;
    loop.step(1);
    loop.step(1 + fps60);

    const newFigures = loop.getFigures().filter(f => f.isNewFigure);
    expect(newFigures.length).toBeGreaterThan(0);
    for (const fig of newFigures) {
      expect(fig.body.getPosition().y).toBeLessThan(0);
    }
  });

  it('platform loaded after settle time', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    startGameAndSettle(loop);

    expect((loop as any).platformLoaded).toBe(true);
    expect((loop as any).platformPhase).toBe('idle');
  });

  it('does not trigger a second refill if one is already in progress', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    startGameAndSettle(loop);

    const initialLevel = loop.getState().level;

    // Trigger first refill (starts delay sequence, not rising immediately)
    (loop as any).refill();
    expect((loop as any).isRefilling).toBe(true);

    // Second call should be a no-op (isRefilling guard)
    (loop as any).refill();
    // Level hasn't changed yet — it increments after REFILL_DELAY_TEXT
    expect(loop.getState().level).toBe(initialLevel);
  });

  it('converts all NEW_FIGURE to regular when platform reaches floor', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    startGameAndSettle(loop);

    // Destroy enough regular figures to trigger refill
    const world = loop.getWorld();
    const figures = loop.getFigures();
    const threshold = Settings.LEVEL_CONFIG[0]!.k;
    while (figures.filter(f => !f.isNewFigure).length > threshold) {
      const idx = figures.findIndex(f => !f.isNewFigure);
      if (idx === -1) break;
      figures[idx]!.destroy(world);
      figures.splice(idx, 1);
    }

    // Step enough for: refill trigger → platform rise → conversion → descent → settle
    const fps60 = 1000 / 60;
    for (let i = 0; i < 600; i++) {
      loop.step(300 + i * fps60);
    }

    // After full cycle, all figures on the field should be regular
    const regularOnField = loop.getFigures().filter(f => !f.isNewFigure && f.body.getPosition().y > 0);
    expect(regularOnField.length).toBeGreaterThan(0);
  });

  it('platform completes full cycle and returns to idle', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    startGameAndSettle(loop);

    // Trigger refill
    const world = loop.getWorld();
    const figures = loop.getFigures();
    const threshold = Settings.LEVEL_CONFIG[0]!.k;
    while (figures.filter(f => !f.isNewFigure).length > threshold) {
      const idx = figures.findIndex(f => !f.isNewFigure);
      if (idx === -1) break;
      figures[idx]!.destroy(world);
      figures.splice(idx, 1);
    }

    // Step through full cycle
    const fps60 = 1000 / 60;
    for (let i = 0; i < 600; i++) {
      loop.step(300 + i * fps60);
    }

    // Platform should be back to idle with new figures loaded
    expect((loop as any).platformPhase).toBe('idle');
    expect((loop as any).platformLoaded).toBe(true);
  });

  it('refill only counts regular figures (excludes pre-spawned)', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    // After starting, there should be both regular and new figures
    const fps60 = 1000 / 60;
    loop.step(1);
    loop.step(1 + fps60);

    const total = loop.getFigures().length;
    const regular = loop.getFigures().filter(f => !f.isNewFigure).length;
    const newFigs = loop.getFigures().filter(f => f.isNewFigure).length;

    expect(newFigs).toBeGreaterThan(0);
    expect(regular + newFigs).toBe(total);
  });
});


describe('AntiTetrisLoop – timer logic', () => {
  it('does not decrease timer in WAITING state', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    const initialTimer = loop.getState().timer;

    // Step a few frames
    const fps60 = 1000 / 60;
    for (let i = 0; i < 10; i++) loop.step(i * fps60);

    expect(loop.getState().timer).toBe(initialTimer);
  });

  it('decreases timer only in PLAYING state', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false, 10);
    const initialTimer = loop.getState().timer;
    expect(initialTimer).toBe(10);

    // Start game
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });
    expect(loop.getState().status).toBe('PLAYING');

    // Step multiple frames to ensure a measurable decrease
    const fps60 = 1000 / 60;
    for (let i = 0; i < 10; i++) {
      loop.step(i * fps60);
    }

    expect(loop.getState().timer).toBeLessThan(initialTimer);
  });

  it('enters game-over state when timer expires', () => {
    const TEST_DURATION = 0.1; // very short
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false, TEST_DURATION);

    // Start game
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    // Simulate enough frames to drain the timer
    const fps60 = 1000 / 60;
    for (let i = 0; i < 20; i++) {
      loop.step(i * fps60);
    }

    expect(loop.getState().isGameOver).toBe(true);
    expect(loop.getState().timer).toBe(0);
  });
});

describe('AntiTetrisLoop – OOB safeguards', () => {
  it('removes figures that fall below the floor', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    // Ensure initialization is done
    const fps60 = 1000 / 60;
    loop.step(0);
    for (let i = 0; i < 10; i++) loop.step((i + 1) * fps60);

    const figures = loop.getFigures();
    const firstFigure = figures[0]!;

    // Teleport figure below floor
    firstFigure.body.setLinearVelocity({ x: 0, y: 0 });
    firstFigure.body.setPosition({ x: FIELD_W / 2, y: -45 });

    // Step to trigger onUpdate (OOB check)
    loop.step(100 * fps60);

    expect(loop.getFigures()).not.toContain(firstFigure);
  });

  it('removes figures that fly too far sideways', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    // Ensure initialization is done
    const fps60 = 1000 / 60;
    loop.step(0);
    for (let i = 0; i < 10; i++) loop.step((i + 1) * fps60);

    const figures = loop.getFigures();
    const firstFigure = figures[0]!;

    // Teleport figure far left
    firstFigure.body.setPosition({ x: -FIELD_W - 5, y: FIELD_H / 2 });

    // Step to trigger onUpdate
    loop.step(100 * fps60);

    expect(loop.getFigures()).not.toContain(firstFigure);
  });
});

// ---------------------------------------------------------------------------
// Level progression – target color rules
// ---------------------------------------------------------------------------
describe('AntiTetrisLoop – level progression: target color', () => {
  it('target color is white on level 1 (no color match required)', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    expect(loop.getState().level).toBe(1);
    expect(loop.getState().targetColor).toBe('white');
  });

  it('target color is white on levels below LEVEL_COLOR_START', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    // Advance through all levels that should still be white
    for (let lvl = 1; lvl < Settings.LEVEL_COLOR_START; lvl++) {
      forceRefill(loop);
      expect(loop.getState().level).toBe(lvl + 1);
      if (lvl + 1 < Settings.LEVEL_COLOR_START) {
        expect(loop.getState().targetColor).toBe('white');
      }
    }
  });

  it('target color is a real color from level 4 onwards when updateTarget is called', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    // Fast-forward to level 4
    for (let lvl = 1; lvl < Settings.LEVEL_COLOR_START; lvl++) {
      forceRefill(loop);
    }
    expect(loop.getState().level).toBe(Settings.LEVEL_COLOR_START);

    // Simulate what happens when the target figure is thrown (updateTarget called)
    (loop as any).updateTarget();
    // targetColor must now be a real figure color, not 'white'
    expect(Settings.FIGURE_COLORS).toContain(loop.getState().targetColor as any);
  });
});

// ---------------------------------------------------------------------------
// Target persistence on level-up
// ---------------------------------------------------------------------------
describe('AntiTetrisLoop – target persistence on level-up', () => {
  it('does not change target when refilling (level-up)', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    startGameAndSettle(loop);

    const before = { ...loop.getState() };
    const targetShape = before.targetShape;
    const targetColor = before.targetColor;

    // Trigger refill — level does NOT increment immediately (only when platform arrives)
    (loop as any).refill();
    (loop as any).isRefilling = false;
    (loop as any).platformPhase = 'idle';

    const after = loop.getState();
    expect(after.targetShape).toBe(targetShape);
    expect(after.targetColor).toBe(targetColor);
    // Level stays the same until platform reaches the top
    expect(after.level).toBe(before.level);
  });
});

// ---------------------------------------------------------------------------
// Coins collected counter
// ---------------------------------------------------------------------------
describe('AntiTetrisLoop – coinsCollected counter', () => {
  it('starts at zero', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    expect(loop.getState().coinsCollected).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Meteorite mechanic
// ---------------------------------------------------------------------------
describe('AntiTetrisLoop – meteorite mechanic', () => {
  it('does not spawn meteorites before METEORITE_START_LEVEL', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    // Force timer to expire so a meteorite would spawn if allowed
    (loop as any).meteoriteSpawnTimer = 0;

    const fps60 = 1000 / 60;
    for (let i = 0; i < 10; i++) {
      loop.step(i * fps60);
    }

    expect(loop.getMeteorites().length).toBe(0);
  });

  it('spawns meteorites after reaching METEORITE_START_LEVEL', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    // Fast-forward to meteorite level
    for (let lvl = 1; lvl < Settings.METEORITE_START_LEVEL; lvl++) {
      forceRefill(loop);
    }
    expect(loop.getState().level).toBeGreaterThanOrEqual(Settings.METEORITE_START_LEVEL);

    // Force the spawn timer to expire
    (loop as any).meteoriteSpawnTimer = 0;

    // step(1) initialises lastTime; step(1+fps60) runs onUpdate
    const fps60 = 1000 / 60;
    loop.step(1);
    loop.step(1 + fps60);

    expect(loop.getMeteorites().length).toBe(1);
  });

  it('removes meteorites that fall below METEORITE_DESTROY_Y', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    // Fast-forward to meteorite level and spawn one
    for (let lvl = 1; lvl < Settings.METEORITE_START_LEVEL; lvl++) {
      forceRefill(loop);
    }
    (loop as any).meteoriteSpawnTimer = 0;
    const fps60 = 1000 / 60;
    loop.step(1);
    loop.step(1 + fps60);

    const meteorites = loop.getMeteorites();
    expect(meteorites.length).toBe(1);

    // Teleport the meteorite below destroy threshold
    meteorites[0]!.body.setPosition({ x: FIELD_W / 2, y: Settings.METEORITE_DESTROY_Y - 1 });

    // Step to trigger cleanup
    loop.step(1 + 2 * fps60);

    expect(loop.getMeteorites().length).toBe(0);
  });

  it('respects max meteorites on field', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    // Fast-forward to meteorite level
    for (let lvl = 1; lvl < Settings.METEORITE_START_LEVEL; lvl++) {
      forceRefill(loop);
    }

    // Force-spawn one meteorite
    (loop as any).meteoriteSpawnTimer = 0;
    const fps60 = 1000 / 60;
    loop.step(1);
    loop.step(1 + fps60);
    expect(loop.getMeteorites().length).toBe(1);

    // Try to spawn another
    (loop as any).meteoriteSpawnTimer = 0;
    loop.step(1 + 2 * fps60);

    // Should still be 1 (max on field = 1)
    expect(loop.getMeteorites().length).toBe(1);
  });
});
