// Thornwatch — enemies walk the blight road from waypoint to waypoint.
// Each type has its own look, speed, toughness and reward.

import { ENEMIES, WAYPOINTS, hpScale, speedScale } from './config.js';

export class Enemy {
  constructor(type, wave, rng) {
    const def = ENEMIES[type];
    this.type = type;
    this.name = def.name;
    this.maxHp = Math.round(def.hp * hpScale(wave));
    this.hp = this.maxHp;
    this.baseSpeed = def.speed * speedScale(wave);
    this.gold = def.gold;
    this.lives = def.lives;
    this.radius = def.radius;
    this.color = def.color;
    this.dark = def.dark;
    this.score = def.score;
    this.waypoint = 1; // waypoint 0 is the off-screen start
    this.x = WAYPOINTS[0].x;
    this.y = WAYPOINTS[0].y;
    // A small fixed sideways offset so a group does not walk single-file.
    this.lane = (rng() - 0.5) * 22;
    this.wobble = rng() * Math.PI * 2;
    this.slowFactor = 0; // 0 = full speed, 0.6 = 40% speed
    this.slowUntil = 0;
    this.dead = false;
    this.leaked = false;
    this.flash = 0; // hit-flash timer for the render
    this.age = 0;
  }

  get speed() {
    return this.baseSpeed * (1 - this.slowFactor);
  }

  get slowed() {
    return this.slowFactor > 0;
  }

  applySlow(factor, seconds, now) {
    if (factor > this.slowFactor) this.slowFactor = factor;
    this.slowUntil = Math.max(this.slowUntil, now + seconds);
  }

  takeDamage(amount, now) {
    this.hp -= amount;
    this.flash = 0.12;
    if (this.hp <= 0) this.dead = true;
    return this.dead;
  }

  update(dt, now) {
    this.age += dt;
    if (this.flash > 0) this.flash -= dt;
    if (now > this.slowUntil) this.slowFactor = 0;
    let remaining = this.speed * dt;
    while (remaining > 0 && this.waypoint < WAYPOINTS.length) {
      const target = WAYPOINTS[this.waypoint];
      // Lane offset applies sideways to the current leg.
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= remaining) {
        this.x = target.x;
        this.y = target.y;
        remaining -= dist;
        this.waypoint++;
      } else {
        this.x += (dx / dist) * remaining;
        this.y += (dy / dist) * remaining;
        remaining = 0;
      }
    }
    if (this.waypoint >= WAYPOINTS.length) this.leaked = true;
  }

  // Where the tower aims: the enemy's centre, wobbling slightly.
  get drawX() {
    return this.x + Math.sin(this.age * 3 + this.wobble) * 1.5;
  }
  get drawY() {
    return this.y + this.lane * 0.4 + Math.cos(this.age * 2.4 + this.wobble) * 1.5;
  }

  // How far along the road this enemy has travelled (for "first" targeting).
  get progress() {
    return this.waypoint * 1000 - Math.hypot(
      WAYPOINTS[Math.min(this.waypoint, WAYPOINTS.length - 1)].x - this.x,
      WAYPOINTS[Math.min(this.waypoint, WAYPOINTS.length - 1)].y - this.y,
    );
  }
}
