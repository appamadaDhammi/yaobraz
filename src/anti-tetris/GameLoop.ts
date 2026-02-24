import { Vec2, Box, MouseJoint, type MouseJointDef } from 'planck';
import { PhysicsWorld } from '../core/PhysicsWorld';
import { Figure } from './Figure';
import { Coin } from './Coin';
import { Meteorite } from './Meteorite';
import * as Settings from './Settings';

export interface GameState {
  level: number;
  timer: number;
  targetShape: Settings.FigureShape;
  targetColor: Settings.FigureColor | 'white';
  isGameOver: boolean;
  hintVisible: boolean;
  status: 'WAITING' | 'PLAYING';
  tutorialActive: boolean;
  coinsCollected: number;
}

export class AntiTetrisLoop extends PhysicsWorld {
  private figures: Figure[] = [];
  private coins: Coin[] = [];
  private coinSpawnTimer: number = 0;
  private meteorites: Meteorite[] = [];
  private meteoriteSpawnTimer: number = 0;
  private state: GameState;
  private width: number;
  private height: number;
  private ground: any;
  private isSlowInit: boolean;
  private isInitializing: boolean = false;
  private isRefilling: boolean = false;
  private isWaitingForSpawnZoneClear: boolean = false;
  private spawnsLeft: number = 0;
  private lastSpawnedFigure: Figure | null = null;
  private platformBody: any = null;

  constructor(width: number, height: number, isSlowInit: boolean = false, initialTimer?: number) {
    super(new Vec2(0, Settings.DEFAULT_GRAVITY));
    this.width = width;
    this.height = height;
    this.isSlowInit = isSlowInit;
    this.timeScale = Settings.GAME_SPEED * Settings.PHYSICS_SPEED;
    
    this.state = {
      level: 1,
      timer: initialTimer !== undefined ? initialTimer : Settings.GAME_DURATION,
      targetShape: 'I',
      targetColor: 'white',
      isGameOver: false,
      hintVisible: false,
      status: 'WAITING',
      tutorialActive: false,
      coinsCollected: 0,
    };

    this.coinSpawnTimer = Settings.COIN_SPAWN_DELAY_MIN + Math.random() * (Settings.COIN_SPAWN_DELAY_MAX - Settings.COIN_SPAWN_DELAY_MIN);
    this.meteoriteSpawnTimer = Settings.METEORITE_SPAWN_DELAY_MIN + Math.random() * (Settings.METEORITE_SPAWN_DELAY_MAX - Settings.METEORITE_SPAWN_DELAY_MIN);

    this.setupWalls();
    this.setupContactListener();
    this.spawnInitialFigures();
    this.updateTarget();

    if (!this.isSlowInit && this.isInitializing) {
      this.precomputeInitialization();
    }
  }

  private getLevelConfig(level: number): Settings.LevelConfig {
    const idx = Math.min(level - 1, Settings.LEVEL_CONFIG.length - 1);
    return Settings.LEVEL_CONFIG[idx]!;
  }

  private isFigureTarget(figure: Figure): boolean {
    return figure.shape === this.state.targetShape &&
           (this.state.targetColor === 'white' || figure.color === this.state.targetColor);
  }

  private setupContactListener() {
    // No contact listener logic needed for spawning anymore
  }

  private precomputeInitialization() {
    const timeStep = 1 / 60;
    let safetyCounter = 0;
    
    // Step until all figures are spawned
    while (this.isInitializing && safetyCounter < 2000) { // precompute for init only
      this.world.step(timeStep);
      this.checkAndSpawnNext();
      safetyCounter++;
    }
    
    // Step extra to let them fall to the ground
    let extraSteps = 300;
    while (extraSteps > 0 && safetyCounter < 2000) {
      this.world.step(timeStep);
      safetyCounter++;
      extraSteps--;
    }
  }

  private checkAndSpawnNext() {
    if (this.isSequentiallySpawning && this.isWaitingForSpawnZoneClear && this.lastSpawnedFigure) {
      const pos = this.lastSpawnedFigure.body.getPosition();
      const maxOffset = typeof this.lastSpawnedFigure.getMaxBottomOffset === 'function' ? this.lastSpawnedFigure.getMaxBottomOffset() : 2.0;
      
      // Wait until the figure is completely below the top boundary
      if (pos.y + maxOffset < this.height) {
        this.isWaitingForSpawnZoneClear = false;
        this.spawnNextSequential();
      }
    }
  }

  /** True while a sequential spawn chain is active (init OR refill). */
  private get isSequentiallySpawning(): boolean {
    return this.isInitializing;
  }

  private setupWalls() {
    this.ground = this.world.createBody();
    this.ground.setUserData('wall');
    // Simple thick floor — real tunneling prevention is in onPostStep()
    this.ground.createFixture({
      shape: new Box(this.width / 2, 10, new Vec2(this.width / 2, -10)),
      filterCategoryBits: Settings.COLLISION_CATEGORY.FLOOR,
      filterMaskBits: Settings.COLLISION_MASK.FLOOR,
    });
    // Add deep walls so tumbling figures don't fall off the platform below y=0
    const wallDepth = 50; 
    
    // Left wall
    this.ground.createFixture({
      shape: new Box(10, this.height + wallDepth, new Vec2(-10, this.height - wallDepth)),
      filterCategoryBits: Settings.COLLISION_CATEGORY.WALL,
      filterMaskBits: Settings.COLLISION_MASK.WALL,
    });
    // Right wall
    this.ground.createFixture({
      shape: new Box(10, this.height + wallDepth, new Vec2(this.width + 10, this.height - wallDepth)),
      filterCategoryBits: Settings.COLLISION_CATEGORY.WALL,
      filterMaskBits: Settings.COLLISION_MASK.WALL,
    });
  }

  /**
   * Runs after EVERY physics sub-step. This is the hard constraint that
   * absolutely prevents figures from falling through the floor, regardless
   * of solver accuracy.
   */
  protected override onPostStep() {
    if (!this.mouseJoint) return;
    const body = this.mouseJoint.getBodyB();
    const pos = body.getPosition();
    const angle = body.getAngle();
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Find the extreme world-space positions across all fixture vertices
    let lowestY = pos.y;
    let leftmostX = pos.x;
    let rightmostX = pos.x;
    for (let f = body.getFixtureList(); f; f = f.getNext()) {
      const shape = f.getShape() as any;
      const verts = shape.m_vertices;
      if (!verts) continue;
      for (const v of verts) {
        const worldX = pos.x + v.x * cosA - v.y * sinA;
        const worldY = pos.y + v.x * sinA + v.y * cosA;
        if (worldY < lowestY) lowestY = worldY;
        if (worldX < leftmostX) leftmostX = worldX;
        if (worldX > rightmostX) rightmostX = worldX;
      }
    }

    let newX = pos.x;
    let newY = pos.y;
    let changed = false;

    // Floor clamp
    if (lowestY < 0.05) {
      newY += 0.05 - lowestY;
      changed = true;
    }
    // Left wall clamp
    if (leftmostX < 0.05) {
      newX += 0.05 - leftmostX;
      changed = true;
    }
    // Right wall clamp
    if (rightmostX > this.width - 0.05) {
      newX -= rightmostX - (this.width - 0.05);
      changed = true;
    }

    if (changed) {
      body.setPosition(new Vec2(newX, newY));
      const vel = body.getLinearVelocity();
      const clampedVx = (leftmostX < 0.05 && vel.x < 0) || (rightmostX > this.width - 0.05 && vel.x > 0) ? 0 : vel.x;
      const clampedVy = lowestY < 0.05 && vel.y < 0 ? 0 : vel.y;
      if (clampedVx !== vel.x || clampedVy !== vel.y) {
        body.setLinearVelocity(new Vec2(clampedVx, clampedVy));
      }
    }
  }

  private spawnInitialFigures() {
    if (this.state.status === 'WAITING') {
      // Spawn level-1 figure count in the center (no gravity yet)
      const figuresToSpawn = this.getLevelConfig(1).i;
      for (let i = 0; i < figuresToSpawn; i++) {
        const angle = (i / figuresToSpawn) * Math.PI * 2;
        const figure = this.spawnFigure(
          this.width / 2 + Math.cos(angle) * Settings.SPAWN_RADIUS,
          this.height / 2 + Math.sin(angle) * Settings.SPAWN_RADIUS
        );
        figure.body.setAngle(Math.random() * Math.PI * 2);
        // Random initial velocity for "free flow"
        figure.body.setLinearVelocity(new Vec2((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5));
        figure.body.setAngularVelocity((Math.random() - 0.5) * 2);
      }
      this.world.setGravity(new Vec2(0, 0));
    } else {
      // Sequential drop: figures fall one at a time and settle before the next appears.
      this.isInitializing = true;
      const initCount = this.getLevelConfig(this.state.level).i;
      this.spawnsLeft = initCount;
      this.spawnNextSequential();
    }
  }

  /**
   * Drops one figure from above and flags that we are waiting for its first
   * collision. Called by checkAndSpawnNext() after each landing, and once
   * directly to kick off a batch (init or refill).
   */
  private spawnNextSequential() {
    if (this.spawnsLeft > 0) {
      if (!this.isWaitingForSpawnZoneClear) {
        this.isWaitingForSpawnZoneClear = true;
        const margin = this.width * 0.2;
        const x = margin + Math.random() * (this.width - margin * 2);
        const y = this.height + 2; // Spawn just above the visible field
        this.lastSpawnedFigure = this.spawnFigure(x, y);
        this.spawnsLeft--;
      }
    } else {
      // Batch complete
      if (this.isInitializing) {
        this.isInitializing = false;
      }
    }
  }

  private spawnFigure(customX?: number, customY?: number, isNewFigure: boolean = false): Figure {
    const shape = Settings.FIGURE_SHAPES[Math.floor(Math.random() * Settings.FIGURE_SHAPES.length)];
    const color = Settings.FIGURE_COLORS[Math.floor(Math.random() * Settings.FIGURE_COLORS.length)];
    const x = customX !== undefined ? customX : Math.random() * (this.width - 4) + 2;
    const y = customY !== undefined ? customY : this.height + Math.random() * 5;

    const figure = new Figure(this.world, shape!, color!, x, y, isNewFigure);
    this.figures.push(figure);
    return figure;
  }

  private updateTarget() {
    if (this.figures.length === 0) return;

    const selectedFigure = this.figures[Math.floor(Math.random() * this.figures.length)];

    if (selectedFigure) {
      this.state.targetShape = selectedFigure.shape;

      if (this.state.level < Settings.LEVEL_COLOR_START) {
        this.state.targetColor = 'white';
      } else {
        this.state.targetColor = selectedFigure.color;
      }
    }
  }

  protected onUpdate() {
    if (this.state.status === 'WAITING') {
      // Keep figures in the center area
      for (const fig of this.figures) {
        const pos = fig.body.getPosition();
        const center = new Vec2(this.width / 2, this.height / 2);
        const toCenter = center.sub(pos);
        
        // Soft force towards center if they drift too far
        if (toCenter.length() > 3) {
          fig.body.applyForceToCenter(toCenter.mul(2));
        }
        
        // Ensure some minimum movement
        const vel = fig.body.getLinearVelocity();
        if (vel.length() < 1) {
          fig.body.applyLinearImpulse(
            new Vec2((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
            fig.body.getWorldCenter()
          );
        }
      }
    }

    if (this.state.isGameOver) return;

    // Coin logic
    if (this.state.status === 'PLAYING') {
      const dt = 1 / 60;
      this.coinSpawnTimer -= dt * Settings.GAME_SPEED;
      if (this.coinSpawnTimer <= 0) {
        if (this.coins.length < Settings.COIN_MAX_ON_FIELD) {
          // Spawn new coin in the upper area of the field randomly AND aligned to the 1x1 grid
          // width is 9, playable X is roughly 1..8
          // height is roughly 13 (or varies by screen), spawn near top
          const gridX = Math.floor(1 + Math.random() * (this.width - 2)); 
          const gridY = Math.floor(this.height - 1 - Math.random() * 3);
          // Center the coin in the cell
          this.coins.push(new Coin(this.world, gridX + 0.5, gridY + 0.5));
        }
        this.coinSpawnTimer = Settings.COIN_SPAWN_DELAY_MIN + Math.random() * (Settings.COIN_SPAWN_DELAY_MAX - Settings.COIN_SPAWN_DELAY_MIN);
      }

      // Update coin lifetime
      for (let i = this.coins.length - 1; i >= 0; i--) {
        const coin = this.coins[i];
        if (coin) {
          coin.lifetime -= dt * Settings.GAME_SPEED;
          if (coin.lifetime <= 0) {
            coin.destroy(this.world);
            this.coins.splice(i, 1);
          }
        }
      }

      // Check coin collection — any target figure touching a coin collects it
      const coinsToRemove: Coin[] = [];
      for (const figure of this.figures) {
        if (!this.isFigureTarget(figure)) continue;
        for (let ce = figure.body.getContactList(); ce; ce = ce.next) {
          const contact = ce.contact;
          if (!contact.isTouching()) continue;
          const other = ce.other;
          if (!other) continue;
          const otherData = other.getUserData();
          if (otherData instanceof Coin && !coinsToRemove.includes(otherData)) {
            this.state.timer += Settings.COIN_TIME_BONUS;
            this.state.coinsCollected++;
            coinsToRemove.push(otherData);
          }
        }
      }
      for (const coin of coinsToRemove) {
        coin.destroy(this.world);
        this.coins = this.coins.filter(c => c !== coin);
      }

      // Meteorite spawning
      if (this.state.level >= Settings.METEORITE_START_LEVEL) {
        this.meteoriteSpawnTimer -= dt * Settings.GAME_SPEED;
        if (this.meteoriteSpawnTimer <= 0) {
          if (this.meteorites.length < Settings.METEORITE_MAX_ON_FIELD) {
            const margin = 1.5;
            const x = margin + Math.random() * (this.width - margin * 2);
            const y = this.height + 3;
            this.meteorites.push(new Meteorite(this.world, x, y));
          }
          this.meteoriteSpawnTimer = Settings.METEORITE_SPAWN_DELAY_MIN +
            Math.random() * (Settings.METEORITE_SPAWN_DELAY_MAX - Settings.METEORITE_SPAWN_DELAY_MIN);
        }
      }

      // Cleanup meteorites that fell below the field
      for (let i = this.meteorites.length - 1; i >= 0; i--) {
        const met = this.meteorites[i]!;
        if (met.body) {
          const pos = met.body.getPosition();
          if (pos.y < Settings.METEORITE_DESTROY_Y) {
            met.destroy(this.world);
            this.meteorites.splice(i, 1);
          }
        }
      }
    }

    this.checkAndSpawnNext();

    if (this.isRefilling && this.platformBody) {
      const pos = this.platformBody.getPosition();
      if (pos.y >= 0) {
        // Platform reached the floor level
        this.world.destroyBody(this.platformBody);
        this.platformBody = null;
        this.isRefilling = false;

        for (const figure of this.figures) {
          if (figure.isNewFigure) {
            figure.setAsRegularFigure();
          }
        }
        // Re-select target after new figures land
        this.updateTarget();
      }
    }

    // Update timer
    if (this.state.status === 'PLAYING') {
      this.state.timer -= (1 / 60) * Settings.GAME_SPEED; // Assuming 60fps, scale with GAME_SPEED
      if (this.state.timer <= 0) {
        this.state.timer = 0;
        this.state.isGameOver = true;
      }
    }

    // Check figures out of bounds (thrown upwards)
    // SKIP this check during initialization to prevent scoring bugs
    if (!this.isInitializing) {
      for (let i = this.figures.length - 1; i >= 0; i--) {
        const figure = this.figures[i];
        if (figure?.body) {
          const pos = figure.body.getPosition();
          
          // If figure is above the container AND moving upward (actually thrown, not just spawning)
          const vel = figure.body.getLinearVelocity();
          if (pos.y > this.height + Settings.FIGURE_THROW_CEILING_OFFSET && vel.y > 0) {
            this.handleFigureThrown(figure, i);
            continue; // Figure destroyed, skip further checks
          }

          // OOB SAFEGUARD: Figure fell through floor or escaped walls
          if (pos.y < -40 || pos.x < -this.width || pos.x > this.width * 2) {
            figure.destroy(this.world);
            this.figures.splice(i, 1);
            continue;
          }

        // Blocking logic: figure is moving up but hindered by others?

        // Actually Planck handles collisions, but we might want to apply DRAG in the top zone.
        if (pos.y > this.height * (1 - Settings.DRAG_ZONE_RATIO) && pos.y <= this.height) {
          if (!this.isFigureTarget(figure)) {
            const vel = figure.body.getLinearVelocity();
            if (vel.y > 0) {
              // Apply drag
              figure.body.setLinearVelocity(new Vec2(vel.x, vel.y * Settings.WRONG_FIGURE_DRAG));
            }
          }
        }
        
        // Rigid ceiling for non-targets
        if (!this.isFigureTarget(figure)) {
          const ceiling = this.height + 0.5; // Slight leeway above screen
          if (pos.y > ceiling) {
            const vel = figure.body.getLinearVelocity();
            if (vel.y > 0) {
               // Bounce back down and snap position below ceiling
               figure.body.setPosition(new Vec2(pos.x, ceiling));
               figure.body.setLinearVelocity(new Vec2(vel.x, -Math.abs(vel.y) * 0.5));
            }
            if (this.mouseJoint && this.mouseJoint.getBodyB() === figure.body) {
                // Break drag immediately
                this.world.destroyJoint(this.mouseJoint);
                this.mouseJoint = null;
            }
          }
        }
        }
      }
    }

    // Update mouse joint force based on rubble pressure
    if (this.mouseJoint) {
      const figureBody = this.mouseJoint.getBodyB();
      const figure = figureBody.getUserData() as Figure;
      if (figure && typeof figure.updatePressureSmoothing === 'function') {
        figure.updatePressureSmoothing();
        const pressure = figure.getPressure();
        const baseForce = Settings.MOUSE_JOINT_MAX_FORCE;
        const dampedForce = Math.max(
          Settings.MIN_MOUSE_JOINT_FORCE,
          baseForce * Math.exp(-pressure * Settings.RUBBLE_DAMPING_FACTOR)
        );
        this.mouseJoint.setMaxForce(dampedForce);
      }
    }

    // Velocity cap (extra safety, main protection is in onPostStep)
    for (const figure of this.figures) {
      if (!figure.body) continue;
      const vel = figure.body.getLinearVelocity();
      const speedSq = vel.lengthSquared();
      if (speedSq > Settings.MAX_FIGURE_VELOCITY * Settings.MAX_FIGURE_VELOCITY) {
        const speed = Math.sqrt(speedSq);
        figure.body.setLinearVelocity(new Vec2(
          (vel.x / speed) * Settings.MAX_FIGURE_VELOCITY,
          (vel.y / speed) * Settings.MAX_FIGURE_VELOCITY
        ));
      }
    }

    // Refill check
    const levelCfg = this.getLevelConfig(this.state.level);
    if (!this.isRefilling && this.state.status === 'PLAYING' && this.figures.length <= levelCfg.k) {
      this.refill();
    }
  }

  private handleFigureThrown(figure: Figure, index: number) {
    const isTarget = this.isFigureTarget(figure);

    // Remove figure from the world FIRST so updateTarget can't pick it again
    figure.destroy(this.world);
    this.figures.splice(index, 1);

    if (isTarget) {
      this.state.hintVisible = false;
      this.updateTarget();
    }

    if (this.state.tutorialActive) {
      this.state.tutorialActive = false;
      this.state.hintVisible = false;
    }
  }

  private refill() {
    if (this.isRefilling) return;

    const prevLevel = this.state.level;
    this.state.level++;

    // Compute how many figures to spawn: i(newLevel) − k(prevLevel)
    const prevCfg = this.getLevelConfig(prevLevel);
    const nextCfg = this.getLevelConfig(this.state.level);
    const spawnCount = nextCfg.i - prevCfg.k;

    this.isRefilling = true;

    // Compute platform start Y so all figures safely spawn below the floor (y = 0).
    // Each figure spawns at: platformY + OFFSET + i * GAP (angle=0, max height ~2 units).
    // The topmost figure (i = spawnCount-1) must satisfy: y + GAP < 0.
    const platformY = -(spawnCount * Settings.PLATFORM_SPAWN_GAP_Y + Settings.PLATFORM_SPAWN_OFFSET_Y + Settings.PLATFORM_MIN_Y_BUFFER);
    this.platformBody = this.world.createBody({
      type: 'kinematic',
      position: new Vec2(0, platformY),
    });
    this.platformBody.createFixture({
      shape: new Box(this.width / 2, 1, new Vec2(this.width / 2, -1)),
      filterCategoryBits: Settings.COLLISION_CATEGORY.PLATFORM,
      filterMaskBits: Settings.COLLISION_MASK.PLATFORM,
    });
    this.platformBody.setLinearVelocity(new Vec2(0, Settings.PLATFORM_SPEED)); // Move upwards faster to compensate

    // Spawn new figures vertically stacked on the platform to avoid overlap
    const playableWidth = this.width - 2;
    for (let i = 0; i < spawnCount; i++) {
       // Random horizontal position, but kept away from edges
       const x = 1.5 + Math.random() * (playableWidth - 1);
       // Stack vertically with enough room to fall and relax
       const y = platformY + Settings.PLATFORM_SPAWN_OFFSET_Y + i * Settings.PLATFORM_SPAWN_GAP_Y;
       const figure = this.spawnFigure(x, y, true); // true for isNewFigure
       // Slight tilt so figures don't stack perfectly flat, but small enough to keep height < 2 units
       figure.body.setAngle((Math.random() - 0.5) * 0.4);
    }

    // Update target now that all new figures are in this.figures
    this.updateTarget();
  }

  public handleInput(input: any) { // InputState
    if (this.state.status === 'WAITING') {
      if (input.isPressed) {
        this.state.status = 'PLAYING';
        this.state.tutorialActive = true;
        this.state.hintVisible = true;
        this.world.setGravity(new Vec2(0, Settings.DEFAULT_GRAVITY));
        // Give figures a little nudge to start falling naturally
        for (const fig of this.figures) {
          fig.body.setAngularVelocity((Math.random() - 0.5) * 5);
        }
        // if (typeof document !== 'undefined' && document.body.requestFullscreen) {
        //   document.body.requestFullscreen().catch(() => {});
        // }
      }
      return;
    }

    if (this.state.isGameOver) return;

    if (input.justPressed) {
      if (this.mouseJoint) {
        this.world.destroyJoint(this.mouseJoint);
        this.mouseJoint = null;
      }

      // First pass: find hit figure
      let hitFigure: Figure | null = null;
      for (let i = this.figures.length - 1; i >= 0; i--) {
        const figure = this.figures[i];
        if (figure) {
          let hit = false;
          for (let f = figure.body.getFixtureList(); f; f = f.getNext()) {
            if (f.testPoint(new Vec2(input.x, input.y))) { // Note: using raw input for initial hit test
              hit = true;
              break;
            }
          }
          if (hit) {
            hitFigure = figure;
            break;
          }
        }
      }

      if (hitFigure) {
        if (typeof hitFigure.initPressureSmoothing === 'function') {
          hitFigure.initPressureSmoothing();
        }
        
        const safetyOffset = hitFigure.getMaxBottomOffset();
        const clampedPos = new Vec2(
          Math.max(1, Math.min(this.width - 1, input.x)),
          Math.max(safetyOffset + 0.2, input.y)
        );

        const def: MouseJointDef = {
          maxForce: Settings.MOUSE_JOINT_MAX_FORCE,
          frequencyHz: Settings.MOUSE_JOINT_FREQUENCY,
          dampingRatio: Settings.MOUSE_JOINT_DAMPING,
          target: clampedPos,
          bodyA: this.ground,
          bodyB: hitFigure.body,
        };
        this.mouseJoint = this.world.createJoint(new MouseJoint(def)) as MouseJoint;
        hitFigure.body.setAngularDamping(Settings.FIGURE_DRAG_ANGULAR_DAMPING);
        hitFigure.body.setAwake(true);
      }
    }

    if (input.isPressed && this.mouseJoint) {
      const figureBody = this.mouseJoint.getBodyB();
      const figure = figureBody.getUserData() as Figure;
      const safetyOffset = figure.getMaxBottomOffset();

      this.mouseJoint.setTarget(new Vec2(
        Math.max(1, Math.min(this.width - 1, input.x)),
        Math.max(safetyOffset + 0.2, input.y)
      ));

      // Check for drag loss distance
      const target = this.mouseJoint.getTarget();
      const anchor = this.mouseJoint.getAnchorB();
      const dist = Vec2.distance(target, anchor);
      if (dist > Settings.FIGURE_DRAG_LOSS_DISTANCE) {
        figureBody.setAngularDamping(Settings.FIGURE_ANGULAR_DAMPING);
        this.world.destroyJoint(this.mouseJoint);
        this.mouseJoint = null;
      }
    }

    if (input.justReleased || !input.isPressed) {
      if (this.mouseJoint) {
        const body = this.mouseJoint.getBodyB();
        body.setAngularDamping(Settings.FIGURE_ANGULAR_DAMPING);
        this.world.destroyJoint(this.mouseJoint);
        this.mouseJoint = null;
      }
    }
  }

  private mouseJoint: MouseJoint | null = null;

  public getState(): GameState {
    return this.state;
  }

  public getFigures(): Figure[] {
    return this.figures;
  }

  public getCoins(): Coin[] {
    return this.coins;
  }

  public getMeteorites(): Meteorite[] {
    return this.meteorites;
  }

  public getPlatformBody(): any {
    return this.platformBody;
  }

  public resize(newWidth: number, newHeight: number) {
    if (newWidth === this.width && newHeight === this.height) return;

    const scaleY = newHeight / this.height;
    
    this.width = newWidth;
    this.height = newHeight;

    // Rescale all figures y positions
    for (const figure of this.figures) {
      if (figure && figure.body) {
        const pos = figure.body.getPosition();
        figure.body.setPosition(new Vec2(pos.x, pos.y * scaleY));
      }
    }

    // Rescale platform body
    if (this.platformBody) {
      const pos = this.platformBody.getPosition();
      this.platformBody.setPosition(new Vec2(pos.x, pos.y * scaleY));
    }

    // Recreate walls for new dimensions
    if (this.ground) {
      let f = this.ground.getFixtureList();
      while (f) {
        const nextFixture = f.getNext();
        this.ground.destroyFixture(f);
        f = nextFixture;
      }

      this.ground.createFixture({
        shape: new Box(this.width / 2, 10, new Vec2(this.width / 2, -10)),
        filterCategoryBits: Settings.COLLISION_CATEGORY.FLOOR,
        filterMaskBits: Settings.COLLISION_MASK.FLOOR,
      });
      
      const wallDepth = 50; 
      
      this.ground.createFixture({
        shape: new Box(10, this.height + wallDepth, new Vec2(-10, this.height - wallDepth)),
        filterCategoryBits: Settings.COLLISION_CATEGORY.WALL,
        filterMaskBits: Settings.COLLISION_MASK.WALL,
      });
      
      this.ground.createFixture({
        shape: new Box(10, this.height + wallDepth, new Vec2(this.width + 10, this.height - wallDepth)),
        filterCategoryBits: Settings.COLLISION_CATEGORY.WALL,
        filterMaskBits: Settings.COLLISION_MASK.WALL,
      });
    }
  }
}
