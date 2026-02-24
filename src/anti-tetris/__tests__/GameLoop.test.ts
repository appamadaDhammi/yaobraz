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

  it('hides tutorial after first figure is thrown', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    
    // Start game
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });
    expect(loop.getState().tutorialActive).toBe(true);

    const figures = loop.getFigures();
    const firstFigure = figures[0]!;
    
    // Simulate throwing a figure (manual call to handleFigureThrown)
    // We use the index of the figure in the array
    loop['handleFigureThrown'](firstFigure, 0);

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

describe('AntiTetrisLoop – refill', () => {
  it('refills figures when count drops below threshold', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    // Transition to PLAYING so refill is active
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    // Manually destroy figures down to the trigger threshold
    const world = loop.getWorld();
    const figures = loop.getFigures();
    const threshold = Settings.LEVEL_CONFIG[0]!.k;
    while (figures.length > threshold) {
      const fig = figures.pop()!;
      fig.destroy(world);
    }
    expect(figures.length).toBe(threshold);

    // Run enough steps so onUpdate fires and triggers a refill
    const fps60 = 1000 / 60;
    for (let i = 0; i < 5; i++) {
      loop.step(i * fps60);
    }

    // Level must have incremented (refill started)
    expect(loop.getState().level).toBeGreaterThanOrEqual(2);

    // isRefilling should be true (batch not yet complete) -- or already done if
    // physics resolved quickly. Either way, figure count must not go below threshold.
    expect(loop.getFigures().length).toBeGreaterThanOrEqual(threshold);
  });

  it('spawns a platform and all new figures at once during refill', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    // Capture figure count before manual refill
    const countBefore = loop.getFigures().length;
    // Spawn count for level 1→2: i(level2) − k(level1)
    const spawnCount = Settings.LEVEL_CONFIG[1]!.i - Settings.LEVEL_CONFIG[0]!.k;

    // Call refill directly (private method)
    (loop as any).refill();

    // Immediately after: all spawned figures should have been added, marked as new figures
    expect(loop.getFigures().length).toBe(countBefore + spawnCount);
    expect((loop as any).isRefilling).toBe(true);
    expect((loop as any).platformBody).toBeDefined();

    // Check that new figures are marked as isNewFigure
    const newFigures = loop.getFigures().slice(-spawnCount);
    for (const fig of newFigures) {
      expect(fig.isNewFigure).toBe(true);
    }
  });

  it('does not trigger a second refill if one is already in progress', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    const initialFigureCount = loop.getFigures().length;
    const spawnCount = Settings.LEVEL_CONFIG[1]!.i - Settings.LEVEL_CONFIG[0]!.k;

    // Trigger first refill manually
    (loop as any).refill();

    expect(loop.getFigures().length).toBe(initialFigureCount + spawnCount);

    // Call refill again while isRefilling is true
    (loop as any).refill();

    // The count shouldn't have changed, because of the early return
    expect(loop.getFigures().length).toBe(initialFigureCount + spawnCount);
    expect((loop as any).isRefilling).toBe(true);
  });

  it('exposes platformBody via getPlatformBody()', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    
    expect(loop.getPlatformBody()).toBeNull();
    
    (loop as any).refill();
    
    expect(loop.getPlatformBody()).toBeDefined();
    expect(loop.getPlatformBody()).not.toBeNull();
  });

  it('converts new figures to regular figures when platform reaches floor level', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    
    // Start the game so gravity and onUpdate mechanics run properly
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });

    (loop as any).refill();
    expect((loop as any).isRefilling).toBe(true);

    const platformBody = loop.getPlatformBody();
    expect(platformBody).not.toBeNull();
    
    // Move platform just below floor
    platformBody.setPosition({ x: 0, y: -0.1 });
    
    // Step loop once to trigger onUpdate and apply physics
    loop.step(1000 / 60);

    // It should still be refilling
    expect((loop as any).isRefilling).toBe(true);

    // Now move platform exactly to / slightly above floor level (0)
    platformBody.setPosition({ x: 0, y: 0.1 });
    
    // Step to trigger onUpdate
    loop.step(1000 / 60 + 1000 / 60); // enough time passed to run onUpdate

    // Refilling should be complete
    expect((loop as any).isRefilling).toBe(false);
    expect(loop.getPlatformBody()).toBeNull();

    // The last spawned figures should no longer be marked isNewFigure
    const spawnCount = Settings.LEVEL_CONFIG[1]!.i - Settings.LEVEL_CONFIG[0]!.k;
    const newFigures = loop.getFigures().slice(-spawnCount);
    for (const fig of newFigures) {
      expect(fig.isNewFigure).toBe(false);
    }
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
    // Note: PHYSICS_SPEED in Settings is 1.6, GAME_SPEED is 1.0. 
    // The timer decreases in onUpdate which is called every loop.step if enough time passed.
    // However, the decrement is based on (1/60) * GAME_SPEED and it assumes 60fps.
    // Actually in step(time):
    // while (this.accumulator >= this.fixedDeltaTime) { 
    //   this.world.step(this.fixedDeltaTime);
    //   this.onUpdate(); ...
    // So timer decreases by fixed amount every fixedDeltaTime.
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
    // We need to run at least one step that updates the accumulator and calls onUpdate
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

    // Advance through all levels that should still be white
    for (let lvl = 1; lvl < Settings.LEVEL_COLOR_START; lvl++) {
      (loop as any).refill();
      (loop as any).isRefilling = false; // Bypass refill lock
      expect(loop.getState().level).toBe(lvl + 1);
      if (lvl + 1 < Settings.LEVEL_COLOR_START) {
        expect(loop.getState().targetColor).toBe('white');
      }
    }
  });

  it('target color is a real color from level 4 onwards', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    // Fast-forward to level 4
    for (let lvl = 1; lvl < Settings.LEVEL_COLOR_START; lvl++) {
      (loop as any).refill();
      (loop as any).isRefilling = false; // Bypass refill lock
    }
    expect(loop.getState().level).toBe(Settings.LEVEL_COLOR_START);
    // targetColor must now be a real figure color, not 'white'
    expect(Settings.FIGURE_COLORS).toContain(loop.getState().targetColor as any);
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
      (loop as any).refill();
      (loop as any).isRefilling = false;
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
      (loop as any).refill();
      (loop as any).isRefilling = false;
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
      (loop as any).refill();
      (loop as any).isRefilling = false;
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
