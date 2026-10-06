/**
 * Particle Physics Web Worker — Multithreaded Visual Particle Computation.
 *
 * Simulates confetti blasts, card dealing trajectories, and meme emoji burst
 * physics off the main UI thread to preserve 60FPS fluid rendering.
 */

let particles = [];
let isRunning = false;
let animationTimer = null;

self.onmessage = function (e) {
  const { type, payload } = e.data;

  if (type === 'SPAWN_BURST') {
    const { count = 60, originX = 0.5, originY = 0.5, emojis = ['✨', '🔥', '🃏', '💥'] } = payload;
    spawnParticles(count, originX, originY, emojis);
    if (!isRunning) {
      isRunning = true;
      startLoop();
    }
  } else if (type === 'CLEAR') {
    particles = [];
    isRunning = false;
    if (animationTimer) clearInterval(animationTimer);
  }
};

function spawnParticles(count, originX, originY, emojis) {
  const colors = ['#facc15', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#f97316'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 12;
    particles.push({
      id: Math.random().toString(36).substring(2, 9),
      x: originX * 100, // percentage
      y: originY * 100,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6, // upward burst
      gravity: 0.35 + Math.random() * 0.15,
      drag: 0.96,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 20,
      size: 14 + Math.random() * 16,
      alpha: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: Math.random() > 0.4 ? emojis[Math.floor(Math.random() * emojis.length)] : null,
      life: 1.0,
      decay: 0.015 + Math.random() * 0.02,
    });
  }
}

function startLoop() {
  const intervalMs = 1000 / 60; // 60 updates per second
  animationTimer = setInterval(() => {
    if (particles.length === 0) {
      isRunning = false;
      clearInterval(animationTimer);
      self.postMessage({ type: 'PARTICLES_UPDATED', particles: [] });
      return;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * 0.15;
      p.y += p.vy * 0.15;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.rotation += p.vRotation;
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);

      if (p.life <= 0 || p.y > 110) {
        particles.splice(i, 1);
      }
    }

    self.postMessage({ type: 'PARTICLES_UPDATED', particles });
  }, intervalMs);
}
