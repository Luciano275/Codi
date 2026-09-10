import { useEffect, useState } from 'react';

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
}

function hasConstrainedResources() {
  const navigatorWithMemory = navigator as NavigatorWithDeviceMemory;
  const hasFewLogicalCores =
    navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
  const hasLittleMemory =
    navigatorWithMemory.deviceMemory !== undefined && navigatorWithMemory.deviceMemory <= 4;

  return hasFewLogicalCores || hasLittleMemory;
}

export function useReducedParticleDensity() {
  const [shouldReduceParticles, setShouldReduceParticles] = useState(false);

  useEffect(() => {
    setShouldReduceParticles(hasConstrainedResources());
  }, []);

  return shouldReduceParticles;
}
