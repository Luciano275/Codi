'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileUp, Loader2, Trash2 } from 'lucide-react';
import { uploadFileThroughApi, type UploadAssetType } from '@/lib/backend-upload';

interface PrivateFileUploadFieldProps {
  assetType: UploadAssetType;
  accept: string;
  label: string;
  helpText: string;
  currentFileName?: string | null;
  preview?: 'pdf';
  onUploadKey: (uploadKey: string) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  onRemove?: () => void;
}

export function PrivateFileUploadField({
  assetType,
  accept,
  label,
  helpText,
  currentFileName,
  preview,
  onUploadKey,
  onUploadStateChange,
  onRemove,
}: PrivateFileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(currentFileName ?? null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const selectFile = async (file: File) => {
    setError(null);
    if (preview === 'pdf') {
      setPreviewUrl((previousUrl) => {
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
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir el archivo');
    } finally {
      setProgress(null);
      onUploadStateChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

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
        {fileName ? (
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-pradera-500" />
            <span className="min-w-0 flex-1 truncate font-medium text-gray-700">{fileName}</span>
            <button
              type="button"
              onClick={() => {
                setFileName(null);
                setPreviewUrl(null);
                onRemove?.();
              }}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
              aria-label={`Quitar ${label}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={progress !== null}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-lagos-600 hover:bg-lagos-50 disabled:cursor-wait"
          >
            {progress !== null ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            {progress !== null ? `Subiendo ${progress}%` : 'Seleccionar archivo'}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">{helpText}</p>
      {preview === 'pdf' && previewUrl && (
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-3 py-2 text-xs font-medium text-gray-500">
            Vista previa local del PDF
          </div>
          <iframe
            src={previewUrl}
            title="Vista previa local del PDF"
            className="h-72 w-full bg-gray-50"
          />
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
