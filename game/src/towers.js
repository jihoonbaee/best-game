// Thornwatch — towers sit on grass tiles, pick the enemy furthest along the
// road within range, and fire. Each type has 3 levels; upgrades raise damage,
// fire rate, range, or (for frost) the chill.

import { TOWERS, UPGRADE_COST, SELL_RATE, tileCenterX, tileCenterY } from './config.js';

export class Tower {
  constructor(type, col, row) {
    this.type = type;
    this.col = col;
    this.row = row;
    this.x = tileCenterX(col);
    this.y = tileCenterY(row);
    this.level = 1;
    this.cooldown = 0;
    this.invested = TOWERS[type].cost;
    this.angle = -Math.PI / 2; // barrel direction, for the render
    this.recoil = 0;
    this.totalKills = 0;
  }

  get def() { return TOWERS[this.type]; }
  get stats() { return this.def.levels[this.level - 1]; }
  get name() { return this.def.name; }
  get color() { return this.def.color; }
  get range() { return this.stats.range; }

  get upgradeCost() {
    if (this.level >= 3) return null;
    return UPGRADE_COST(this.type, this.level);
  }

  get sellValue() {
    return Math.floor(this.invested * SELL_RATE);
  }

  upgrade() {
    if (this.level >= 3) return false;
    this.invested += this.upgradeCost;
    this.level++;
    return true;
  }

  // The enemy furthest along the road within range, if any.
  acquireTarget(enemies) {
    let best = null;
    let bestProgress = -Infinity;
    const r2 = this.range * this.range;
    for (const e of enemies) {
      if (e.dead || e.leaked) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      if (dx * dx + dy * dy > r2) continue;
      if (e.progress > bestProgress) {
        bestProgress = e.progress;
        best = e;
      }
    }
    return best;
  }

  // Returns a projectile description when the tower fires, else null.
  update(dt, enemies, now) {
    if (this.recoil > 0) this.recoil -= dt * 6;
    this.cooldown -= dt;
    const target = this.acquireTarget(enemies);
    if (target) {
      this.angle = Math.atan2(target.y - this.y, target.x - this.x);
      if (this.cooldown <= 0) {
        this.cooldown = 1 / this.stats.rate;
        this.recoil = 1;
        return {
          type: this.type,
          x: this.x + Math.cos(this.angle) * 18,
          y: this.y + Math.sin(this.angle) * 18,
          target,
          damage: this.stats.damage,
          splash: this.stats.splash,
          slow: this.stats.slow || 0,
          slowTime: this.stats.slowTime || 0,
          tower: this,
        };
      }
    }
    return null;
  }
}
