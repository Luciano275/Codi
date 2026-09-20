export interface WebGlRenderQuality {
  pixelRatioCap: number;
  shadowMapSize: number;
}

export function getWebGlRenderQuality(): WebGlRenderQuality {
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  const hasLimitedCpu = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
  const hasLimitedMemory =
    navigatorWithMemory.deviceMemory !== undefined && navigatorWithMemory.deviceMemory <= 4;
  const usesCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  return usesCoarsePointer || hasLimitedCpu || hasLimitedMemory
    ? { pixelRatioCap: 1.25, shadowMapSize: 1024 }
    : { pixelRatioCap: 2, shadowMapSize: 2048 };
}
