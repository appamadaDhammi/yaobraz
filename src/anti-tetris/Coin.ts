import { World, Vec2, Circle, type BodyDef, type FixtureDef } from 'planck';
import * as Settings from './Settings';

export class Coin {
  public body: any; // planck.Body
  public lifetime: number;

  constructor(world: World, x: number, y: number) {
    this.lifetime = Settings.COIN_LIFETIME_SEC;

    const bodyDef: BodyDef = {
      type: 'static',
      position: new Vec2(x, y),
    };

    this.body = world.createBody(bodyDef);

    const fixtureDef: FixtureDef = {
      shape: new Circle(Settings.COIN_RADIUS),
      isSensor: true, // Don't collide physically, just detect overlap
      filterCategoryBits: Settings.COLLISION_CATEGORY.COIN, 
      filterMaskBits: Settings.COLLISION_MASK.COIN, 
    };

    this.body.createFixture(fixtureDef);
    this.body.setUserData(this);
  }

  public destroy(world: World) {
    if (this.body) {
      world.destroyBody(this.body);
      this.body = null;
    }
  }
}
