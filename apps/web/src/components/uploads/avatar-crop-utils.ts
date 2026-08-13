const AVATAR_OUTPUT_SIZE = 512;

export async function createCroppedAvatar(
  image: HTMLImageElement,
  scale: number,
  offset: { x: number; y: number },
  viewportSize: number,
) {
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;

  const imageLeft = viewportSize / 2 + offset.x - (image.naturalWidth * scale) / 2;
  const imageTop = viewportSize / 2 + offset.y - (image.naturalHeight * scale) / 2;
  const sourceSize = viewportSize / scale;
  const sourceX = Math.min(Math.max(0, -imageLeft / scale), image.naturalWidth - sourceSize);
  const sourceY = Math.min(Math.max(0, -imageTop / scale), image.naturalHeight - sourceSize);

  canvas.getContext('2d')?.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    AVATAR_OUTPUT_SIZE,
    AVATAR_OUTPUT_SIZE,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('No se pudo preparar la foto')), 'image/jpeg', 0.92);
  });
  return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
}
