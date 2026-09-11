'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Move, RotateCcw, ZoomIn } from '@/components/ui/Icon';
import { createCroppedAvatar } from './avatar-crop-utils';

const VIEWPORT_SIZE = 280;

interface AvatarCropDialogProps {
  file: File;
  sourceUrl: string;
  onConfirm: (file: File) => Promise<void>;
  onCancel: () => void;
}

export function AvatarCropDialog({ file, sourceUrl, onConfirm, onCancel }: AvatarCropDialogProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const isSubmittingRef = useRef(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const baseScale = naturalSize
    ? Math.max(VIEWPORT_SIZE / naturalSize.width, VIEWPORT_SIZE / naturalSize.height)
    : 1;
  const scale = baseScale * zoom;

  const clampOffset = (candidate: { x: number; y: number }, nextZoom = zoom) => {
    if (!naturalSize) return candidate;
    const renderedWidth = naturalSize.width * baseScale * nextZoom;
    const renderedHeight = naturalSize.height * baseScale * nextZoom;
    return {
      x: Math.min(
        Math.max(candidate.x, -(renderedWidth - VIEWPORT_SIZE) / 2),
        (renderedWidth - VIEWPORT_SIZE) / 2,
      ),
      y: Math.min(
        Math.max(candidate.y, -(renderedHeight - VIEWPORT_SIZE) / 2),
        (renderedHeight - VIEWPORT_SIZE) / 2,
      ),
    };
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isCreating) onCancel();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isCreating, onCancel]);

  const updateZoom = (nextZoom: number) => {
    const normalizedZoom = Math.min(Math.max(nextZoom, 1), 3);
    setZoom(normalizedZoom);
    setOffset((current) => clampOffset(current, normalizedZoom));
  };

  const confirmCrop = async () => {
    if (!imageRef.current || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsCreating(true);
    try {
      const croppedFile = await createCroppedAvatar(imageRef.current, scale, offset, VIEWPORT_SIZE);
      await onConfirm(croppedFile);
    } finally {
      isSubmittingRef.current = false;
      setIsCreating(false);
    }
  };

  const stopDragging = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-white/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-busy={isCreating}
      aria-labelledby="avatar-crop-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 id="avatar-crop-title" className="font-super-pandora text-lg text-gray-900">
            Ajustar foto de perfil
          </h2>
          <p className="mt-1 font-simply-olive text-sm text-gray-500">
            Arrastrá la imagen para encuadrarla.
          </p>
        </div>

        <div className="flex justify-center bg-gray-100 p-6">
          <div
            className={`relative touch-none overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-lg ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE, touchAction: 'none' }}
            onPointerDown={(event) => {
              if (isCreating) return;
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = {
                x: event.clientX,
                y: event.clientY,
                offsetX: offset.x,
                offsetY: offset.y,
              };
              setIsDragging(true);
            }}
            onPointerMove={(event) => {
              if (!dragRef.current) return;
              setOffset(
                clampOffset({
                  x: dragRef.current.offsetX + event.clientX - dragRef.current.x,
                  y: dragRef.current.offsetY + event.clientY - dragRef.current.y,
                }),
              );
            }}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            onLostPointerCapture={stopDragging}
          >
            <img
              ref={imageRef}
              src={sourceUrl}
              alt="Vista previa de la foto elegida"
              draggable={false}
              onLoad={(event) =>
                setNaturalSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                width: naturalSize ? naturalSize.width * scale : '100%',
                height: naturalSize ? naturalSize.height * scale : '100%',
                left: `calc(50% + ${offset.x}px)`,
                top: `calc(50% + ${offset.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        </div>

        <div className="space-y-3 px-6 py-5">
          <div className="flex items-center gap-3 text-gray-500">
            <ZoomIn className="h-4 w-4 shrink-0" />
            <input
              aria-label="Zoom de la foto"
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(event) => updateZoom(Number(event.target.value))}
              className="w-full accent-lagos-500"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-gray-400">
              <Move className="h-3.5 w-3.5 shrink-0" /> {file.name}
            </p>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              disabled={isCreating}
              className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-lagos-600 hover:bg-lagos-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isCreating}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirmCrop()}
            disabled={!naturalSize || isCreating}
            className="flex items-center gap-2 rounded-xl bg-pradera-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pradera-600 disabled:cursor-wait disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isCreating ? 'Preparando...' : 'Usar foto'}
          </button>
        </div>
      </div>
    </div>
  );
}
