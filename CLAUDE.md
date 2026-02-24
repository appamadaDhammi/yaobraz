# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server on 0.0.0.0 (accessible on LAN)
npm run build    # Type-check with vue-tsc, then Vite production build
npm run preview  # Preview production build
npm run test     # Run all tests once with Vitest
```

To run a single test file:
```bash
npx vitest run src/anti-tetris/__tests__/GameLoop.test.ts
```

## Architecture

This is a Vue 3 + TypeScript + Vite exhibition stand with two games. Only Anti-Tetris is implemented; Binary Maze is a placeholder.

### Game module structure (`src/anti-tetris/`)

**Physics layer:**
- [GameLoop.ts](src/anti-tetris/GameLoop.ts) — extends `PhysicsWorld`, owns all game state and physics. This is the brain of the game: figure spawning, coin mechanics, grab/drag via Planck `MouseJoint`, timer, level progression.
- [PhysicsWorld.ts](src/core/PhysicsWorld.ts) — abstract base that drives a fixed-timestep Planck.js loop. Subclasses implement `onPostStep()` and `onUpdate()`.
- [Figure.ts](src/anti-tetris/Figure.ts) — wraps a Planck rigid body representing a Tetris shape.
- [Coin.ts](src/anti-tetris/Coin.ts) — coin power-up that grants time bonuses; only collectible when overlapping the target figure.
- [BlockTexture.ts](src/anti-tetris/BlockTexture.ts) — block texture/color rendering utilities.
- [Settings.ts](src/anti-tetris/Settings.ts) — single source of truth for all magic numbers (gravity, speeds, sizes, level thresholds, etc.).

**Vue layer:**
- [AntiTetrisField.vue](src/anti-tetris/components/AntiTetrisField.vue) — canvas renderer and input bridge. Draws physics bodies each frame, translates pointer events into `InputHandler` calls, emits `GameState` updates to the parent page.
- [AntiTetris.vue](src/pages/AntiTetris.vue) — page wrapper that owns reactive `GameState` and composes header/field/footer/overlay.
- [InputHandler.ts](src/core/InputHandler.ts) — normalises touch/pointer events into a single interface consumed by `GameLoop`.

**Coordinate system:** Planck uses Y-up; canvas uses Y-down. All rendering applies a Y-flip transform. DPR scaling is applied to the canvas for high-DPI displays.

**Collision categories:** Figures use bitmask collision categories (`DEFAULT`, `NEW_FIGURE`, `PLATFORM`) to control which bodies interact during spawn and platform-refill phases.

**Tunneling prevention:** `PhysicsWorld.onPostStep()` clamps body positions every substep to prevent fast figures from tunneling through walls/floor. This runs per-substep, not per-frame.

### Game state machine

```
WAITING → PLAYING → GAME_OVER
```

- `WAITING`: no gravity, figures drift gently, tutorial hint visible.
- `PLAYING`: gravity active, timer counts down, coins collectible.
- `GAME_OVER`: final level shown on overlay with QR code.

### Level progression

| Level | Target |
|-------|--------|
| 1–2 | white (any color matches) |
| 3+ | color (must match figure color) |

(`LEVEL_COLOR_START = 3` in Settings.ts)

## Conventions

- **File naming:** `ClassName.ts`, `Component.vue`, `Component.css` (CSS split out if SFC > 400 lines).
- **Imports:** use `@/` alias for anything outside the current folder or component module.
- **No magic numbers:** add constants to [Settings.ts](src/anti-tetris/Settings.ts).
- **CSS naming:** BEM variant — `.Component__element` with `&.--modifier` scoped inside the element.
- **Renderer is replaceable:** keep rendering logic inside `AntiTetrisField.vue`; game logic must not reference DOM or canvas APIs directly.
- **Commits:** Conventional Commits — `feat(anti-tetris): …`, `fix(core): …`. Scope to the changed module.
- **Documentation:** if changes affect game concept or implementation details, update [CONCEPT.md](src/anti-tetris/CONCEPT.md) or [IMPLEMENTATION.md](IMPLEMENTATION.md).
