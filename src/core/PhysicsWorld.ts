import { World, Vec2 } from 'planck';

export abstract class PhysicsWorld {
  protected world: World;
  protected lastTime: number = 0;
  private accumulator: number = 0;
  private readonly timeStep: number = 1 / 60;
  public timeScale: number = 1.0;

  constructor(gravity: Vec2 = new Vec2(0, -9.8)) {
    this.world = new World(gravity);
  }

  public step(currentTime: number) {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return;
    }

    const deltaTime = ((currentTime - this.lastTime) / 1000) * this.timeScale;
    this.lastTime = currentTime;

    // Fixed time step update
    this.accumulator += deltaTime;
    while (this.accumulator >= this.timeStep) {
      this.world.step(this.timeStep, 10, 10);
      this.onPostStep(); // Run after EVERY sub-step for position clamping
      this.accumulator -= this.timeStep;
    }
    
    this.onUpdate();
  }

  /** Called after every physics sub-step. Override to clamp positions etc. */
  protected onPostStep(): void {}

  protected abstract onUpdate(): void;

  public getWorld() {
    return this.world;
  }
}
