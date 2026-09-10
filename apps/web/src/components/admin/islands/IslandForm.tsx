'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { PrivateFileUploadField } from '@/components/uploads/PrivateFileUploadField';
import type { AdminIsland, AdminIslandMutationData } from '@/lib/server-api';
import { IslandFormField as Field, islandInputClassName } from './IslandFormField';
import { IslandModelPreview } from './IslandModelPreview';

interface IslandFormProps {
  island?: AdminIsland;
  onSubmit: (data: AdminIslandMutationData) => Promise<void>;
  submitLabel: string;
}

export function IslandForm({ island, onSubmit, submitLabel }: IslandFormProps) {
  const [title, setTitle] = useState(island?.title ?? '');
  const [description, setDescription] = useState(island?.description ?? '');
  const [accent, setAccent] = useState(island?.accent ?? '#58cc02');
  const [order, setOrder] = useState(island?.order ?? 0);
  const [available, setAvailable] = useState(island?.available ?? true);
  const [modelUploadKey, setModelUploadKey] = useState<string>();
  const [localModelUrl, setLocalModelUrl] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (localModelUrl) URL.revokeObjectURL(localModelUrl);
    };
  }, [localModelUrl]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isUploading || isSaving) return;
    setIsSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        accent,
        order,
        available,
        ...(modelUploadKey ? { modelUploadKey } : {}),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:grid-cols-2">
        <Field label="Nombre" className="md:col-span-2">
          <input
            required
            maxLength={255}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={islandInputClassName}
          />
        </Field>
        <Field label="Descripción" className="md:col-span-2">
          <textarea
            required
            maxLength={1000}
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={islandInputClassName}
          />
        </Field>
        <Field label="Color de acento">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(event) => setAccent(event.target.value)}
              className="h-11 w-14 cursor-pointer rounded-xl border border-gray-200 bg-white p-1"
            />
            <input
              required
              pattern="#[0-9a-fA-F]{6}"
              value={accent}
              onChange={(event) => setAccent(event.target.value)}
              className={islandInputClassName}
            />
          </div>
        </Field>
        <Field label="Orden">
          <input
            required
            type="number"
            min={0}
            step={1}
            value={order}
            onChange={(event) => setOrder(Number(event.target.value))}
            className={islandInputClassName}
          />
        </Field>
        <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 md:col-span-2">
          <span>
            <span className="block text-sm font-medium text-gray-700">Disponible</span>
            <span className="block text-xs text-gray-400">
              Permite que estudiantes ingresen a la isla.
            </span>
          </span>
          <input
            type="checkbox"
            checked={available}
            onChange={(event) => setAvailable(event.target.checked)}
            className="h-5 w-5 accent-pradera-500"
          />
        </label>
        <div className="md:col-span-2">
          <PrivateFileUploadField
            assetType="island-model"
            accept=".glb,model/gltf-binary,application/octet-stream"
            label="Modelo 3D (.glb)"
            helpText="GLB de hasta 60 MB. Si no se carga uno, se utilizará el modelo heredado."
            currentFileName={island?.hasCustomModel ? 'modelo-isla.glb' : undefined}
            currentFileUrl={island?.hasCustomModel ? island.modelPath : undefined}
            onUploadKey={setModelUploadKey}
            onUploadStateChange={setIsUploading}
            onFileSelected={(file) => {
              setLocalModelUrl((currentUrl) => {
                if (currentUrl) URL.revokeObjectURL(currentUrl);
                return URL.createObjectURL(file);
              });
            }}
          />
          {(localModelUrl || island?.hasCustomModel) && (
            <IslandModelPreview
              sourceUrl={localModelUrl ?? `/api/island-model/${island!.slug}`}
              fileName={localModelUrl ? 'Modelo seleccionado' : 'Modelo guardado'}
            />
          )}
        </div>
      </div>
      <button
        type="submit"
        disabled={isSaving || isUploading || !title.trim() || !description.trim()}
        className="ml-auto flex items-center gap-2 rounded-xl bg-lagos-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-lagos-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving || isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {isUploading ? 'Subiendo modelo…' : submitLabel}
      </button>
    </form>
  );
}
