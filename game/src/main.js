// Thornwatch — boot: canvas setup, the frame loop, input wiring, and the
// ?shot= staging hook used for screenshots. Exposes window.__game so
// automated play-tests can drive the game without a mouse.

import { VIEW_W, VIEW_H } from './config.js';
import { Game } from './game.js';
import { draw } from './render.js';
import { attachInput } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const game = new Game(canvas);
window.__game = game;

attachInput(canvas, game);
const shot = applyShot(game, window.location.search);
window.__shot = shot;

// Keep the canvas fitted to the window while preserving 16:9.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000;
  last = now;
  game.update(dt);
  draw(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
