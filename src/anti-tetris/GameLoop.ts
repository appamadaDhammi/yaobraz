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
  private gravityDelay: number;
  private gravityEnabled: boolean = false;

  constructor(width: number, height: number) {
    super(new Vec2(0, 0)); // Start with no gravity
    this.width = width;
    this.height = height;
    this.gravityDelay = Settings.GRAVITY_DELAY_SEC;
    
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
    this.spawnInitialFigures();
    this.updateTarget();
  }

  private setupWalls() {
    this.ground = this.world.createBody();
    // Bottom
    this.ground.createFixture(new Edge(new Vec2(0, 0), new Vec2(this.width, 0)), 0);
    // Left
    this.ground.createFixture(new Edge(new Vec2(0, 0), new Vec2(0, this.height * 2)), 0);
    // Right
    this.ground.createFixture(new Edge(new Vec2(this.width, 0), new Vec2(this.width, this.height * 2)), 0);
  }

  private spawnInitialFigures() {
    const margin = this.width * 0.15; // 15% margin
    const startX = margin;
    const endX = this.width - margin;
    const stepX = (endX - startX) / (Settings.FIGURES_PER_REFILL - 1);
    const middleY = this.height / 2;

    for (let i = 0; i < Settings.FIGURES_PER_REFILL; i++) {
      const x = startX + i * stepX;
      this.spawnFigure(x, middleY);
    }
  }

  private spawnFigure(customX?: number, customY?: number) {
    const shape = Settings.FIGURE_SHAPES[Math.floor(Math.random() * Settings.FIGURE_SHAPES.length)];
    const color = Settings.FIGURE_COLORS[Math.floor(Math.random() * Settings.FIGURE_COLORS.length)];
    const x = customX !== undefined ? customX : Math.random() * (this.width - 4) + 2;
    const y = customY !== undefined ? customY : this.height + Math.random() * 5; // Spawn above the field or in the container
    
    // Coin chance
    const coinChance = this.state.level === 1 ? 1 : 1 / this.state.level;
    const hasCoin = Math.random() < coinChance;

    const figure = new Figure(this.world, shape!, color!, x, y, hasCoin);
    this.figures.push(figure);
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

    // Gravity delay handling
    if (!this.gravityEnabled) {
      this.gravityDelay -= 1/60;
      if (this.gravityDelay <= 0) {
        this.gravityEnabled = true;
        this.world.setGravity(new Vec2(0, Settings.DEFAULT_GRAVITY));
        // Wake up all bodies when gravity shifts
        for (const figure of this.figures) {
          figure.body.setAwake(true);
        }
      }
    }

    // Update timer
    this.state.timer -= 1/60; // Assuming 60fps
    if (this.state.timer <= 0) {
      this.state.timer = 0;
      this.state.isGameOver = true;
    }

    // Check figures out of bounds (thrown upwards)
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
