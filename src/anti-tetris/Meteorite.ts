import { World, Vec2, Polygon, type BodyDef, type FixtureDef } from 'planck';
import { S as Settings } from './Settings';

/**
 * A 2-block vertical "meteorite" that falls from above.
 * Passes through the floor (no FLOOR in collision mask).
 * Rendered as white blocks.
 */
export class Meteorite {
  public body: any; // planck.Body
  public blockCount: number;

  constructor(world: World, x: number, y: number, blockCount: number = 2) {
    this.blockCount = blockCount;
    const bodyDef: BodyDef = {
      type: 'dynamic',
      position: new Vec2(x, y),
      allowSleep: false,
      linearDamping: 0,
      angularDamping: 0.1,
      bullet: true,
    };

    this.body = world.createBody(bodyDef);

    const blocks: [number, number][] = [];
    for (let i = 0; i < blockCount; i++) blocks.push([0, i]);
    const offsetX = 0;
    const offsetY = (blockCount - 1) / 2;

    for (const [cx, cy] of blocks) {
      const fixtureDef: FixtureDef = {
        shape: new Polygon([
          new Vec2(cx - offsetX - 0.5, cy - offsetY - 0.5),
          new Vec2(cx - offsetX + 0.5, cy - offsetY - 0.5),
          new Vec2(cx - offsetX + 0.5, cy - offsetY + 0.5),
          new Vec2(cx - offsetX - 0.5, cy - offsetY + 0.5),
        ]),
        density: Settings.METEORITE_DENSITY,
        friction: Settings.FIGURE_FRICTION,
        restitution: Settings.FIGURE_RESTITUTION,
        filterCategoryBits: Settings.COLLISION_CATEGORY.METEORITE,
        filterMaskBits: Settings.COLLISION_MASK.METEORITE,
      };
      this.body.createFixture(fixtureDef);
    }

    this.body.setUserData(this);
  }

  public destroy(world: World) {
    if (this.body) {
      world.destroyBody(this.body);
      this.body = null;
    }
  }
}
