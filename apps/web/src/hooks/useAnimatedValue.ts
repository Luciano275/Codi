import { useState, useEffect, useRef } from 'react';

export function useAnimatedValue(target: number, duration = 1000): number {
  const [display, setDisplay] = useState(target);
  const prevTargetRef = useRef(target);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevTargetRef.current;
    prevTargetRef.current = target;

    if (from === target || target <= 0) {
      setDisplay(target);
      return;
    }

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + eased * (target - from)));

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [target, duration]);

  return display;
}
