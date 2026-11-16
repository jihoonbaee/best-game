// Thornwatch — every pixel the player sees. Canvas 2D, procedural art only:
// no image or font files are loaded, so the game runs fully offline.
// Buttons drawn here register their hit-rects in game.ui for input.js.

import {
  VIEW_W, VIEW_H, BOARD_W, GRID_COLS, GRID_ROWS, TILE, GRID_OX, GRID_OY,
  PATH_SET, PATH_TILES, WAYPOINTS, HEART, COLORS, TOWERS, TOWER_ORDER,
  TOTAL_WAVES, SIDEBAR_X, SIDEBAR_W, SUNBURST, tileCenterX, tileCenterY,
} from './config.js';
import { mulberry32 } from './random.js';
import { wavePreview, waveCount } from './waves.js';

// Stable cosmetic scatter, seeded once so every run looks the same.
const decoRng = mulberry32(987654);
const DECOR = [];
for (let i = 0; i < 130; i++) {
  const col = Math.floor(decoRng() * GRID_COLS);
  const row = Math.floor(decoRng() * GRID_ROWS);
  if (PATH_SET.has(`${col},${row}`)) continue;
  DECOR.push({
    x: GRID_OX + col * TILE + 8 + decoRng() * (TILE - 16),
    y: GRID_OY + row * TILE + 8 + decoRng() * (TILE - 16),
    kind: decoRng() < 0.5 ? 'blade' : 'dot',
    s: 2 + decoRng() * 3,
    a: 0.15 + decoRng() * 0.25,
  });
}
const PEBBLES = [];
for (const [col, row] of PATH_TILES) {
  for (let i = 0; i < 3; i++) {
    PEBBLES.push({
      x: GRID_OX + col * TILE + 10 + decoRng() * (TILE - 20),
      y: GRID_OY + row * TILE + 10 + decoRng() * (TILE - 20),
      r: 2 + decoRng() * 3,
    });
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panel(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// Draws a button and registers it for clicks. Returns its rect.
function button(game, id, x, y, w, h, label, opts = {}) {
  const ctx = game.ctx;
  const hover = game.hover.x >= x && game.hover.x < x + w && game.hover.y >= y && game.hover.y < y + h;
  const disabled = !!opts.disabled;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = disabled ? '#274435' : hover ? COLORS.buttonHover : COLORS.button;
  ctx.fill();
  if (opts.accent) {
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = disabled ? COLORS.dim : COLORS.text;
  ctx.font = `700 ${opts.font || 16}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  if (!disabled) game.ui.push({ id, x, y, w, h, action: opts.action });
  return { x, y, w, h };
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 600) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

// --- Board -----------------------------------------------------------------
function drawBoard(game) {
  const ctx = game.ctx;
  // Grass checker.
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      ctx.fillStyle = (c + r) % 2 === 0 ? COLORS.grass : COLORS.grass2;
      ctx.fillRect(GRID_OX + c * TILE, GRID_OY + r * TILE, TILE, TILE);
    }
  }
  for (const d of DECOR) {
    ctx.globalAlpha = d.a;
    ctx.fillStyle = '#2f6b43';
    if (d.kind === 'blade') {
      ctx.fillRect(d.x, d.y, 2, d.s + 3);
    } else {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  // Dirt road.
  for (const [c, r] of PATH_TILES) {
    ctx.fillStyle = COLORS.path;
    ctx.fillRect(GRID_OX + c * TILE + 1, GRID_OY + r * TILE + 1, TILE - 2, TILE - 2);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (const p of PEBBLES) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Direction chevrons along the road so the route reads at a glance.
  ctx.strokeStyle = 'rgba(255,235,180,0.35)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.floor(len / 130);
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      if (x < 10 || x > BOARD_W - 10) continue;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(ang - 0.5) * 9, y - Math.sin(ang - 0.5) * 9);
      ctx.lineTo(x, y);
      ctx.lineTo(x - Math.cos(ang + 0.5) * 9, y - Math.sin(ang + 0.5) * 9);
      ctx.stroke();
    }
  }
  // The Heartseed.
  const pulse = 1 + Math.sin(game.time * 2.4) * 0.08;
  const glow = ctx.createRadialGradient(HEART.x, HEART.y, 4, HEART.x, HEART.y, 64);
  glow.addColorStop(0, 'rgba(255,220,120,0.55)');
  glow.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(HEART.x, HEART.y, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2f1a';
  ctx.beginPath();
  ctx.arc(HEART.x, HEART.y, HEART.r + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(HEART.x, HEART.y, HEART.r * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(HEART.x - 6, HEART.y - 7, 8, 0, Math.PI * 2);
  ctx.fill();
  // Right-aligned so the label never runs under the sidebar.
  text(ctx, 'HEARTSEED', BOARD_W - 8, HEART.y + HEART.r + 20, 11, COLORS.gold, 'right', 700);
}

// --- Towers ----------------------------------------------------------------
export function drawTowerHead(ctx, type, x, y, r, angle, level) {
  const def = TOWERS[type];
  // Soil mound.
  ctx.fillStyle = '#2a1f14';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.55, r * 1.05, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = def.dark;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.82, 0, Math.PI * 2);
  ctx.fill();
  if (type === 'thorn') {
    // Spikes around the head.
    ctx.fillStyle = '#d8ffb0';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      const sx = x + Math.cos(a) * r * 0.82;
      const sy = y + Math.sin(a) * r * 0.82;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a + 0.35) * 6, sy + Math.sin(a + 0.35) * 6);
      ctx.lineTo(x + Math.cos(a) * (r + 8), y + Math.sin(a) * (r + 8));
      ctx.lineTo(sx + Math.cos(a - 0.35) * 6, sy + Math.sin(a - 0.35) * 6);
      ctx.fill();
    }
  } else if (type === 'frost') {
    // Petals.
    ctx.fillStyle = '#d8f1ff';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, 7, 11, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'root') {
    // A tall spike leaning toward the aim.
    ctx.strokeStyle = '#efe2ff';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * (r + 10), y + Math.sin(angle) * (r + 10));
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Emberpod: glowing core.
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, '#fff3c4');
    g.addColorStop(0.5, def.color);
    g.addColorStop(1, def.dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.82, 0, Math.PI * 2);
    ctx.fill();
  }
  // Level pips.
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < level ? COLORS.gold : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x - 10 + i * 10, y + r + 9, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTowers(game) {
  const ctx = game.ctx;
  const towers = game.state === 'title' ? game.demoTowers : game.towers;
  for (const t of towers) {
    const r = Math.max(8, 20 - t.recoil * 3);
    drawTowerHead(ctx, t.type, t.x, t.y, r, t.angle, t.level);
  }
  // Range circle for the selected tower or the placement ghost.
  const show = game.selected || (game.placing && game.hover.col >= 0);
  if (show && game.state === 'playing') {
    const cx = game.selected ? game.selected.x : tileCenterX(game.hover.col);
    const cy = game.selected ? game.selected.y : tileCenterY(game.hover.row);
    const range = game.selected
      ? game.selected.range
      : TOWERS[game.placing].levels[0].range;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Placement ghost.
  if (game.placing && game.state === 'playing' && game.hover.col >= 0) {
    const ok = game.canPlace(game.hover.col, game.hover.row)
      && game.gold >= TOWERS[game.placing].cost;
    const x = tileCenterX(game.hover.col);
    const y = tileCenterY(game.hover.row);
    ctx.globalAlpha = 0.75;
    drawTowerHead(ctx, game.placing, x, y, 20, -Math.PI / 2, 1);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ok ? '#7ed957' : '#ff5a5a';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(GRID_OX + game.hover.col * TILE + 2, GRID_OY + game.hover.row * TILE + 2, TILE - 4, TILE - 4);
  }
  // Hover highlight on a grass tile while placing.
  if (!game.placing && game.state === 'playing' && game.hover.col >= 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(GRID_OX + game.hover.col * TILE + 1, GRID_OY + game.hover.row * TILE + 1, TILE - 2, TILE - 2);
  }
}

// --- Enemies ---------------------------------------------------------------
function drawEnemy(game, e) {
  const ctx = game.ctx;
  const x = e.drawX;
  const y = e.drawY;
  const r = e.radius;
  ctx.fillStyle = e.dark;
  ctx.beginPath();
  ctx.arc(x, y + 2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.88, 0, Math.PI * 2);
  ctx.fill();
  if (e.type === 'sproutling') {
    ctx.fillStyle = '#3f9e3a';
    ctx.beginPath();
    ctx.ellipse(x, y - r - 2, 4, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === 'moth' || e.type === 'bat') {
    const flap = Math.sin(e.age * 18) * 0.7;
    ctx.fillStyle = e.dark;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(x + side * r * 0.6, y - 2);
      ctx.rotate(side * flap * 0.5);
      ctx.beginPath();
      ctx.ellipse(side * 8, -4, 10, 6, side * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (e.type === 'beetle') {
    ctx.strokeStyle = e.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  } else {
    // Warden / lord: crown spikes.
    ctx.fillStyle = '#ffd9de';
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a - 0.18) * r * 0.8, y + Math.sin(a - 0.18) * r * 0.8);
      ctx.lineTo(x + Math.cos(a) * (r + 9), y + Math.sin(a) * (r + 9));
      ctx.lineTo(x + Math.cos(a + 0.18) * r * 0.8, y + Math.sin(a + 0.18) * r * 0.8);
      ctx.fill();
    }
  }
  // Eyes.
  ctx.fillStyle = '#101510';
  ctx.beginPath();
  ctx.arc(x - r * 0.32, y - r * 0.15, 2.6, 0, Math.PI * 2);
  ctx.arc(x + r * 0.32, y - r * 0.15, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // Slow tint.
  if (e.slowed) {
    ctx.fillStyle = 'rgba(127,212,255,0.45)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Hit flash.
  if (e.flash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  // HP bar.
  if (e.hp < e.maxHp) {
    const w = Math.max(28, r * 2);
    const frac = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - w / 2, y - r - 12, w, 5);
    ctx.fillStyle = frac > 0.5 ? '#7ed957' : frac > 0.25 ? '#ffd94d' : '#ff5a5a';
    ctx.fillRect(x - w / 2, y - r - 12, w * frac, 5);
  }
}

function drawProjectiles(game) {
  const ctx = game.ctx;
  for (const p of game.projectiles) {
    const color = TOWERS[p.type].color;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < p.trail.length; i++) {
      const t = p.trail[i];
      if (i === 0) ctx.moveTo(t.x, t.y);
      else ctx.lineTo(t.x, t.y);
    }
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.type === 'ember' ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEffects(game) {
  const ctx = game.ctx;
  for (const b of game.bursts) b.draw(ctx);
  for (const r of game.rings) r.draw(ctx);
  for (const t of game.texts) t.draw(ctx);
}

// --- Sidebar ---------------------------------------------------------------
function drawSidebar(game) {
  const ctx = game.ctx;
  const X = SIDEBAR_X + 14;
  const W = SIDEBAR_W - 28;
  ctx.fillStyle = '#0d2418';
  ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_W, VIEW_H);
  ctx.fillStyle = COLORS.panelEdge;
  ctx.fillRect(SIDEBAR_X, 0, 2, VIEW_H);

  text(ctx, 'THORNWATCH', X, 34, 22, COLORS.text, 'left', 800);
  text(ctx, 'a garden tower defense', X, 54, 12, COLORS.dim, 'left', 500);

  // Resources.
  panel(ctx, X, 66, W, 58);
  text(ctx, `🪙 ${game.gold}g`, X + 14, 90, 17, COLORS.gold, 'left', 700);
  text(ctx, `❤ ${game.lives}`, X + 130, 90, 17, COLORS.heart, 'left', 700);
  text(ctx, `★ ${game.score}`, X + 210, 90, 17, COLORS.text, 'left', 700);
  const waveShown = game.waveActive ? game.wave : Math.min(game.wave + 1, TOTAL_WAVES);
  text(ctx, `Wave ${waveShown} / ${TOTAL_WAVES}`, X + 14, 112, 13, COLORS.dim);
  const remaining = game.waveActive ? game.enemies.length + game.spawnQueue.length : 0;
  text(ctx, game.waveActive ? `Blight left: ${remaining}` : 'Between waves — build!', X + 130, 112, 13, game.waveActive ? COLORS.heart : '#7ed957');

  // Shop.
  text(ctx, 'BUILD  —  click a plant, then a grass tile  (keys 1–4)', X, 150, 12, COLORS.dim, 'left', 700);
  let y = 160;
  for (const type of TOWER_ORDER) {
    const def = TOWERS[type];
    const afford = game.gold >= def.cost;
    const active = game.placing === type;
    roundRect(ctx, X, y, W, 62, 10);
    ctx.fillStyle = active ? '#2c6b4a' : COLORS.panel;
    ctx.fill();
    ctx.strokeStyle = active ? COLORS.gold : COLORS.panelEdge;
    ctx.lineWidth = active ? 2 : 1.5;
    ctx.stroke();
    ctx.globalAlpha = afford ? 1 : 0.45;
    drawTowerHead(ctx, type, X + 32, y + 31, 17, -Math.PI / 2, 1);
    ctx.globalAlpha = 1;
    text(ctx, def.name, X + 58, y + 22, 15, afford ? COLORS.text : COLORS.dim, 'left', 700);
    text(ctx, def.desc, X + 58, y + 42, 11.5, COLORS.dim);
    text(ctx, `${def.cost}g`, X + W - 14, y + 24, 15, afford ? COLORS.gold : COLORS.dim, 'right', 700);
    text(ctx, `[${def.key}]`, X + W - 14, y + 42, 11, COLORS.dim, 'right');
    game.ui.push({
      id: `shop-${type}`, x: X, y, w: W, h: 62,
      action: () => {
        game.placing = game.placing === type ? null : type;
        game.selected = null;
        game.sounds.click();
      },
    });
    y += 70;
  }

  // Selected tower panel, or next-wave preview.
  if (game.selected) {
    const t = game.selected;
    panel(ctx, X, y, W, 108);
    text(ctx, `${t.name}  ·  Lv ${t.level}`, X + 14, y + 24, 15, COLORS.text, 'left', 700);
    const s = t.stats;
    text(ctx, `Damage ${s.damage}   Rate ${s.rate}/s   Range ${s.range}`, X + 14, y + 46, 12, COLORS.dim);
    if (s.splash) text(ctx, `Splash radius ${s.splash}`, X + 14, y + 64, 12, COLORS.dim);
    if (s.slow) text(ctx, `Chill ${Math.round(s.slow * 100)}% for ${s.slowTime}s`, X + 14, y + 64, 12, COLORS.dim);
    if (t.upgradeCost !== null) {
      button(game, 'upgrade', X + 14, y + 74, 150, 26, `Upgrade ${t.upgradeCost}g`, {
        disabled: game.gold < t.upgradeCost,
        action: () => game.upgradeSelected(),
        font: 13,
      });
    } else {
      text(ctx, 'MAX LEVEL', X + 14, y + 92, 13, COLORS.gold, 'left', 700);
    }
    button(game, 'sell', X + 176, y + 74, 140, 26, `Sell ${t.sellValue}g`, {
      action: () => game.sellSelected(), font: 13,
    });
    y += 118;
  } else {
    panel(ctx, X, y, W, 108);
    if (game.wave >= TOTAL_WAVES) {
      text(ctx, 'Final wave!', X + 14, y + 24, 15, COLORS.text, 'left', 700);
      text(ctx, 'Hold the garden. No more waves after this.', X + 14, y + 46, 12, COLORS.dim);
    } else {
      text(ctx, `Next: Wave ${game.wave + 1}`, X + 14, y + 24, 15, COLORS.text, 'left', 700);
      text(ctx, wavePreview(game.wave + 1), X + 14, y + 46, 12, COLORS.dim);
      text(ctx, `${waveCount(game.wave + 1)} blight · clear bonus ${20 + (game.wave + 1) * 5}g`, X + 14, y + 64, 12, COLORS.dim);
    }
    button(game, 'start-wave', X + 14, y + 74, W - 28, 26, game.waveActive ? 'Wave in progress…' : '▶  Start wave  [Space]', {
      disabled: game.waveActive || game.wave >= TOTAL_WAVES,
      accent: !game.waveActive,
      action: () => game.startWave(),
      font: 13,
    });
    y += 118;
  }

  // Sunburst ability.
  const cd = game.sunburstCooldownLeft;
  const ready = cd <= 0;
  roundRect(ctx, X, y, W, 52, 10);
  ctx.fillStyle = ready ? '#6b4a12' : COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = ready ? COLORS.gold : COLORS.panelEdge;
  ctx.lineWidth = ready ? 2 : 1.5;
  ctx.stroke();
  text(ctx, '☀ Sunburst', X + 14, y + 23, 15, ready ? COLORS.gold : COLORS.dim, 'left', 700);
  text(ctx, ready ? `Blast all blight for ${SUNBURST.damage} damage  [Q]` : `Recharging… ${Math.ceil(cd)}s`, X + 14, y + 43, 12, COLORS.dim);
  if (!ready) {
    const frac = 1 - cd / SUNBURST.cooldown;
    ctx.fillStyle = 'rgba(255,217,77,0.25)';
    ctx.fillRect(X + 14, y + 47, (W - 28) * frac, 3);
  }
  game.ui.push({
    id: 'sunburst', x: X, y, w: W, h: 52,
    action: () => game.castSunburst(),
  });
  y += 62;

  // Controls row.
  button(game, 'speed', X, y, 100, 30, game.speed === 1 ? 'Speed 1×' : 'Speed 2×', {
    action: () => game.toggleSpeed(), font: 13,
  });
  button(game, 'pause', X + 110, y, 100, 30, game.paused ? 'Resume' : 'Pause', {
    action: () => game.togglePause(), font: 13,
  });
  button(game, 'mute', X + 220, y, W - 220, 30, game.sounds.muted ? 'Sound off' : 'Sound on', {
    action: () => game.sounds.toggleMute(), font: 13,
  });
  y += 44;
  text(ctx, 'Mouse: build & select  ·  Esc: cancel  ·  U: upgrade  ·  S: sell', X, y + 4, 11, COLORS.dim);
}

// --- Overlays --------------------------------------------------------------
function dimScreen(game, alpha) {
  game.ctx.fillStyle = `rgba(4, 12, 8, ${alpha})`;
  game.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawTitle(game) {
  dimScreen(game, 0.62);
  const ctx = game.ctx;
  const cx = BOARD_W / 2;
  text(ctx, 'THORNWATCH', cx, 170, 64, COLORS.text, 'center', 800);
  text(ctx, 'The blight marches on the Heartseed. Grow your garden. Hold the road.', cx, 208, 17, COLORS.dim, 'center', 500);
  text(ctx, '15 waves  ·  4 plant towers  ·  upgrades  ·  a boss at the end', cx, 238, 15, COLORS.gold, 'center', 700);
  panel(ctx, cx - 250, 268, 500, 150);
  text(ctx, 'HOW TO PLAY', cx, 296, 14, COLORS.text, 'center', 800);
  const lines = [
    'Click a plant card (1–4), then a grass tile to plant it.',
    'Towers shoot on their own. Click one to upgrade or sell it.',
    'Press Space to send the next wave. Leaks cost ❤ — lose all 20 and the garden falls.',
    'Sunburst [Q] blasts every blight on screen. Survive all 15 waves to win.',
  ];
  lines.forEach((line, i) => text(ctx, line, cx, 322 + i * 24, 13.5, COLORS.dim, 'center', 500));
  button(game, 'start', cx - 130, 448, 260, 54, '▶  START THE DEFENSE', {
    accent: true, font: 18,
    action: () => game.startGame(),
  });
  text(ctx, 'or press Enter', cx, 534, 13, COLORS.dim, 'center', 500);
}

function drawPause(game) {
  dimScreen(game, 0.6);
  const ctx = game.ctx;
  const cx = BOARD_W / 2;
  text(ctx, 'PAUSED', cx, 300, 44, COLORS.text, 'center', 800);
  text(ctx, 'The blight waits. So does the garden.', cx, 332, 15, COLORS.dim, 'center', 500);
  button(game, 'resume', cx - 110, 360, 220, 46, 'Resume  [P]', { font: 16, action: () => game.togglePause() });
  button(game, 'restart', cx - 110, 418, 220, 46, 'Restart run', {
    font: 16, action: () => game.startGame(),
  });
}

function drawEnd(game) {
  dimScreen(game, 0.66);
  const ctx = game.ctx;
  const cx = BOARD_W / 2;
  const won = game.state === 'victory';
  text(ctx, won ? 'THE GARDEN HOLDS!' : 'THE BLIGHT WINS…', cx, 190, 46, won ? COLORS.gold : COLORS.heart, 'center', 800);
  text(ctx, won
    ? 'All 15 waves broken. The Heartseed blooms another spring.'
    : `The blight overran the garden on wave ${game.wave}. Plant smarter, Warden.`,
  cx, 226, 16, COLORS.dim, 'center', 500);
  panel(ctx, cx - 220, 256, 440, 170);
  const rows = [
    ['Final score', `${game.score}`],
    ['Waves survived', `${won ? TOTAL_WAVES : game.wave - 1} / ${TOTAL_WAVES}`],
    ['Blight slain', `${game.stats.kills}`],
    ['Towers grown', `${game.stats.built}`],
    ['Lives left', `${game.lives}`],
    ['Sunbursts cast', `${game.stats.sunbursts}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 288 + i * 26;
    text(ctx, label, cx - 190, y, 15, COLORS.dim);
    text(ctx, value, cx + 190, y, 15, COLORS.text, 'right', 700);
  });
  button(game, 'again', cx - 130, 452, 260, 54, won ? '↻  PLAY AGAIN' : '↻  TRY AGAIN', {
    accent: true, font: 18,
    action: () => game.startGame(),
  });
  text(ctx, 'or press Enter', cx, 534, 13, COLORS.dim, 'center', 500);
}

function drawBanner(game) {
  const b = game.banner;
  if (!b || game.time > b.until) return;
  const ctx = game.ctx;
  const remain = b.until - game.time;
  const alpha = Math.min(1, remain / 0.5);
  ctx.globalAlpha = alpha;
  text(ctx, b.text, BOARD_W / 2, 84, 34, COLORS.text, 'center', 800);
  if (b.sub) text(ctx, b.sub, BOARD_W / 2, 112, 15, COLORS.dim, 'center', 500);
  ctx.globalAlpha = 1;
}

// --- Main entry ------------------------------------------------------------
export function draw(game) {
  const ctx = game.ctx;
  game.ui = [];
  ctx.save();
  if (game.shake > 0) {
    const s = game.shake * 14;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  const bg = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  bg.addColorStop(0, COLORS.bg1);
  bg.addColorStop(1, COLORS.bg0);
  ctx.fillStyle = bg;
  ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);

  drawBoard(game);
  drawTowers(game);
  const enemies = game.state === 'title' ? game.demoEnemies : game.enemies;
  for (const e of enemies) drawEnemy(game, e);
  drawProjectiles(game);
  drawEffects(game);
  drawSidebar(game);
  drawBanner(game);
  ctx.restore();

  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,240,180,${game.flash * 0.5})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (game.state === 'title') drawTitle(game);
  else if (game.paused && game.state === 'playing') drawPause(game);
  else if (game.state === 'victory' || game.state === 'defeat') drawEnd(game);
}
