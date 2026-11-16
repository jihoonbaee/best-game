// Thornwatch — balance, layout and palette in one place.
// Every number the game plays by lives here so tuning never touches logic.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// --- Board layout -----------------------------------------------------------
export const BOARD_W = 920; // board area, x 0..920; sidebar takes the rest
export const GRID_COLS = 12;
export const GRID_ROWS = 9;
export const TILE = 72;
export const GRID_OX = 28; // (920 - 12*72) / 2
export const GRID_OY = 36; // (720 - 9*72) / 2
export const SIDEBAR_X = 920;
export const SIDEBAR_W = 360;

export const tileCenterX = (col) => GRID_OX + col * TILE + TILE / 2;
export const tileCenterY = (row) => GRID_OY + row * TILE + TILE / 2;

// The blight road, as a list of grid tiles it runs through (serpentine).
export const PATH_TILES = (() => {
  const tiles = [];
  const push = (c, r) => tiles.push([c, r]);
  for (let c = 0; c <= 10; c++) push(c, 1);
  for (let r = 2; r <= 4; r++) push(10, r);
  for (let c = 9; c >= 1; c--) push(c, 4);
  for (let r = 5; r <= 7; r++) push(1, r);
  for (let c = 2; c <= 11; c++) push(c, 7);
  return tiles;
})();

export const PATH_SET = new Set(PATH_TILES.map(([c, r]) => `${c},${r}`));

// Waypoints the enemies walk, in pixels (off-screen start, off-board end).
export const WAYPOINTS = [
  { x: -40, y: tileCenterY(1) },
  { x: tileCenterX(10), y: tileCenterY(1) },
  { x: tileCenterX(10), y: tileCenterY(4) },
  { x: tileCenterX(1), y: tileCenterY(4) },
  { x: tileCenterX(1), y: tileCenterY(7) },
  { x: tileCenterX(11), y: tileCenterY(7) },
  { x: 950, y: tileCenterY(7) },
];

// The Heartseed the player defends, at the end of the road.
export const HEART = { x: 898, y: tileCenterY(7), r: 24 };

// --- Economy ---------------------------------------------------------------
export const START_GOLD = 150;
export const START_LIVES = 20;
export const TOTAL_WAVES = 15;
export const SELL_RATE = 0.7;
export const WAVE_BONUS_GOLD = (wave) => 15 + wave * 4;

// --- Towers ----------------------------------------------------------------
export const TOWERS = {
  thorn: {
    name: 'Thornspitter',
    short: 'Thorn',
    key: '1',
    cost: 50,
    color: '#7ed957',
    dark: '#3f9e3a',
    desc: 'Fast thorns. Cheap and reliable.',
    levels: [
      { damage: 6, rate: 2.4, range: 132, splash: 0 },
      { damage: 9, rate: 3.0, range: 140, splash: 0 },
      { damage: 14, rate: 3.6, range: 150, splash: 0 },
    ],
  },
  frost: {
    name: 'Frostbloom',
    short: 'Frost',
    key: '2',
    cost: 75,
    color: '#7fd4ff',
    dark: '#3a8fd9',
    desc: 'Chills enemies, slowing them down.',
    levels: [
      { damage: 3, rate: 1.1, range: 122, splash: 0, slow: 0.4, slowTime: 1.5 },
      { damage: 5, rate: 1.2, range: 130, splash: 0, slow: 0.5, slowTime: 2.0 },
      { damage: 8, rate: 1.4, range: 140, splash: 0, slow: 0.6, slowTime: 2.5 },
    ],
  },
  root: {
    name: 'Rootspike',
    short: 'Root',
    key: '3',
    cost: 100,
    color: '#c99aff',
    dark: '#8a5fd0',
    desc: 'Long-range spike. Huge single hits.',
    levels: [
      { damage: 30, rate: 0.45, range: 245, splash: 0 },
      { damage: 50, rate: 0.5, range: 255, splash: 0 },
      { damage: 85, rate: 0.6, range: 270, splash: 0 },
    ],
  },
  ember: {
    name: 'Emberpod',
    short: 'Ember',
    key: '4',
    cost: 120,
    color: '#ffb347',
    dark: '#e07b2a',
    desc: 'Lobs bursting pods. Splash damage.',
    levels: [
      { damage: 15, rate: 0.6, range: 152, splash: 62 },
      { damage: 24, rate: 0.65, range: 160, splash: 74 },
      { damage: 38, rate: 0.7, range: 170, splash: 88 },
    ],
  },
};
export const TOWER_ORDER = ['thorn', 'frost', 'root', 'ember'];
export const UPGRADE_COST = (type, level) =>
  Math.round(TOWERS[type].cost * (level === 1 ? 0.6 : 1.0));

// --- Enemies ---------------------------------------------------------------
export const ENEMIES = {
  sproutling: {
    name: 'Sproutling',
    hp: 30, speed: 56, gold: 8, lives: 1, radius: 14,
    color: '#8be04e', dark: '#4c9a2a', score: 80,
  },
  moth: {
    name: 'Swiftmoth',
    hp: 22, speed: 98, gold: 10, lives: 1, radius: 12,
    color: '#ffb347', dark: '#d97b2a', score: 100,
  },
  beetle: {
    name: 'Barkbeetle',
    hp: 130, speed: 36, gold: 16, lives: 2, radius: 17,
    color: '#b08954', dark: '#7a5a30', score: 160,
  },
  bat: {
    name: 'Sporebat',
    hp: 48, speed: 74, gold: 12, lives: 1, radius: 13,
    color: '#c99aff', dark: '#8a5fd0', score: 120,
  },
  warden: {
    name: 'Blight Warden',
    hp: 620, speed: 30, gold: 80, lives: 5, radius: 22,
    color: '#e05a5a', dark: '#a83232', score: 800,
  },
  lord: {
    name: 'Blightlord',
    hp: 1600, speed: 27, gold: 220, lives: 10, radius: 28,
    color: '#ff4d6d', dark: '#b32a44', score: 2200,
  },
};
// HP grows with the wave so late waves stay threatening.
export const hpScale = (wave) => 1 + 0.26 * (wave - 1);
export const speedScale = (wave) => Math.min(1.25, 1 + 0.015 * (wave - 1));

// --- Sunburst ability ------------------------------------------------------
export const SUNBURST = {
  damage: 45,
  cooldown: 30, // seconds
  key: 'Q',
};

// --- Palette ---------------------------------------------------------------
export const COLORS = {
  bg0: '#0b1f16',
  bg1: '#10291d',
  panel: '#132e21',
  panelEdge: '#2c5a41',
  text: '#eaf7ee',
  dim: '#9fc4ad',
  gold: '#ffd94d',
  heart: '#ff6b81',
  path: '#5a4632',
  pathEdge: '#7a6248',
  grass: '#1d3d2a',
  grass2: '#224832',
  button: '#2c6b4a',
  buttonHover: '#37845c',
  danger: '#ff5a5a',
};
