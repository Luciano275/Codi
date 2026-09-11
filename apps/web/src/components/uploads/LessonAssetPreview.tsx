'use client';

import Image from 'next/image';

type LessonAssetPreviewType = 'image' | 'pdf' | 'video';

interface LessonAssetPreviewProps {
  type: LessonAssetPreviewType;
  sourceUrl: string;
  fileName?: string | null;
}

const previewLabels: Record<LessonAssetPreviewType, string> = {
  image: 'Vista previa de la imagen',
  pdf: 'Vista previa del PDF',
  video: 'Vista previa del video',
};

export type { LessonAssetPreviewType };

export function LessonAssetPreview({ type, sourceUrl, fileName }: LessonAssetPreviewProps) {
  const label = previewLabels[type];

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <p className="border-b border-gray-100 px-3 py-2 text-xs font-medium text-gray-500">
        {label}
        {fileName ? `: ${fileName}` : ''}
      </p>
      {type === 'image' ? (
        <Image
          src={sourceUrl}
          alt={fileName ?? 'Imagen de la lección'}
          width={1600}
          height={900}
          sizes="(max-width: 768px) 100vw, 768px"
          className="h-auto w-full bg-gray-50"
        />
      ) : type === 'pdf' ? (
        <iframe
          src={sourceUrl}
          title={label}
          className="h-[32rem] w-full bg-gray-50 sm:h-[38rem]"
        />
      ) : (
        <video
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black"
          src={sourceUrl}
        >
          Tu navegador no puede reproducir este video.
        </video>
      )}
    </div>
  );
}
