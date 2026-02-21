import { Vec2, Box, MouseJoint, type MouseJointDef } from 'planck';
import { PhysicsWorld } from '../core/PhysicsWorld';
import { Figure } from './Figure';
import * as Settings from './Settings';

export interface GameState {
  score: number;
  level: number;
  timer: number;
  targetShape: Settings.FigureShape;
  targetColor: Settings.FigureColor | 'white';
  isGameOver: boolean;
  hintVisible: boolean;
}

export class AntiTetrisLoop extends PhysicsWorld {
  private figures: Figure[] = [];
  private state: GameState;
  private width: number;
  private height: number;
  private ground: any;
  private isSlowInit: boolean;
  private isInitializing: boolean = false;
  private isWaitingForHit: boolean = false;
  private hitDetectedDuringStep: boolean = false;
  private initialSpawnsLeft: number = 0;
  private lastSpawnedFigure: Figure | null = null;

  constructor(width: number, height: number, isSlowInit: boolean = false) {
    super(new Vec2(0, Settings.DEFAULT_GRAVITY));
    this.width = width;
    this.height = height;
    this.isSlowInit = isSlowInit;
    this.timeScale = Settings.GAME_SPEED * Settings.PHYSICS_SPEED;
    
    this.state = {
      score: 0,
      level: 1,
      timer: Settings.GAME_DURATION,
      targetShape: 'I',
      targetColor: 'white',
      isGameOver: false,
      hintVisible: true,
    };

    this.setupWalls();
    this.setupContactListener();
    this.spawnInitialFigures();
    this.updateTarget();

    if (!this.isSlowInit && this.isInitializing) {
      this.precomputeInitialization();
    }
  }

  private setupContactListener() {
    this.world.on('begin-contact', (contact) => {
      if (this.isInitializing && this.isWaitingForHit && this.lastSpawnedFigure) {
        const fixtureA = contact.getFixtureA();
        const fixtureB = contact.getFixtureB();
        const bodyA = fixtureA.getBody();
        const bodyB = fixtureB.getBody();
        const dataA = bodyA.getUserData();
        const dataB = bodyB.getUserData();

        // One of the bodies MUST be the last spawned figure
        const isLastFigureA = bodyA === this.lastSpawnedFigure.body;
        const isLastFigureB = bodyB === this.lastSpawnedFigure.body;

        if (isLastFigureA || isLastFigureB) {
          const otherData = isLastFigureA ? dataB : dataA;
          // The other body MUST be a solid object: another Figure OR a wall
          if (otherData instanceof Figure || otherData === 'wall') {
            this.hitDetectedDuringStep = true;
          }
        }
      }
    });
  }

  private precomputeInitialization() {
    const timeStep = 1 / 60;
    let safetyCounter = 0;
    while (this.isInitializing && safetyCounter < 1000) {
      this.world.step(timeStep);
      this.checkAndSpawnNext();
      safetyCounter++;
    }
  }

  private checkAndSpawnNext() {
    if (this.hitDetectedDuringStep) {
      this.hitDetectedDuringStep = false;
      this.isWaitingForHit = false;
      this.spawnNextSequential();
    }
  }

  private setupWalls() {
    this.ground = this.world.createBody();
    this.ground.setUserData('wall');
    // Simple thick floor — real tunneling prevention is in onPostStep()
    this.ground.createFixture(new Box(this.width / 2, 10, new Vec2(this.width / 2, -10)), 0);
    // Left wall
    this.ground.createFixture(new Box(10, this.height, new Vec2(-10, this.height)), 0);
    // Right wall
    this.ground.createFixture(new Box(10, this.height, new Vec2(this.width + 10, this.height)), 0);
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
    this.isInitializing = true;
    this.initialSpawnsLeft = Settings.FIGURES_PER_REFILL;
    this.spawnNextSequential();
  }

  private spawnNextSequential() {
    if (this.initialSpawnsLeft > 0) {
      if (!this.isWaitingForHit) {
        this.isWaitingForHit = true;
        const margin = this.width * 0.2;
        const x = margin + Math.random() * (this.width - margin * 2);
        const y = this.height + 2; // Spawn above
        this.lastSpawnedFigure = this.spawnFigure(x, y);
        this.initialSpawnsLeft--;
      }
    } else {
      this.isInitializing = false;
    }
  }

  private spawnFigure(customX?: number, customY?: number): Figure {
    const shape = Settings.FIGURE_SHAPES[Math.floor(Math.random() * Settings.FIGURE_SHAPES.length)];
    const color = Settings.FIGURE_COLORS[Math.floor(Math.random() * Settings.FIGURE_COLORS.length)];
    const x = customX !== undefined ? customX : Math.random() * (this.width - 4) + 2;
    const y = customY !== undefined ? customY : this.height + Math.random() * 5; // Spawn above the field or in the container
    
    // Coin chance
    // const coinChance = this.state.level === 1 ? 1 : 1 / this.state.level;
    const hasCoin = Math.random() < .5;

    const figure = new Figure(this.world, shape!, color!, x, y, hasCoin);
    this.figures.push(figure);
    return figure;
  }

  private updateTarget() {
    if (this.figures.length === 0) return;
    
    const randomFigure = this.figures[Math.floor(Math.random() * this.figures.length)];
    if (randomFigure) {
      this.state.targetShape = randomFigure.shape;
      
      if (this.state.level === 1) {
        this.state.targetColor = 'white';
      } else {
        this.state.targetColor = randomFigure.color;
      }
    }
  }

  protected onUpdate() {
    if (this.state.isGameOver) return;

    this.checkAndSpawnNext();

    // Update timer
    this.state.timer -= (1 / 60) * Settings.GAME_SPEED; // Assuming 60fps, scale with GAME_SPEED
    if (this.state.timer <= 0) {
      this.state.timer = 0;
      this.state.isGameOver = true;
    }

    // Check figures out of bounds (thrown upwards)
    // SKIP this check during initialization to prevent scoring bugs
    if (!this.isInitializing) {
      for (let i = this.figures.length - 1; i >= 0; i--) {
        const figure = this.figures[i];
        if (figure?.body) {
          const pos = figure.body.getPosition();
          
          // If figure is above the container
          if (pos.y > this.height) {
            this.handleFigureThrown(figure, i);
          }

        // Blocking logic: figure is moving up but hindered by others?
        // Actually Planck handles collisions, but we might want to apply DRAG in the top zone.
          if (pos.y > this.height * (1 - Settings.DRAG_ZONE_RATIO) && pos.y <= this.height) {
            const isTarget = figure.shape === this.state.targetShape && 
                             (this.state.targetColor === 'white' || figure.color === this.state.targetColor);
            
            if (!isTarget) {
              const vel = figure.body.getLinearVelocity();
              if (vel.y > 0) {
                figure.body.setLinearVelocity(new Vec2(vel.x, vel.y * Settings.WRONG_FIGURE_DRAG));
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
    if (this.figures.length <= Settings.MIN_FIGURES_TO_REFILL) {
      this.refill();
    }
  }

  private handleFigureThrown(figure: Figure, index: number) {
    const isTarget = figure.shape === this.state.targetShape && 
                     (this.state.targetColor === 'white' || figure.color === this.state.targetColor);

    if (isTarget) {
      this.state.score += Settings.POINTS_PER_FIGURE * this.state.level;
      if (figure.hasCoin) {
        this.state.timer += Settings.COIN_TIME_BONUS;
      }
      this.state.hintVisible = false;
      this.updateTarget();
    }

    figure.destroy(this.world);
    this.figures.splice(index, 1);
  }

  private refill() {
    this.state.level++;
    for (let i = 0; i < Settings.FIGURES_PER_REFILL; i++) {
      this.spawnFigure();
    }
    this.updateTarget();
  }

  public handleInput(input: any) { // InputState
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
    }

    if (input.justReleased || !input.isPressed) {
      if (this.mouseJoint) {
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
}
