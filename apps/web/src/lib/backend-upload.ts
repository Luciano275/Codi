export type UploadAssetType =
  | 'avatar'
  | 'lesson-image'
  | 'lesson-pdf'
  | 'lesson-video'
  | 'island-model';

interface UploadResponse {
  uploadKey: string;
}

/** Sends the file to Nest. Only the API communicates with S3. */
export function uploadFileThroughApi(
  assetType: UploadAssetType,
  file: File,
  onProgress?: (progress: number) => void,
) {
  const endpoint =
    assetType === 'avatar'
      ? '/api/uploads/avatar'
      : assetType === 'island-model'
        ? '/api/uploads/island-model'
        : '/api/uploads/lesson-asset';
  return new Promise<string>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    if (assetType.startsWith('lesson-')) formData.append('assetType', assetType);

    const request = new XMLHttpRequest();
    request.open('POST', `/api/proxy${endpoint}`);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error('No se pudo enviar el archivo a la API'));
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        try {
          const error = JSON.parse(request.responseText) as { message?: string };
          reject(new Error(error.message ?? 'La API rechazó el archivo'));
        } catch {
          reject(new Error('La API rechazó el archivo'));
        }
        return;
      }
      try {
        resolve((JSON.parse(request.responseText) as UploadResponse).uploadKey);
      } catch {
        reject(new Error('La API devolvió una respuesta inválida'));
      }
    };
    request.send(formData);
  });
}
