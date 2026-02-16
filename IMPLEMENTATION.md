# Development Guidelines

## Stack & Architecture
- Use **Vite**, **TypeScript**, and **Vue 3**.
- Use **DOM elements** initially.
- The renderer architecture should be designed to be replaceable later with frameworks like **PixiJS** or **ThreeJS**.
- Follow best practices: **DRY**, **SOLID**.
- Separate logic into different files.

## Components & Styling
- Use **SFC (Single File Components)**.
- Separate CSS into a standalone file if the SFC exceeds 400 lines.
- **Naming Pattern**: SFC should be `Component.vue` and its styles `Component.css`.
- **Alternative BEM Pattern**:
  - `.Component__element`
  - `&.--modificator` (scoped within the element's CSS).

## File Structure & Naming
- Use the same name for files and the main class/export inside them (e.g., `ClassName.ts`).
- Use **absolute paths** `@/` if the required file is not in the same folder or component module.

## Configuration
- Configure the Vite server to be accessible via `0.0.0.0`.