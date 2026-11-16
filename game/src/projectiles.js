// Thornwatch — projectiles chase their target. Ember pods burst on impact and
// damage every enemy in their splash radius; frost shots chill what they hit.

const SPEED = 420; // px per second

export class Projectile {
  constructor(spec) {
    this.type = spec.type;
    this.x = spec.x;
    this.y = spec.y;
    this.target = spec.target;
    this.damage = spec.damage;
    this.splash = spec.splash;
    this.slow = spec.slow;
    this.slowTime = spec.slowTime;
    this.tower = spec.tower;
    this.dead = false;
    this.trail = [];
  }

  // Moves toward the target; on arrival applies damage and returns the impact.
  // Returns null while still flying, or {x, y, splash, ...} on impact.
  update(dt, now, enemies) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();
    if (!this.target || this.target.dead || this.target.leaked) {
      this.dead = true;
      return null;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = SPEED * dt;
    if (dist <= step + 4) {
      this.dead = true;
      const impact = { x: this.target.x, y: this.target.y, type: this.type, splash: this.splash };
      if (this.splash > 0) {
        // Splash: full damage to everything in the radius.
        const r2 = this.splash * this.splash;
        impact.hit = [];
        for (const e of enemies) {
          if (e.dead || e.leaked) continue;
          const ex = e.x - impact.x;
          const ey = e.y - impact.y;
          if (ex * ex + ey * ey <= r2) {
            const killed = e.takeDamage(this.damage, now);
            impact.hit.push({ enemy: e, killed });
          }
        }
      } else {
        const killed = this.target.takeDamage(this.damage, now);
        if (this.slow > 0) this.target.applySlow(this.slow, this.slowTime, now);
        impact.hit = [{ enemy: this.target, killed }];
      }
      return impact;
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    return null;
  }
}
