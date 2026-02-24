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
    expect(loop.getFigures().length).toBe(7);
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

  it('spawns 7 figures during WAITING state initialisation', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    expect(loop.getFigures().length).toBe(7);
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
    while (figures.length > Settings.MIN_FIGURES_TO_REFILL) {
      const fig = figures.pop()!;
      fig.destroy(world);
    }
    expect(figures.length).toBe(Settings.MIN_FIGURES_TO_REFILL);

    // Run enough steps so onUpdate fires and triggers a refill
    const fps60 = 1000 / 60;
    for (let i = 0; i < 5; i++) {
      loop.step(i * fps60);
    }

    // Level must have incremented (refill started)
    expect(loop.getState().level).toBeGreaterThanOrEqual(2);

    // isRefilling should be true (batch not yet complete) -- or already done if
    // physics resolved quickly. Either way, figure count must not go below threshold.
    expect(loop.getFigures().length).toBeGreaterThanOrEqual(Settings.MIN_FIGURES_TO_REFILL);
  });

  it('spawns a platform and all new figures at once during refill', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    // Capture figure count before manual refill
    const countBefore = loop.getFigures().length;

    // Call refill directly (private method)
    (loop as any).refill();

    // Immediately after: all FIGURES_PER_REFILL figures should have been added, marked as new figures
    expect(loop.getFigures().length).toBe(countBefore + Settings.FIGURES_PER_REFILL);
    expect((loop as any).isRefilling).toBe(true);
    expect((loop as any).platformBody).toBeDefined();

    // Check that new figures are marked as isNewFigure
    const newFigures = loop.getFigures().slice(-Settings.FIGURES_PER_REFILL);
    for (const fig of newFigures) {
      expect(fig.isNewFigure).toBe(true);
    }
  });

  it('does not trigger a second refill if one is already in progress', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    // Initial figures: 7
    const initialFigureCount = loop.getFigures().length;

    // Trigger first refill manually
    (loop as any).refill();

    // After one refill, we should have 7 + 4 = 11 figures
    expect(loop.getFigures().length).toBe(initialFigureCount + Settings.FIGURES_PER_REFILL);

    // Call refill again while isRefilling is true
    (loop as any).refill();

    // The count shouldn't have changed, because of the early return
    expect(loop.getFigures().length).toBe(initialFigureCount + Settings.FIGURES_PER_REFILL);
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

    // The last FIGURES_PER_REFILL figures should no longer be marked isNewFigure
    const newFigures = loop.getFigures().slice(-Settings.FIGURES_PER_REFILL);
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
    firstFigure.body.setPosition({ x: FIELD_W / 2, y: -21 });
    
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

  it('target color is white on levels 2 and 3', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    // Force level 2 by calling refill twice (private method access via cast)
    (loop as any).refill();
    expect(loop.getState().level).toBe(2);
    expect(loop.getState().targetColor).toBe('white');
    (loop as any).isRefilling = false; // Bypass refill lock

    (loop as any).refill();
    expect(loop.getState().level).toBe(3);
    expect(loop.getState().targetColor).toBe('white');
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
// White block mechanic
// ---------------------------------------------------------------------------
describe('AntiTetrisLoop – white block: spawning', () => {
  /**
   * Step the physics world until the sequential spawn pipeline has finished
   * (isRefilling becomes false). Safety cap prevents infinite loops.
   */
  function drainSpawnQueue(loop: AntiTetrisLoop) {
    const fps60 = 1000 / 60;
    let t = (loop as any).lastTime || 0;
    for (let i = 0; i < 600 && (loop as any).isRefilling; i++) {
      t += fps60;
      loop.step(t);
    }
  }

  /** Advance loop to a given level, waiting for each batch to fully land. */
  function advanceToLevel(loop: AntiTetrisLoop, targetLevel: number) {
    while (loop.getState().level < targetLevel) {
      (loop as any).refill();
      drainSpawnQueue(loop);
      // Let's destroy all old figures to prevent piling up and deadlocking the spawn pipeline
      // We keep Settings.MIN_FIGURES_TO_REFILL + 1 to prevent auto-refill triggering
      const world = loop.getWorld();
      const figures = loop.getFigures();
      while (figures.length > Settings.MIN_FIGURES_TO_REFILL + 1) {
        figures.shift()!.destroy(world);
      }
    }
  }

  /** Start the game (enable gravity) */
  function startGame(loop: AntiTetrisLoop) {
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });
  }

  it('no white block figures before level 8', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    startGame(loop);
    advanceToLevel(loop, Settings.LEVEL_WHITE_BLOCK_START - 1);

    const hasAny = loop.getFigures().some(f => f.hasWhiteBlock);
    expect(hasAny).toBe(false);
  });

  it('at least one white block figure spawns on refill at level 8', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    startGame(loop);
    // Advance to just before the threshold, then trigger the level-8 refill
    advanceToLevel(loop, Settings.LEVEL_WHITE_BLOCK_START - 1);

    // This refill call bumps level to LEVEL_WHITE_BLOCK_START and should
    // include exactly one white block figure
    (loop as any).refill();
    drainSpawnQueue(loop); // wait for all figures in the batch to land
    expect(loop.getState().level).toBe(Settings.LEVEL_WHITE_BLOCK_START);

    const whiteBlockFigures = loop.getFigures().filter(f => f.hasWhiteBlock);
    expect(whiteBlockFigures.length).toBe(1);
  });

  it('white block figure has a valid whiteBlockIndex', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    startGame(loop);
    advanceToLevel(loop, Settings.LEVEL_WHITE_BLOCK_START - 1);
    (loop as any).refill();
    drainSpawnQueue(loop);

    const wbFig = loop.getFigures().find(f => f.hasWhiteBlock)!;
    expect(wbFig).toBeDefined();
    expect(wbFig.whiteBlockIndex).toBeGreaterThanOrEqual(0);

    // Count fixtures on body (should equal number of blocks in the shape)
    let fixtureCount = 0;
    for (let f = wbFig.body.getFixtureList(); f; f = f.getNext()) fixtureCount++;
    expect(wbFig.whiteBlockIndex).toBeLessThan(fixtureCount);
  });
});


describe('AntiTetrisLoop – white block: gravity doubling', () => {
  function drainSpawnQueue(loop: AntiTetrisLoop) {
    const fps60 = 1000 / 60;
    let t = (loop as any).lastTime || 0;
    for (let i = 0; i < 600 && (loop as any).isRefilling; i++) {
      t += fps60;
      loop.step(t);
    }
  }

  function advanceToLevel(loop: AntiTetrisLoop, targetLevel: number) {
    while (loop.getState().level < targetLevel) {
      (loop as any).refill();
      drainSpawnQueue(loop);
      // Let's destroy all figures to prevent piling up and deadlocking the spawn pipeline
      const world = loop.getWorld();
      const figures = loop.getFigures();
      while (figures.length > 0) {
        figures.pop()!.destroy(world);
      }
    }
  }

  it('gravity doubles to HEAVY_GRAVITY when a white-block figure is on field', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    // Start the game so gravity is active
    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });
    expect(loop.getState().status).toBe('PLAYING');

    // Advance to level 8 so a white block is present
    advanceToLevel(loop, Settings.LEVEL_WHITE_BLOCK_START - 1);
    (loop as any).refill(); // triggers level 8 refill with white block
    drainSpawnQueue(loop); // wait for all figures including white-block to land

    const hasWB = loop.getFigures().some(f => f.hasWhiteBlock);
    expect(hasWB).toBe(true);

    // Run a couple of steps so onUpdate picks up the white block
    const fps60 = 1000 / 60;
    for (let i = 0; i < 5; i++) loop.step(i * fps60);

    expect(loop.getWorld().getGravity().y).toBe(Settings.HEAVY_GRAVITY);
  });

  it('gravity returns to DEFAULT_GRAVITY when all white-block figures are removed', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    loop.handleInput({ isPressed: true, x: FIELD_W / 2, y: FIELD_H / 2 });
    advanceToLevel(loop, Settings.LEVEL_WHITE_BLOCK_START - 1);
    (loop as any).refill();
    drainSpawnQueue(loop);

    // Run a step to let onUpdate apply heavy gravity
    const fps60 = 1000 / 60;
    // We must pass a large enough 't' so physics steps actually run
    let targetTime = (loop as any).lastTime + 5 * fps60;
    loop.step(targetTime);
    expect(loop.getWorld().getGravity().y).toBe(Settings.HEAVY_GRAVITY);

    // Spawn a dummy regular figure so dropping the white block doesn't trigger a refill
    (loop as any).spawnFigure(FIELD_W / 2, FIELD_H / 2, false, false);

    // Destroy all white-block figures
    const world = loop.getWorld();
    const figures = loop.getFigures();
    for (let i = figures.length - 1; i >= 0; i--) {
      if (figures[i]!.hasWhiteBlock) {
        figures[i]!.destroy(world);
        figures.splice(i, 1);
      }
    }
    expect(loop.getFigures().some(f => f.hasWhiteBlock)).toBe(false);

    // Step again so onUpdate detects no white block and restores gravity
    targetTime += 5 * fps60;
    loop.step(targetTime);

    expect(loop.getWorld().getGravity().y).toBe(Settings.DEFAULT_GRAVITY);
  });
});


