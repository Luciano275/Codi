import * as THREE from 'three';

interface ModelCameraFrameInput {
  bounds: THREE.Box3;
  camera: THREE.PerspectiveCamera;
  direction: THREE.Vector3;
  margin: number;
  target?: THREE.Vector3;
}

interface ModelCameraFrame {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export function getModelCameraFrame({
  bounds,
  camera,
  direction,
  margin,
  target,
}: ModelCameraFrameInput): ModelCameraFrame | null {
  if (bounds.isEmpty()) return null;

  const center = target ?? bounds.getCenter(new THREE.Vector3());
  const viewDirection = direction.clone().normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), viewDirection).normalize();
  const up = new THREE.Vector3().crossVectors(viewDirection, right).normalize();
  const verticalTangent = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const horizontalTangent = verticalTangent * camera.aspect;
  let distance = 0;

  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const offset = new THREE.Vector3(x, y, z).sub(center);
        const depth = offset.dot(viewDirection);
        distance = Math.max(
          distance,
          depth + Math.abs(offset.dot(right)) / horizontalTangent,
          depth + Math.abs(offset.dot(up)) / verticalTangent,
        );
      }
    }
  }

  return {
    target: center,
    position: center.clone().addScaledVector(viewDirection, distance * margin),
  };
}
