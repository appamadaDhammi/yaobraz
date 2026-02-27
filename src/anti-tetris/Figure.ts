import { World, Vec2, Polygon, type BodyDef, type FixtureDef } from 'planck';
import { S as Settings, type FigureShape, type FigureColor } from './Settings';

const SHAPES: Record<FigureShape, number[][]> = {
  I: [[0, 0], [0, 1], [0, 2], [0, 3]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  S: [[0, 0], [1, 0], [1, 1], [2, 1]],
  Z: [[0, 1], [1, 1], [1, 0], [2, 0]],
  L: [[0, 0], [0, 1], [0, 2], [1, 0]],
  J: [[0, 0], [1, 0], [1, 1], [1, 2]],
};

export class Figure {
  public body: any; // planck.Body
  public shape: FigureShape;
  public color: FigureColor;
  /** Whether this figure is newly spawned and passes through the regular floor */
  public isNewFigure: boolean = false;

  constructor(world: World, shape: FigureShape, color: FigureColor, x: number, y: number, isNewFigure: boolean = false) {
    this.shape = shape;
    this.color = color;
    this.isNewFigure = isNewFigure;

    const bodyDef: BodyDef = {
      type: 'dynamic',
      position: new Vec2(x, y),
      allowSleep: true,
      linearDamping: Settings.FIGURE_LINEAR_DAMPING,
      angularDamping: Settings.FIGURE_ANGULAR_DAMPING,
      bullet: true,
    };

    this.body = world.createBody(bodyDef);

    const coords = SHAPES[shape];
    // Center the figure around its local origin
    const offsetX = coords.reduce((acc, c) => acc + (c[0] ?? 0), 0) / coords.length;
    const offsetY = coords.reduce((acc, c) => acc + (c[1] ?? 0), 0) / coords.length;

    for (const [cx, cy] of coords) {
      const fixtureDef: FixtureDef = {
        shape: new Polygon([
          new Vec2((cx ?? 0) - offsetX - 0.5, (cy ?? 0) - offsetY - 0.5),
          new Vec2((cx ?? 0) - offsetX + 0.5, (cy ?? 0) - offsetY - 0.5),
          new Vec2((cx ?? 0) - offsetX + 0.5, (cy ?? 0) - offsetY + 0.5),
          new Vec2((cx ?? 0) - offsetX - 0.5, (cy ?? 0) - offsetY + 0.5),
        ]),
        density: 1.0,
        friction: Settings.FIGURE_FRICTION,
        restitution: isNewFigure ? 0 : Settings.FIGURE_RESTITUTION,
        filterCategoryBits: isNewFigure ? Settings.COLLISION_CATEGORY.NEW_FIGURE : Settings.COLLISION_CATEGORY.FIGURE,
        filterMaskBits: isNewFigure ? Settings.COLLISION_MASK.NEW_FIGURE : Settings.COLLISION_MASK.FIGURE,
      };
      this.body.createFixture(fixtureDef);
    }

    this.body.setUserData(this);
  }

  public destroy(world: World) {
    world.destroyBody(this.body);
  }

  public setAsRegularFigure() {
    this.isNewFigure = false;
    for (let f = this.body.getFixtureList(); f; f = f.getNext()) {
      f.setFilterData({
        categoryBits: Settings.COLLISION_CATEGORY.FIGURE,
        maskBits: Settings.COLLISION_MASK.FIGURE,
        groupIndex: 0
      });
      f.setRestitution(Settings.FIGURE_RESTITUTION);
    }
  }

  private smoothedPressure: number = 0;

  // Initialize smoothing with instant value to avoid initial lag
  public initPressureSmoothing() {
    this.smoothedPressure = this.calculateInstantPressure();
  }

  public updatePressureSmoothing() {
    const instant = this.calculateInstantPressure();
    this.smoothedPressure += (instant - this.smoothedPressure) * Settings.PRESSURE_SMOOTHING_ALPHA;
  }

  public getPressure(): number {
    return this.smoothedPressure;
  }

  public calculateInstantPressure(): number {
    let pressure = 0;
    const pos = this.body.getPosition();
    
    for (let ce = this.body.getContactList(); ce; ce = ce.next) {
      const contact = ce.contact;
      if (!contact.isTouching()) continue;

      const other = ce.other;
      const otherData = other.getUserData();
      
      if (otherData instanceof Figure) {
        const otherPos = other.getPosition();
        const delta = Vec2.sub(otherPos, pos);
        const dist = delta.length();
        
        if (dist > 0.01) {
          const dirY = delta.y / dist;
          // Downwardness: 1 if directly above, 0 if on the side or below
          const downwardness = Math.max(0, dirY);
          // Proximity: higher weight for closer figures
          const proximity = 1.0 / (1.0 + dist);
          
          pressure += other.getMass() * downwardness * proximity;
        }
      }
    }
    return pressure;
  }

  public getMaxBottomOffset(): number {
    const coords = SHAPES[this.shape];
    const offsetX = coords.reduce((acc, c) => acc + (c[0] ?? 0), 0) / coords.length;
    const offsetY = coords.reduce((acc, c) => acc + (c[1] ?? 0), 0) / coords.length;
    
    let maxR = 0;
    for (const [cx, cy] of coords) {
      const rx = (cx ?? 0) - offsetX;
      const ry = (cy ?? 0) - offsetY;
      // Distance from center to further corner of this block
      const r = Math.sqrt(rx * rx + ry * ry) + 0.71; // 0.71 is approx half-diagonal of 1x1 block
      maxR = Math.max(maxR, r);
    }
    return maxR;
  }
}
