'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildXpAnimationSegments,
  getLevelProgress,
  type LevelProgress,
  type XpAnimationSegment,
} from '@codi/progression';

interface LevelChange {
  previousLevel: number;
  level: number;
}

export function useXPBarSequence(totalXp: number, reducedMotion: boolean) {
  const initialProgressRef = useRef<LevelProgress | null>(null);
  initialProgressRef.current ??= getLevelProgress(totalXp);

  const [displayProgress, setDisplayProgress] = useState(initialProgressRef.current);
  const [activeSegment, setActiveSegment] = useState<XpAnimationSegment | null>(null);
  const [levelChange, setLevelChange] = useState<LevelChange | null>(null);
  const [segmentKey, setSegmentKey] = useState(0);

  const activeSegmentRef = useRef<XpAnimationSegment | null>(null);
  const committedTotalXpRef = useRef(totalXp);
  const targetTotalXpRef = useRef(totalXp);
  const segmentQueueRef = useRef<XpAnimationSegment[]>([]);
  const runningRef = useRef(false);
  const timersRef = useRef<Set<number>>(new Set());

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const advanceSequence = useCallback(() => {
    if (segmentQueueRef.current.length === 0) {
      const committedXp = committedTotalXpRef.current;
      const targetXp = targetTotalXpRef.current;
      segmentQueueRef.current = buildXpAnimationSegments(committedXp, targetXp);
    }

    const nextSegment = segmentQueueRef.current.shift() ?? null;
    activeSegmentRef.current = nextSegment;
    setActiveSegment(nextSegment);

    if (nextSegment) {
      setSegmentKey((key) => key + 1);
      return;
    }

    runningRef.current = false;
    setDisplayProgress(getLevelProgress(committedTotalXpRef.current));
  }, []);

  useEffect(() => {
    targetTotalXpRef.current = totalXp;

    if (totalXp < committedTotalXpRef.current) {
      clearTimers();
      segmentQueueRef.current = [];
      activeSegmentRef.current = null;
      committedTotalXpRef.current = totalXp;
      runningRef.current = false;
      setActiveSegment(null);
      setLevelChange(null);
      setDisplayProgress(getLevelProgress(totalXp));
      return;
    }

    if (!runningRef.current && totalXp > committedTotalXpRef.current) {
      runningRef.current = true;
      advanceSequence();
    }
  }, [advanceSequence, clearTimers, totalXp]);

  useEffect(() => clearTimers, [clearTimers]);

  const completeBarFill = useCallback(() => {
    const segment = activeSegmentRef.current;
    if (!segment) return;

    committedTotalXpRef.current = segment.totalXpAfterSegment;
    setDisplayProgress({
      level: segment.level,
      xpIntoLevel: segment.endXp,
      xpToNextLevel: segment.xpToNextLevel,
      progress: segment.endXp / segment.xpToNextLevel,
    });

    if (segment.levelUpTo) {
      schedule(
        () => setLevelChange({ previousLevel: segment.level, level: segment.levelUpTo! }),
        reducedMotion ? 80 : 240,
      );
      return;
    }

    activeSegmentRef.current = null;
    setActiveSegment(null);
    advanceSequence();
  }, [advanceSequence, reducedMotion, schedule]);

  const completeLevelUp = useCallback(() => {
    setLevelChange(null);
    activeSegmentRef.current = null;
    setActiveSegment(null);
    setDisplayProgress(getLevelProgress(committedTotalXpRef.current));
    setSegmentKey((key) => key + 1);
    schedule(advanceSequence, reducedMotion ? 60 : 160);
  }, [advanceSequence, reducedMotion, schedule]);

  return {
    activeSegment,
    completeBarFill,
    completeLevelUp,
    displayProgress,
    levelChange,
    segmentKey,
  };
}
