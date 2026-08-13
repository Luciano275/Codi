'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { uploadFileThroughApi } from '@/lib/backend-upload';
import { AvatarCropDialog } from './AvatarCropDialog';

interface AvatarUploadFieldProps {
  hasCurrentAvatar: boolean;
  onUploadKey: (key: string) => void;
  onPreviewFile: (file: File) => void;
  onRemove: () => void;
}

export function AvatarUploadField({
  hasCurrentAvatar,
  onUploadKey,
  onPreviewFile,
  onRemove,
}: AvatarUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isUploadingRef = useRef(false);
  const [candidate, setCandidate] = useState<{ file: File; sourceUrl: string } | null>(null);
  const [fileName, setFileName] = useState<string | null>(hasCurrentAvatar ? 'Foto actual' : null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (candidate) URL.revokeObjectURL(candidate.sourceUrl);
    },
    [candidate],
  );

  const chooseFile = (file: File) => {
    setError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Elegí una imagen JPG, PNG o WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5 MB.');
      return;
    }
    setCandidate({ file, sourceUrl: URL.createObjectURL(file) });
    if (inputRef.current) inputRef.current.value = '';
  };

  const confirmAvatar = async (croppedFile: File) => {
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;
    setProgress(0);
    try {
      const uploadKey = await uploadFileThroughApi('avatar', croppedFile, setProgress);
      onPreviewFile(croppedFile);
      setFileName('Nueva foto lista para guardar');
      onUploadKey(uploadKey);
      setCandidate(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la foto');
    } finally {
      isUploadingRef.current = false;
      setProgress(null);
    }
  };

  const removeAvatar = () => {
    setFileName(null);
    onRemove();
  };

  return (
    <div>
      <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-600">
        Foto de perfil
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) chooseFile(file);
        }}
      />
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
        {progress !== null ? (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin text-lagos-600" />
            Subiendo foto {progress}%
          </div>
        ) : fileName ? (
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-pradera-500" />
            <span className="min-w-0 flex-1 truncate font-medium text-gray-700">{fileName}</span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-lagos-600 hover:bg-lagos-50"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={removeAvatar}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
              aria-label="Quitar foto de perfil"
              title="Quitar foto de perfil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-lagos-600 hover:bg-lagos-50"
          >
            <Camera className="h-4 w-4" />
            Elegir y encuadrar foto
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">
        JPG, PNG o WebP. Máximo 5 MB. Los cambios se aplican al guardar el perfil.
      </p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {candidate && (
        <AvatarCropDialog
          file={candidate.file}
          sourceUrl={candidate.sourceUrl}
          onConfirm={confirmAvatar}
          onCancel={() => setCandidate(null)}
        />
      )}
    </div>
  );
}
