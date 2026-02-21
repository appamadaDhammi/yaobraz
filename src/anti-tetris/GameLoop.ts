import { Vec2, Edge } from 'planck';
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
    // Bottom
    this.ground.createFixture(new Edge(new Vec2(0, 0), new Vec2(this.width, 0)), 0);
    // Left
    this.ground.createFixture(new Edge(new Vec2(0, 0), new Vec2(0, this.height * 2)), 0);
    // Right
    this.ground.createFixture(new Edge(new Vec2(this.width, 0), new Vec2(this.width, this.height * 2)), 0);
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
    const coinChance = this.state.level === 1 ? 1 : 1 / this.state.level;
    const hasCoin = Math.random() < coinChance;

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
    this.state.timer -= 1/60; // Assuming 60fps
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
      // Find figure under world coordinates
      const pos = new Vec2(input.x, input.y);
      // Iterate backwards to find the one "on top"
      for (let i = this.figures.length - 1; i >= 0; i--) {
        const figure = this.figures[i];
        if (figure && figure.body.getFixtureList().testPoint(pos)) {
          this.grabbedFigure = figure;
          break;
        }
      }
    }

    if (input.isPressed && this.grabbedFigure) {
      const targetPos = new Vec2(input.x, input.y);
      const currentPos = this.grabbedFigure.body.getPosition();
      const direction = targetPos.sub(currentPos);
      
      // Apply force towards the finger
      // Scaling force by distance?
      direction.mul(Settings.GRAB_FORCE);
      this.grabbedFigure.body.applyForceToCenter(direction, true);
    }

    if (input.justReleased) {
      this.grabbedFigure = null;
    }
  }

  private grabbedFigure: Figure | null = null;

  public getState(): GameState {
    return this.state;
  }

  public getFigures(): Figure[] {
    return this.figures;
  }
}
