/**
 * useParticleWorker — React hook interfacing with multithreaded Particle Worker.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export default function useParticleWorker() {
  const [activeParticles, setActiveParticles] = useState([]);
  const workerRef = useRef(null);

  useEffect(() => {
    try {
      const worker = new Worker(
        new URL('../workers/particleWorker.js', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e) => {
        if (e.data.type === 'PARTICLES_UPDATED') {
          setActiveParticles([...e.data.particles]);
        }
      };

      workerRef.current = worker;

      return () => {
        worker.terminate();
      };
    } catch (err) {
      console.warn('Particle Web Worker not supported in this context:', err);
    }
  }, []);

  const spawnBurst = useCallback((count = 60, originX = 0.5, originY = 0.5, emojis = ['✨', '🔥', '🃏', '💥']) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'SPAWN_BURST',
        payload: { count, originX, originY, emojis },
      });
    }
  }, []);

  const clearParticles = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'CLEAR' });
    }
    setActiveParticles([]);
  }, []);

  return { activeParticles, spawnBurst, clearParticles };
}
