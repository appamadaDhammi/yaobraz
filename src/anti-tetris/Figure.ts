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

export class Figure {
  public body: any; // planck.Body
  public shape: FigureShape;
  public color: FigureColor;
  public hasCoin: boolean = false;
  
  constructor(world: World, shape: FigureShape, color: FigureColor, x: number, y: number, hasCoin: boolean = false) {
    this.shape = shape;
    this.color = color;
    this.hasCoin = hasCoin;

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
      };
      this.body.createFixture(fixtureDef);
    }

    this.body.setUserData(this);
  }

  public destroy(world: World) {
    world.destroyBody(this.body);
  }

  public getPressure(): number {
    let pressure = 0;
    const pos = this.body.getPosition();
    
    for (let ce = this.body.getContactList(); ce; ce = ce.next) {
      const contact = ce.contact;
      if (!contact.isTouching()) continue;

      const other = ce.other;
      const otherData = other.getUserData();
      
      if (otherData instanceof Figure) {
        const otherPos = other.getPosition();
        // If the other figure's center is above this one
        if (otherPos.y > pos.y + 0.5) { // 0.5 is half a block height buffer
          pressure += other.getMass();
        }
      }
    }
    return pressure;
  }
}
