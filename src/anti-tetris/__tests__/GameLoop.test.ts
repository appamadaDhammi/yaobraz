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

  it('runs 300 steps (≈5 s at 60 fps) without errors', () => {
    const fps60 = 1000 / 60;
    for (let i = 0; i < 300; i++) {
      loop.step(i * fps60);
    }
    // Timer should have decreased
    const state = loop.getState();
    expect(state.timer).toBeLessThan(Settings.GAME_DURATION);
    expect(state.timer).toBeGreaterThan(0);
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

    // Manually destroy figures to trigger refill on next step
    const world = loop.getWorld();
    const figures = loop.getFigures();
    while (figures.length > Settings.MIN_FIGURES_TO_REFILL) {
      const fig = figures.pop()!;
      fig.destroy(world);
    }
    expect(figures.length).toBe(Settings.MIN_FIGURES_TO_REFILL);

    // Run enough steps so onUpdate fires (first call sets lastTime,
    // subsequent calls build up the accumulator past the fixed timeStep)
    const fps60 = 1000 / 60;
    for (let i = 0; i < 5; i++) {
      loop.step(i * fps60);
    }

    // The refill condition is `<= MIN_FIGURES_TO_REFILL`, so being exactly
    // at the threshold triggers refill.
    const state = loop.getState();
    expect(state.level).toBeGreaterThanOrEqual(2);
    expect(loop.getFigures().length).toBeGreaterThanOrEqual(Settings.MIN_FIGURES_TO_REFILL);
  });
});

describe('AntiTetrisLoop – game over', () => {
  it('enters game-over state when timer expires', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    // Simulate enough frames to drain the timer
    const fps60 = 1000 / 60;
    const totalFrames = Math.ceil(Settings.GAME_DURATION * 60 / Settings.GAME_SPEED) + 10;
    for (let i = 0; i < totalFrames; i++) {
      loop.step(i * fps60);
    }

    expect(loop.getState().isGameOver).toBe(true);
    expect(loop.getState().timer).toBe(0);
  }, 15000);
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
    firstFigure.body.setPosition({ x: FIELD_W / 2, y: -10 });
    
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

    (loop as any).refill();
    expect(loop.getState().level).toBe(3);
    expect(loop.getState().targetColor).toBe('white');
  });

  it('target color is a real color from level 4 onwards', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);

    // Fast-forward to level 4
    for (let lvl = 1; lvl < Settings.LEVEL_COLOR_START; lvl++) {
      (loop as any).refill();
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
  /** Advance loop to a given level by calling private refill repeatedly */
  function advanceToLevel(loop: AntiTetrisLoop, targetLevel: number) {
    while (loop.getState().level < targetLevel) {
      (loop as any).refill();
    }
  }

  it('no white block figures before level 8', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    advanceToLevel(loop, Settings.LEVEL_WHITE_BLOCK_START - 1);

    const hasAny = loop.getFigures().some(f => f.hasWhiteBlock);
    expect(hasAny).toBe(false);
  });

  it('at least one white block figure spawns on refill at level 8', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    // Advance to just before the threshold, then trigger the level-8 refill
    advanceToLevel(loop, Settings.LEVEL_WHITE_BLOCK_START - 1);

    // This refill call bumps level to LEVEL_WHITE_BLOCK_START and should
    // include exactly one white block figure
    (loop as any).refill();
    expect(loop.getState().level).toBe(Settings.LEVEL_WHITE_BLOCK_START);

    const whiteBlockFigures = loop.getFigures().filter(f => f.hasWhiteBlock);
    expect(whiteBlockFigures.length).toBe(1);
  });

  it('white block figure has a valid whiteBlockIndex', () => {
    const loop = new AntiTetrisLoop(FIELD_W, FIELD_H, false);
    advanceToLevel(loop, Settings.LEVEL_WHITE_BLOCK_START - 1);
    (loop as any).refill();

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
  function advanceToLevel(loop: AntiTetrisLoop, targetLevel: number) {
    while (loop.getState().level < targetLevel) {
      (loop as any).refill();
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

    // Run a step to let onUpdate apply heavy gravity
    const fps60 = 1000 / 60;
    for (let i = 0; i < 5; i++) loop.step(i * fps60);
    expect(loop.getWorld().getGravity().y).toBe(Settings.HEAVY_GRAVITY);

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
    const base = 5 * fps60;
    for (let i = 0; i < 5; i++) loop.step(base + i * fps60);

    expect(loop.getWorld().getGravity().y).toBe(Settings.DEFAULT_GRAVITY);
  });
});

