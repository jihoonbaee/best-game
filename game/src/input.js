// Thornwatch — mouse and keyboard wiring. Translates page coordinates into
// the game's logical 1280x720 space and hands events to the Game.

import { VIEW_W, VIEW_H } from './config.js';

export function attachInput(canvas, game) {
  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (VIEW_W / rect.width),
      y: (event.clientY - rect.top) * (VIEW_H / rect.height),
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = toLogical(event);
    game.move(p.x, p.y);
  });

  canvas.addEventListener('mouseleave', () => {
    game.hover.x = -1;
    game.hover.y = -1;
    game.hover.col = -1;
    game.hover.row = -1;
  });

  canvas.addEventListener('click', (event) => {
    const p = toLogical(event);
    game.click(p.x, p.y);
  });

  // Right-click cancels placement or selection, like Esc.
  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (game.placing) game.placing = null;
    else game.selected = null;
  });

  window.addEventListener('keydown', (event) => {
    // Space scrolls the page by default; the game owns it.
    if (event.key === ' ') event.preventDefault();
    game.key(event.key);
  });
}
