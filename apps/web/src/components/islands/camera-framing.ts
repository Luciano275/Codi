import * as THREE from 'three';

const BASELINE_VIEWPORT_HEIGHT = 1100;
const CONSERVATIVE_VIEWPORT_HEIGHT = 600;
const BASE_FRAME_DISTANCE = Math.hypot(8, 15);
const FOCUS_LOWER_BIAS = 0.08;

interface CameraFrameInput {
  bounds: THREE.Box3;
  camera: THREE.PerspectiveCamera;
  direction: THREE.Vector3;
  viewportWidth: number;
  viewportHeight: number;
  topInset: number;
  bottomInset: number;
}

export interface CameraFrame {
  position: THREE.Vector3;
  target: THREE.Vector3;
  distance: number;
}

export function getResponsiveCameraFrame({
  bounds,
  camera,
  direction,
  viewportWidth,
  viewportHeight,
  topInset,
  bottomInset,
}: CameraFrameInput): CameraFrame | null {
  if (viewportWidth <= 0 || viewportHeight <= 0 || bounds.isEmpty()) return null;

  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const heightPressure = getHeightPressure(viewportHeight);
  const target = center.clone();
  target.y -= size.y * FOCUS_LOWER_BIAS * heightPressure;

  const usableHeight = Math.max(viewportHeight - topInset - bottomInset, viewportHeight * 0.45);
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const usableVerticalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * (usableHeight / viewportHeight));
  const effectiveVerticalFov = THREE.MathUtils.lerp(verticalFov, usableVerticalFov, heightPressure);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * (viewportWidth / viewportHeight));
  const referenceDistance = getBoundsDistance(
    bounds,
    center,
    direction,
    horizontalFov,
    verticalFov,
    1,
  );
  const fittedDistance = getBoundsDistance(
    bounds,
    target,
    direction,
    horizontalFov,
    effectiveVerticalFov,
    1 + heightPressure * 0.18,
  );
  const calibratedDistance = BASE_FRAME_DISTANCE * (fittedDistance / referenceDistance);
  const framedDistance = Math.max(
    BASE_FRAME_DISTANCE,
    THREE.MathUtils.lerp(calibratedDistance, fittedDistance, heightPressure),
  );
  return {
    target,
    distance: framedDistance,
    position: target.clone().addScaledVector(direction, framedDistance),
  };
}

function getHeightPressure(viewportHeight: number) {
  const progress = THREE.MathUtils.clamp(
    (BASELINE_VIEWPORT_HEIGHT - viewportHeight) /
      (BASELINE_VIEWPORT_HEIGHT - CONSERVATIVE_VIEWPORT_HEIGHT),
    0,
    1,
  );
  return progress * progress * (3 - 2 * progress);
}

function getBoundsDistance(
  bounds: THREE.Box3,
  target: THREE.Vector3,
  direction: THREE.Vector3,
  horizontalFov: number,
  verticalFov: number,
  margin: number,
) {
  const viewDirection = direction.clone().normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), viewDirection).normalize();
  const up = new THREE.Vector3().crossVectors(viewDirection, right).normalize();
  const horizontalTangent = Math.tan(horizontalFov / 2);
  const verticalTangent = Math.tan(verticalFov / 2);
  let distance = 0;

  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const offset = new THREE.Vector3(x, y, z).sub(target);
        const depth = offset.dot(viewDirection);
        distance = Math.max(
          distance,
          depth + Math.abs(offset.dot(right)) / horizontalTangent,
          depth + Math.abs(offset.dot(up)) / verticalTangent,
        );
      }
    }
  }

  return distance * margin;
}
