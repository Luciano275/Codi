'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileUp, Loader2, Trash2 } from '@/components/ui/Icon';
import { uploadFileThroughApi, type UploadAssetType } from '@/lib/backend-upload';
import {
  LessonAssetPreview,
  type LessonAssetPreviewType,
} from '@/components/uploads/LessonAssetPreview';

interface PrivateFileUploadFieldProps {
  assetType: UploadAssetType;
  accept: string;
  label: string;
  helpText: string;
  currentFileName?: string | null;
  currentFileUrl?: string | null;
  preview?: LessonAssetPreviewType;
  onUploadKey: (uploadKey: string) => void;
  onFileSelected?: (file: File) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  onRemove?: () => void;
}

export function PrivateFileUploadField({
  assetType,
  accept,
  label,
  helpText,
  currentFileName,
  currentFileUrl,
  preview,
  onUploadKey,
  onFileSelected,
  onUploadStateChange,
  onRemove,
}: PrivateFileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(currentFileName ?? null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isRemoved, setIsRemoved] = useState(false);

  useEffect(
    () => () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    },
    [localPreviewUrl],
  );

  const selectFile = async (file: File) => {
    onFileSelected?.(file);
    setError(null);
    setIsRemoved(false);
    if (preview) {
      setLocalPreviewUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return URL.createObjectURL(file);
      });
    }
    setProgress(0);
    onUploadStateChange?.(true);
    try {
      const uploadKey = await uploadFileThroughApi(assetType, file, setProgress);
      setFileName(file.name);
      onUploadKey(uploadKey);
    } catch (uploadError) {
      setLocalPreviewUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return null;
      });
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir el archivo');
    } finally {
      setProgress(null);
      onUploadStateChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setFileName(null);
    setIsRemoved(true);
    setLocalPreviewUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return null;
    });
    onRemove?.();
  };

  const previewUrl = isRemoved ? null : (localPreviewUrl ?? currentFileUrl);
  const hasFile = Boolean(fileName || previewUrl);

  return (
    <div>
      <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-600">
        {label}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void selectFile(file);
        }}
      />
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
        {progress !== null ? (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-lagos-600" />
            Subiendo archivo {progress}%
          </div>
        ) : hasFile ? (
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-pradera-500" />
            <span className="min-w-0 flex-1 truncate font-medium text-gray-700">
              {fileName ?? 'Archivo adjunto'}
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-lagos-600 hover:bg-lagos-50"
            >
              Cambiar
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={removeFile}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                aria-label={`Quitar ${label}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={progress !== null}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-lagos-600 hover:bg-lagos-50 disabled:cursor-wait"
          >
            <FileUp className="h-4 w-4" />
            Seleccionar archivo
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">{helpText}</p>
      {preview && previewUrl && (
        <LessonAssetPreview type={preview} sourceUrl={previewUrl} fileName={fileName} />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
