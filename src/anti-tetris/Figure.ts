import { World, Vec2, Polygon, type BodyDef, type FixtureDef } from 'planck';
import { type FigureShape, type FigureColor } from './Settings';
import * as Settings from './Settings';

const SHAPES: Record<FigureShape, number[][]> = {
  I: [[0, 0], [0, 1], [0, 2], [0, 3]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  S: [[0, 0], [1, 0], [1, 1], [2, 1]],
  Z: [[0, 1], [1, 1], [1, 0], [2, 0]],
  L: [[0, 0], [0, 1], [0, 2], [1, 0]],
  J: [[0, 0], [1, 0], [1, 1], [1, 2]],
};

/**
 * Index of the interior (non-edge) block for each shape that will be used as
 * the "white block". Chosen to be visually interior, never on the outer perimeter.
 */
const WHITE_BLOCK_INDEX: Record<FigureShape, number> = {
  I: 1, // second block from one end
  O: 1, // any internal block (all share edges, pick index 1)
  T: 1, // center of the top row
  S: 1, // middle overlap
  Z: 1, // middle overlap
  L: 1, // middle of the vertical bar
  J: 1, // middle of the vertical bar
};

export class Figure {
  public body: any; // planck.Body
  public shape: FigureShape;
  public color: FigureColor;
  public hasCoin: boolean = false;
  /** Whether this figure carries a "white block" that doubles gravity */
  public hasWhiteBlock: boolean = false;
  /** Which fixture index (0-based) is the white block */
  public whiteBlockIndex: number = -1;
  /** Whether this figure is newly spawned and passes through the regular floor */
  public isNewFigure: boolean = false;
  
  constructor(world: World, shape: FigureShape, color: FigureColor, x: number, y: number, hasCoin: boolean = false, hasWhiteBlock: boolean = false, isNewFigure: boolean = false) {
    this.shape = shape;
    this.color = color;
    this.hasCoin = hasCoin;
    this.hasWhiteBlock = hasWhiteBlock;
    this.isNewFigure = isNewFigure;
    if (hasWhiteBlock) {
      this.whiteBlockIndex = WHITE_BLOCK_INDEX[shape];
    }

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
        restitution: Settings.FIGURE_RESTITUTION,
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
