/**
 * useAiWorker — React hook interfacing with multithreaded AI Bot Decision Worker.
 */

import { useEffect, useRef, useCallback } from 'react';

export default function useAiWorker() {
  const workerRef = useRef(null);
  const pendingCallbacks = useRef(new Map());

  useEffect(() => {
    try {
      const worker = new Worker(
        new URL('../workers/aiWorker.js', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e) => {
        const { type, result, odds } = e.data;
        if (type === 'MOVE_EVALUATED') {
          const cb = pendingCallbacks.current.get('EVALUATE_MOVE');
          if (cb) {
            cb(result);
            pendingCallbacks.current.delete('EVALUATE_MOVE');
          }
        } else if (type === 'WIN_ODDS_CALCULATED') {
          const cb = pendingCallbacks.current.get('SIMULATE_WIN_ODDS');
          if (cb) {
            cb(odds);
            pendingCallbacks.current.delete('SIMULATE_WIN_ODDS');
          }
        }
      };

      workerRef.current = worker;

      return () => {
        worker.terminate();
      };
    } catch (err) {
      console.warn('AI Web Worker not supported in this context:', err);
    }
  }, []);

  const evaluateMove = useCallback((params) => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve({ cardId: null, chosenColor: null });
        return;
      }
      pendingCallbacks.current.set('EVALUATE_MOVE', resolve);
      workerRef.current.postMessage({
        type: 'EVALUATE_MOVE',
        payload: params,
      });
    });
  }, []);

  const calculateOdds = useCallback((params) => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve({});
        return;
      }
      pendingCallbacks.current.set('SIMULATE_WIN_ODDS', resolve);
      workerRef.current.postMessage({
        type: 'SIMULATE_WIN_ODDS',
        payload: params,
      });
    });
  }, []);

  return { evaluateMove, calculateOdds };
}
