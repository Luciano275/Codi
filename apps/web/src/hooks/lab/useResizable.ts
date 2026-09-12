'use client';

import { useState, useCallback, useRef } from 'react';

export function useResizable(initialHeight: number, minHeight = 120) {
  const [height, setHeight] = useState(initialHeight);
  const resizing = useRef(false);

  const startResize = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      resizing.current = true;
      const startY = 'clientY' in e ? e.clientY : e.touches[0]?.clientY ?? 0;
      const startH = height;

      const onMove = (ev: MouseEvent | TouchEvent) => {
        if (!resizing.current) return;
        const currentY = 'clientY' in ev ? ev.clientY : ev.touches[0]?.clientY ?? startY;
        setHeight(Math.max(minHeight, startH - (currentY - startY)));
      };
      const onUp = () => {
        resizing.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp, { once: true });
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('touchend', onUp, { once: true });
    },
    [height, minHeight],
  );

  return { height, startResize };
}