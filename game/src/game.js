// Thornwatch — the game itself: state machine, economy, waves, combat wiring.
// Owns every entity and answers every player action; render.js only draws it.

import {
  COLORS, GRID_COLS, GRID_ROWS, GRID_OX, GRID_OY, TILE, PATH_SET,
  START_GOLD, START_LIVES, TOTAL_WAVES, TOWERS, WAVE_BONUS_GOLD,
  SUNBURST, HEART,
} from './config.js';
import { mulberry32 } from './random.js';
import { Enemy } from './enemies.js';
import { Tower } from './towers.js';
import { Projectile } from './projectiles.js';
import { ParticleBurst, FloatText, ShockRing } from './particles.js';
import { buildWaveQueue, spawnInterval, wavePreview } from './waves.js';
import { SoundBank } from './audio.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sounds = new SoundBank();
    this.rng = mulberry32(20261116);
    this.state = 'title'; // title | playing | victory | defeat
    this.paused = false;
    this.speed = 1; // 1x or 2x
    this.time = 0; // game clock, seconds (drives slow timers and cooldowns)
    this.shake = 0; // screen-shake timer
    this.flash = 0; // sunburst flash timer
    this.banner = null; // {text, sub, until} centre-screen announcement
    this.ui = []; // clickable rects the render registers each frame
    this.hover = { x: -1, y: -1, col: -1, row: -1 };
    this.placing = null; // tower type being placed, or null
    this.selected = null; // placed Tower selected, or null
    this.demoEnemies = []; // ambient walkers behind the title screen
    this.resetRun();
    this.seedTitleDemo();
  }

  // --- Run setup -----------------------------------------------------------
  resetRun() {
    this.gold = START_GOLD;
    this.lives = START_LIVES;
    this.score = 0;
    this.wave = 0;
    this.waveActive = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.bursts = [];
    this.texts = [];
    this.rings = [];
    this.placing = null;
    this.selected = null;
    this.sunburstReadyAt = 0;
    this.stats = { kills: 0, leaked: 0, built: 0, earned: 0, sunbursts: 0 };
    this.time = 0;
  }

  startGame() {
    this.sounds.ensure();
    this.resetRun();
    this.state = 'playing';
    this.paused = false;
    this.showBanner('Defend the Heartseed', 'Stop the blight before it reaches the glow', 3);
    this.sounds.waveStart();
  }

  // A few decorative towers and wandering blight for the title backdrop.
  seedTitleDemo() {
    this.demoTowers = [
      new Tower('thorn', 9, 2), new Tower('frost', 2, 3),
      new Tower('ember', 5, 2), new Tower('root', 5, 6),
      new Tower('thorn', 2, 5),
    ];
    this.demoTowers[0].level = 2;
    this.demoTowers[2].level = 2;
    this.demoEnemies = [];
    for (let i = 0; i < 6; i++) {
      const e = new Enemy(i % 3 === 0 ? 'moth' : 'sproutling', 1, this.rng);
      // Scatter them along the road by walking them forward a random distance.
      const steps = Math.floor(this.rng() * 900);
      for (let s = 0; s < steps; s++) e.update(0.05, 0);
      this.demoEnemies.push(e);
    }
  }

  // --- Player actions ------------------------------------------------------
  canPlace(col, row) {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
    if (PATH_SET.has(`${col},${row}`)) return false;
    return !this.towers.some((t) => t.col === col && t.row === row);
  }

  placeTower(type, col, row) {
    const cost = TOWERS[type].cost;
    if (this.gold < cost) { this.sounds.error(); return false; }
    if (!this.canPlace(col, row)) { this.sounds.error(); return false; }
    this.gold -= cost;
    const tower = new Tower(type, col, row);
    this.towers.push(tower);
    this.stats.built++;
    this.rings.push(new ShockRing(tower.x, tower.y, TOWERS[type].color, 46, 0.5));
    this.sounds.place();
    return true;
  }

  upgradeSelected() {
    const t = this.selected;
    if (!t || t.upgradeCost === null) return false;
    if (this.gold < t.upgradeCost) { this.sounds.error(); return false; }
    this.gold -= t.upgradeCost;
    t.upgrade();
    this.rings.push(new ShockRing(t.x, t.y, t.color, 60, 0.6));
    this.texts.push(new FloatText(t.x, t.y - 30, 'LEVEL UP!', '#ffd94d', 15));
    this.sounds.place();
    return true;
  }

  sellSelected() {
    const t = this.selected;
    if (!t) return false;
    this.gold += t.sellValue;
    this.texts.push(new FloatText(t.x, t.y - 30, `+${t.sellValue}g`, COLORS.gold, 15));
    this.towers = this.towers.filter((x) => x !== t);
    this.selected = null;
    this.sounds.coin();
    return true;
  }

  startWave() {
    if (this.waveActive || this.wave >= TOTAL_WAVES || this.state !== 'playing') return false;
    this.wave++;
    this.waveActive = true;
    this.spawnQueue = buildWaveQueue(this.wave);
    this.spawnTimer = 0.5;
    this.showBanner(`Wave ${this.wave} / ${TOTAL_WAVES}`, wavePreview(this.wave), 2.4);
    this.sounds.waveStart();
    return true;
  }

  castSunburst() {
    if (this.state !== 'playing' || this.paused) return false;
    if (this.time < this.sunburstReadyAt) { this.sounds.error(); return false; }
    if (this.enemies.length === 0) { this.sounds.error(); return false; }
    this.sunburstReadyAt = this.time + SUNBURST.cooldown;
    this.stats.sunbursts++;
    this.flash = 0.5;
    this.rings.push(new ShockRing(460, 360, '#ffe27a', 620, 0.8));
    for (const e of [...this.enemies]) {
      if (e.takeDamage(SUNBURST.damage, this.time)) this.killEnemy(e);
      else this.bursts.push(new ParticleBurst(e.x, e.y, '#ffe27a', 5, 90, 0.4, 3));
    }
    this.sounds.sunburst();
    return true;
  }

  get sunburstCooldownLeft() {
    return Math.max(0, this.sunburstReadyAt - this.time);
  }

  togglePause() {
    if (this.state !== 'playing') return;
    this.paused = !this.paused;
    this.sounds.click();
  }

  toggleSpeed() {
    this.speed = this.speed === 1 ? 2 : 1;
    this.sounds.click();
  }

  showBanner(text, sub, seconds) {
    this.banner = { text, sub, until: this.time + seconds };
  }

  // --- Combat resolution ---------------------------------------------------
  killEnemy(e) {
    this.gold += e.gold;
    this.score += e.score;
    this.stats.kills++;
    this.stats.earned += e.gold;
    this.bursts.push(new ParticleBurst(e.x, e.y, e.color, 14, 130, 0.55, 4));
    this.texts.push(new FloatText(e.x, e.y - 20, `+${e.gold}g`, COLORS.gold, 13));
    this.sounds.pop();
    this.sounds.coin();
  }

  leakEnemy(e) {
    this.lives -= e.lives;
    this.stats.leaked++;
    this.shake = 0.4;
    this.texts.push(new FloatText(HEART.x - 60, HEART.y - 40, `-${e.lives} ❤`, COLORS.heart, 18));
    this.bursts.push(new ParticleBurst(HEART.x, HEART.y, COLORS.heart, 20, 160, 0.6, 4));
    this.sounds.leak();
    if (this.lives <= 0) {
      this.lives = 0;
      this.state = 'defeat';
      this.sounds.defeat();
    }
  }

  // --- Update --------------------------------------------------------------
  update(rawDt) {
    const dt = Math.min(rawDt, 0.05) * (this.state === 'playing' && !this.paused ? this.speed : 0);
    // Cosmetic timers always run so the title screen stays alive.
    const ambientDt = Math.min(rawDt, 0.05);
    if (this.shake > 0) this.shake -= ambientDt;
    if (this.flash > 0) this.flash -= ambientDt;
    this.updateEffects(ambientDt);

    if (this.state === 'title') {
      for (const e of this.demoEnemies) {
        e.update(ambientDt, 0);
        if (e.leaked) {
          e.waypoint = 1;
          e.x = -40;
          e.y = 144;
          e.leaked = false;
        }
      }
      return;
    }
    if (this.state !== 'playing' || this.paused || dt === 0) return;
    this.time += dt;

    // Spawning.
    if (this.waveActive && this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const type = this.spawnQueue.shift();
        this.enemies.push(new Enemy(type, this.wave, this.rng));
        this.spawnTimer = spawnInterval(this.wave);
      }
    }

    // Enemies walk; leaks cost lives.
    for (const e of [...this.enemies]) {
      e.update(dt, this.time);
      if (e.leaked) {
        this.enemies = this.enemies.filter((x) => x !== e);
        this.leakEnemy(e);
        if (this.state !== 'playing') return;
      }
    }

    // Towers fire.
    for (const t of this.towers) {
      const shot = t.update(dt, this.enemies, this.time);
      if (shot) {
        this.projectiles.push(new Projectile(shot));
        this.sounds.shoot(shot.type);
      }
    }

    // Projectiles fly and hit.
    for (const p of [...this.projectiles]) {
      const impact = p.update(dt, this.time, this.enemies);
      if (impact) {
        for (const h of impact.hit || []) {
          if (h.killed) this.killEnemy(h.enemy);
          else this.bursts.push(new ParticleBurst(h.enemy.x, h.enemy.y, '#ffffff', 3, 70, 0.25, 2));
        }
        if (impact.splash > 0) {
          this.bursts.push(new ParticleBurst(impact.x, impact.y, '#ffb347', 16, 170, 0.5, 4));
          this.rings.push(new ShockRing(impact.x, impact.y, '#ffb347', impact.splash, 0.35));
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.enemies = this.enemies.filter((e) => !e.dead);

    // Wave cleared?
    if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      const bonus = WAVE_BONUS_GOLD(this.wave);
      this.gold += bonus;
      this.score += this.wave * 100;
      this.texts.push(new FloatText(460, 120, `Wave clear! +${bonus}g  +${this.wave * 100} pts`, COLORS.gold, 17));
      this.sounds.coin();
      if (this.wave >= TOTAL_WAVES) {
        this.state = 'victory';
        this.score += this.lives * 100;
        this.sounds.victory();
      }
    }
  }

  updateEffects(dt) {
    this.bursts = this.bursts.filter((b) => b.update(dt));
    this.texts = this.texts.filter((t) => t.update(dt));
    this.rings = this.rings.filter((r) => r.update(dt));
  }

  // --- Input ---------------------------------------------------------------
  tileAt(x, y) {
    const col = Math.floor((x - GRID_OX) / TILE);
    const row = Math.floor((y - GRID_OY) / TILE);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return { col, row };
  }

  click(x, y) {
    // Buttons first (last registered = topmost).
    for (let i = this.ui.length - 1; i >= 0; i--) {
      const b = this.ui[i];
      if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) {
        b.action();
        return;
      }
    }
    if (this.state !== 'playing' || this.paused) return;
    const tile = this.tileAt(x, y);
    if (!tile) {
      this.selected = null;
      this.placing = null;
      return;
    }
    if (this.placing) {
      if (this.placeTower(this.placing, tile.col, tile.row)) {
        // Keep placing the same type while the player can afford it.
        if (this.gold < TOWERS[this.placing].cost) this.placing = null;
      }
      return;
    }
    const tower = this.towers.find((t) => t.col === tile.col && t.row === tile.row);
    this.selected = tower || null;
    if (tower) this.sounds.click();
  }

  move(x, y) {
    this.hover.x = x;
    this.hover.y = y;
    const tile = this.tileAt(x, y);
    this.hover.col = tile ? tile.col : -1;
    this.hover.row = tile ? tile.row : -1;
    // Pointer cursor over buttons or towers.
    let pointer = false;
    for (const b of this.ui) {
      if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) { pointer = true; break; }
    }
    if (!pointer && tile && this.towers.some((t) => t.col === tile.col && t.row === tile.row)) pointer = true;
    this.canvas.style.cursor = pointer || this.placing ? 'pointer' : 'default';
  }

  key(keyName) {
    const k = keyName.toLowerCase();
    if (this.state === 'title' && (k === 'enter' || k === ' ')) { this.startGame(); return; }
    if ((this.state === 'victory' || this.state === 'defeat') && k === 'enter') { this.startGame(); return; }
    if (this.state !== 'playing') return;
    if (k === 'escape') {
      if (this.placing) this.placing = null;
      else if (this.selected) this.selected = null;
      else this.togglePause();
      return;
    }
    if (k === 'p') { this.togglePause(); return; }
    if (this.paused) return;
    if (k === ' ') { this.startWave(); return; }
    if (k === 'f') { this.toggleSpeed(); return; }
    if (k === 'm') { this.sounds.toggleMute(); return; }
    if (k === 'q') { this.castSunburst(); return; }
    if (k === 'u') { this.upgradeSelected(); return; }
    if (k === 's' && this.selected) { this.sellSelected(); return; }
    const shopKeys = { 1: 'thorn', 2: 'frost', 3: 'root', 4: 'ember' };
    if (shopKeys[k]) {
      this.placing = this.placing === shopKeys[k] ? null : shopKeys[k];
      this.selected = null;
      this.sounds.click();
    }
  }
}
