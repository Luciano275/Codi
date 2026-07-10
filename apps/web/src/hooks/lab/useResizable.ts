'use client';

import { useState, useCallback, useRef } from 'react';

export function useResizable(initialHeight: number, minHeight = 120) {
  const [height, setHeight] = useState(initialHeight);
  const resizing = useRef(false);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    const startY = e.clientY;
    const startH = height;
    const onMouseMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      setHeight(Math.max(minHeight, startH - (ev.clientY - startY)));
    };
    const onMouseUp = () => {
      resizing.current = false;
      window.removeEventListener('mousemove', onMouseMove);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp, { once: true });
  }, [height, minHeight]);

  return { height, startResize };
}
