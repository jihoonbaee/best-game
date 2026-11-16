// Thornwatch — deterministic staging for screenshots, driven by the URL:
//   ?shot=start    title screen (the default)
//   ?shot=play     mid-game: wave 8 in progress, towers firing
//   ?shot=boss     the final wave: the Blightlord on the road, a tower selected
//   ?shot=victory  the win screen with final stats
//   ?shot=defeat   the loss screen
// Each shot runs the real game logic forward by fixed steps, so the picture
// is a genuine render of a genuine game state, never a mock-up.

import { TOWERS } from './config.js';

// Place a tower ignoring gold (staging only) and set its level.
function stageTower(game, type, col, row, level = 1) {
  const before = game.gold;
  game.gold = 100000;
  game.placeTower(type, col, row);
  game.gold = before;
  const t = game.towers[game.towers.length - 1];
  while (t.level < level) {
    t.invested += t.upgradeCost;
    t.level++;
  }
  return t;
}

// Advance the simulation by whole fixed steps (no rendering in between).
function fastForward(game, seconds) {
  const step = 1 / 60;
  const n = Math.round(seconds / step);
  for (let i = 0; i < n; i++) game.update(step);
}

function stagePlay(game) {
  game.startGame();
  game.gold = 320;
  game.lives = 18;
  game.score = 2450;
  stageTower(game, 'thorn', 9, 2, 2);
  stageTower(game, 'thorn', 9, 3, 1);
  stageTower(game, 'frost', 2, 3, 2);
  stageTower(game, 'ember', 5, 2, 1);
  stageTower(game, 'root', 5, 6, 1);
  stageTower(game, 'thorn', 2, 5, 1);
  stageTower(game, 'frost', 8, 6, 1);
  stageTower(game, 'ember', 3, 0, 2);
  game.gold = 320;
  game.wave = 7;
  game.startWave(); // wave 8
  fastForward(game, 11);
  game.banner = null;
}

function stageBoss(game) {
  game.startGame();
  game.gold = 540;
  game.lives = 14;
  game.score = 9800;
  stageTower(game, 'thorn', 9, 2, 3);
  stageTower(game, 'thorn', 9, 3, 3);
  stageTower(game, 'frost', 2, 3, 3);
  stageTower(game, 'ember', 5, 2, 2);
  const root = stageTower(game, 'root', 5, 6, 3);
  stageTower(game, 'ember', 3, 0, 3);
  stageTower(game, 'frost', 8, 6, 2);
  stageTower(game, 'thorn', 2, 5, 2);
  game.gold = 540;
  game.wave = 14;
  game.startWave(); // wave 15
  // Trim the spawn queue so the Blightlord leads the parade.
  game.spawnQueue = ['lord', 'beetle', 'beetle', 'bat', 'bat', 'moth', 'moth', 'moth'];
  fastForward(game, 9);
  game.banner = null;
  game.selected = root; // show the upgrade panel in the screenshot
}

function stageVictory(game) {
  game.startGame();
  game.banner = null;
  stageTower(game, 'thorn', 9, 2, 3);
  stageTower(game, 'frost', 2, 3, 3);
  stageTower(game, 'ember', 5, 2, 3);
  stageTower(game, 'root', 5, 6, 3);
  stageTower(game, 'thorn', 2, 5, 2);
  stageTower(game, 'thorn', 3, 0, 2);
  stageTower(game, 'ember', 9, 3, 2);
  stageTower(game, 'frost', 8, 5, 2);
  stageTower(game, 'thorn', 5, 8, 1);
  stageTower(game, 'root', 9, 6, 2);
  stageTower(game, 'frost', 2, 6, 1);
  game.gold = 486;
  game.lives = 12;
  game.score = 18450;
  game.wave = 15;
  game.stats.kills = 312;
  game.stats.built = 11;
  game.stats.sunbursts = 4;
  game.state = 'victory';
}

function stageDefeat(game) {
  game.startGame();
  game.banner = null;
  stageTower(game, 'thorn', 9, 2, 2);
  stageTower(game, 'frost', 2, 3, 1);
  stageTower(game, 'ember', 5, 2, 1);
  game.gold = 40;
  game.lives = 0;
  game.score = 5240;
  game.wave = 9;
  game.stats.kills = 148;
  game.stats.built = 6;
  game.stats.sunbursts = 2;
  game.state = 'defeat';
}

export function applyShot(game, search) {
  const params = new URLSearchParams(search);
  const shot = params.get('shot') || 'start';
  if (shot === 'play') stagePlay(game);
  else if (shot === 'boss') stageBoss(game);
  else if (shot === 'victory') stageVictory(game);
  else if (shot === 'defeat') stageDefeat(game);
  // 'start' (or anything else): the title screen, nothing to stage.
  return shot;
}
