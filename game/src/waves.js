// Thornwatch — wave composition. Each wave is a queue of enemy types with a
// spawn interval; later waves mix fast, tanky and flying blight, with a
// mini-boss on wave 8 and the Blightlord on the final wave 15.

import { TOTAL_WAVES } from './config.js';

// [type, count] pairs per wave. Designed so every tower type stays useful:
// moths punish slow towers, beetles punish weak ones, bats reward splash.
const TABLE = {
  1: [['sproutling', 8]],
  2: [['sproutling', 12]],
  3: [['sproutling', 10], ['moth', 5]],
  4: [['sproutling', 12], ['moth', 8]],
  5: [['sproutling', 10], ['beetle', 3], ['moth', 6]],
  6: [['sproutling', 14], ['beetle', 4], ['moth', 8]],
  7: [['sproutling', 12], ['bat', 6], ['beetle', 4]],
  8: [['sproutling', 10], ['bat', 8], ['warden', 1], ['moth', 8]],
  9: [['beetle', 6], ['bat', 8], ['moth', 10]],
  10: [['sproutling', 16], ['beetle', 6], ['bat', 8]],
  11: [['moth', 14], ['beetle', 7], ['bat', 10]],
  12: [['beetle', 11], ['bat', 12], ['sproutling', 12]],
  13: [['moth', 16], ['bat', 14], ['beetle', 9]],
  14: [['beetle', 11], ['bat', 14], ['warden', 1], ['moth', 14]],
  15: [['sproutling', 14], ['beetle', 8], ['bat', 10], ['lord', 1]],
};

// A short human-readable preview shown in the sidebar before each wave.
export function wavePreview(wave) {
  const groups = TABLE[wave] || [];
  return groups.map(([type, n]) => {
    const label = {
      sproutling: 'Sproutling', moth: 'Swiftmoth', beetle: 'Barkbeetle',
      bat: 'Sporebat', warden: 'Blight Warden', lord: 'BLIGHTLORD',
    }[type];
    return `${n}x ${label}`;
  }).join('  ·  ');
}

export function waveCount(wave) {
  return (TABLE[wave] || []).reduce((sum, [, n]) => sum + n, 0);
}

// Builds the spawn queue for a wave: interleaved so types arrive mixed,
// with the boss (if any) held back until the escorts are out.
export function buildWaveQueue(wave) {
  const groups = TABLE[wave] || [];
  const queue = [];
  const boss = [];
  for (const [type, n] of groups) {
    if (type === 'warden' || type === 'lord') {
      for (let i = 0; i < n; i++) boss.push(type);
    } else {
      for (let i = 0; i < n; i++) queue.push(type);
    }
  }
  // Interleave: round-robin across types instead of clumping one type.
  const interleaved = [];
  const buckets = groups
    .filter(([t]) => t !== 'warden' && t !== 'lord')
    .map(([type, n]) => ({ type, left: n }));
  let added = true;
  while (added) {
    added = false;
    for (const b of buckets) {
      if (b.left > 0) {
        interleaved.push(b.type);
        b.left--;
        added = true;
      }
    }
  }
  return [...interleaved, ...boss];
}

// Seconds between spawns; tighter on later waves.
export function spawnInterval(wave) {
  return Math.max(0.45, 1.05 - wave * 0.04);
}

export { TOTAL_WAVES };
