// Thornwatch — particles and floating texts: the juice on every hit, death,
// coin and leak. Purely cosmetic; nothing here affects gameplay.

// A burst of small glowing dots.
export class ParticleBurst {
  constructor(x, y, color, count, speed, life, size) {
    this.parts = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      this.parts.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 20,
        life: life * (0.6 + Math.random() * 0.6),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        color,
      });
    }
  }
  update(dt) {
    for (const p of this.parts) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
      p.vx *= 0.98;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    return this.parts.length > 0;
  }
  draw(ctx) {
    for (const p of this.parts) {
      const a = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.size * a + 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// Text that floats up and fades ("+8g", "LEAK!").
export class FloatText {
  constructor(x, y, text, color, size = 14) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = 1.1;
    this.maxLife = 1.1;
  }
  update(dt) {
    this.life -= dt;
    this.y -= 34 * dt;
    return this.life > 0;
  }
  draw(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = a;
    ctx.font = `700 ${this.size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

// A ring that expands and fades (sunburst, level-ups).
export class ShockRing {
  constructor(x, y, color, maxR, life = 0.6) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.maxR = maxR;
    this.life = life;
    this.maxLife = life;
  }
  update(dt) {
    this.life -= dt;
    return this.life > 0;
  }
  draw(ctx) {
    const t = Math.max(0, Math.min(1, 1 - this.life / this.maxLife));
    ctx.globalAlpha = (1 - t) * 0.9;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4 * (1 - t) + 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.1, this.maxR * t + 6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
