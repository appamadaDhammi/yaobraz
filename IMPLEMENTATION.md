# Development guidelines

use vite, typescript, vue3, and dom elements for the start. suppose renderer architecture to be replaced later with another framework like PixiJS or even ThreeJS.
use best practics like DRY, SOLID. separate logic into different files.
use SFC components, but separate CSS if SFC becomes more than 400 lines.
use alternative BEM. pattern: `.Component__element`, `&.--modificator` (modificator should be scoped only inside element's CSS).
use naming pattern for SFC `Component.vue`, `Component.css`.
use the same style names for files as a class inside of it `ClassName.ts`. the same for other stuff.
use absolute pathes `@/` if a required file is not in the same folder or component module.
for vite add server to be visible by 0.0.0.0