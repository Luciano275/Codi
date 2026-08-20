'use client';

import { useState } from 'react';
import { Save, Loader2, X, Search, ChevronDown, ChevronUp, Eye, Edit3, Gem } from 'lucide-react';
import MarkdownRenderer from '@/components/dashboard/MarkdownRenderer';
import { PrivateFileUploadField } from '@/components/uploads/PrivateFileUploadField';

type LessonType = 'THEORY' | 'PRACTICE' | 'CHALLENGE' | 'EXAM';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

interface Course {
  id: string;
  title: string;
  modules: { id: string; title: string }[];
}

interface Problem {
  id: string;
  cmsTaskId: number;
  cmsTaskName: string;
  title: string;
  difficulty: Difficulty;
  xpReward: number;
  gemsReward: number;
}

interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  order: number;
  xpReward: number;
  content: Record<string, unknown>;
  resources?: {
    pdf: { url: string; fileName: string | null } | null;
    video: { url: string; fileName: string | null; contentType: string | null } | null;
  };
  module: { id: string; title: string; course: { id: string; title: string } };
  problems: Problem[];
}

const LESSON_TYPES: { value: LessonType; label: string }[] = [
  { value: 'THEORY', label: 'Teoría' },
  { value: 'PRACTICE', label: 'Práctica' },
  { value: 'CHALLENGE', label: 'Desafío' },
  { value: 'EXAM', label: 'Examen' },
];

const DIFFICULTY_CLASS: Record<string, string> = {
  EASY: 'bg-pradera-100 text-pradera-700',
  MEDIUM: 'bg-desierto-100 text-desierto-700',
  HARD: 'bg-volcan-100 text-volcan-700',
  EXPERT: 'bg-bosque-100 text-bosque-700',
};

interface LessonFormProps {
  lesson?: Lesson | null;
  courses: Course[];
  allProblems: Problem[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  initialCourseId?: string;
  initialModuleId?: string;
  onUpdateProblem?: (problemId: string, updates: Partial<Problem>) => void;
}

export function LessonForm({
  lesson,
  courses,
  allProblems,
  onSave,
  onCancel,
  initialCourseId,
  initialModuleId,
  onUpdateProblem,
}: LessonFormProps) {
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [type, setType] = useState<LessonType>(lesson?.type ?? 'THEORY');
  const [courseId, setCourseId] = useState(lesson?.module.course.id ?? initialCourseId ?? '');
  const [moduleId, setModuleId] = useState(lesson?.module.id ?? initialModuleId ?? '');
  const [order, setOrder] = useState(lesson?.order ?? 1);
  const [xpReward, setXpReward] = useState(lesson?.xpReward ?? 50);
  const [description, setDescription] = useState((lesson?.content?.description as string) ?? '');
  const [pdfUploadKey, setPdfUploadKey] = useState<string | null>(null);
  const [videoUploadKey, setVideoUploadKey] = useState<string | null>(null);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [removePdf, setRemovePdf] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [instructions, setInstructions] = useState((lesson?.content?.instructions as string) ?? '');
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>(
    lesson?.problems.map((p) => p.id) ?? [],
  );
  const [problemSearch, setProblemSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [showProblemPicker, setShowProblemPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [problems, setProblems] = useState(allProblems);

  const filteredCourses = courses.filter((c) => c.modules.length > 0);
  const selectedCourse = courses.find((c) => c.id === courseId);
  const availableModules = selectedCourse?.modules ?? [];

  const filteredProblems = problems.filter(
    (p) =>
      p.title.toLowerCase().includes(problemSearch.toLowerCase()) ||
      p.cmsTaskName.toLowerCase().includes(problemSearch.toLowerCase()),
  );
  const isUploadingAsset = isPdfUploading || isVideoUploading;

  const toggleProblem = (id: string) => {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId || !title.trim() || isUploadingAsset) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        type,
        moduleId,
        order,
        xpReward,
        content: {
          description: description.trim(),
          instructions: instructions.trim(),
        },
        problemIds: selectedProblemIds,
        ...(pdfUploadKey ? { pdfUploadKey } : {}),
        ...(videoUploadKey ? { videoUploadKey } : {}),
        ...(removePdf ? { removePdf: true } : {}),
        ...(removeVideo ? { removeVideo: true } : {}),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none ring-0 transition-colors focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
            placeholder="Nombre de la lección"
          />
        </div>

        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            Tipo
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LessonType)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
          >
            {LESSON_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            Curso
          </label>
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setModuleId('');
            }}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
          >
            <option value="">Seleccionar curso</option>
            {filteredCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            Módulo
          </label>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            required
            disabled={!courseId}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Seleccionar módulo</option>
            {availableModules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            Orden
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
            min={1}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
          />
        </div>

        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-700">
            XP Recompensa
          </label>
          <input
            type="number"
            value={xpReward}
            onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-super-pandora text-sm text-gray-700">Contenido</h4>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="font-simply-olive text-sm font-medium text-gray-600">
              Descripción (Markdown)
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-lagos-600"
            >
              {showPreview ? (
                <>
                  <Edit3 className="h-3.5 w-3.5" /> Editar
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" /> Vista previa
                </>
              )}
            </button>
          </div>
          {showPreview ? (
            <div className="min-h-[100px] rounded-xl border border-gray-200 bg-white px-4 py-3">
              <MarkdownRenderer content={description} />
            </div>
          ) : (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
              placeholder="Escribí el contenido en Markdown..."
            />
          )}
        </div>

        <PrivateFileUploadField
          assetType="lesson-pdf"
          accept="application/pdf"
          label="PDF complementario (opcional)"
          helpText="Solo PDF, hasta 25 MB."
          preview="pdf"
          currentFileName={removePdf ? null : lesson?.resources?.pdf?.fileName}
          onUploadStateChange={setIsPdfUploading}
          onUploadKey={(key) => {
            setPdfUploadKey(key);
            setRemovePdf(false);
          }}
          onRemove={() => {
            setPdfUploadKey(null);
            setRemovePdf(true);
          }}
        />

        <PrivateFileUploadField
          assetType="lesson-video"
          accept="video/mp4,video/webm"
          label="Video ilustrativo (opcional)"
          helpText="MP4 o WebM, hasta 500 MB. Se mostrará antes de la explicación de la lesson."
          currentFileName={removeVideo ? null : lesson?.resources?.video?.fileName}
          onUploadStateChange={setIsVideoUploading}
          onUploadKey={(key) => {
            setVideoUploadKey(key);
            setRemoveVideo(false);
          }}
          onRemove={() => {
            setVideoUploadKey(null);
            setRemoveVideo(true);
          }}
        />

        <div>
          <label className="mb-1 block font-simply-olive text-sm font-medium text-gray-600">
            Instrucciones adicionales (opcional)
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
            placeholder="Instrucciones para el estudiante"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-super-pandora text-sm text-gray-700">
            Ejercicios ({selectedProblemIds.length} seleccionados)
          </h4>
          <button
            type="button"
            onClick={() => setShowProblemPicker(!showProblemPicker)}
            className="flex items-center gap-1 text-sm font-medium text-lagos-600 hover:text-lagos-700"
          >
            {showProblemPicker ? 'Ocultar' : 'Buscar ejercicios'}
            {showProblemPicker ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {selectedProblemIds.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedProblemIds.map((pid) => {
              const p = problems.find((x) => x.id === pid);
              if (!p) return null;
              return (
                <span
                  key={pid}
                  className="inline-flex items-center gap-4 rounded-lg bg-pradera-50 px-2.5 py-2 text-sm font-medium text-pradera-700"
                >
                  <span>
                    #{p.cmsTaskId} <b>{p.title}</b>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleProblem(pid)}
                    className="text-pradera-400 hover:text-pradera-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {showProblemPicker && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-lagos-400"
                placeholder="Buscar ejercicios..."
              />
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filteredProblems.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">Sin resultados</p>
              ) : (
                filteredProblems.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProblemIds.includes(p.id)}
                      onChange={() => toggleProblem(p.id)}
                      className="h-4 w-4 rounded border-gray-300 text-pradera-500 focus:ring-pradera-300"
                    />
                    <span className="flex-1">
                      <span className="font-medium text-gray-800">{p.title}</span>
                      <span className="ml-2 text-xs text-gray-400">#{p.cmsTaskId}</span>
                    </span>
                    <select
                      value={p.difficulty}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        if (onUpdateProblem)
                          onUpdateProblem(p.id, { difficulty: e.target.value as Difficulty });
                      }}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium outline-none cursor-pointer ${DIFFICULTY_CLASS[p.difficulty] || 'bg-gray-100 text-gray-600'}`}
                    >
                      <option value="EASY">Fácil</option>
                      <option value="MEDIUM">Medio</option>
                      <option value="HARD">Difícil</option>
                      <option value="EXPERT">Experto</option>
                    </select>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || isUploadingAsset || !moduleId || !title.trim()}
          className="flex items-center gap-2 rounded-xl bg-pradera-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pradera-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {isUploadingAsset ? 'Subiendo archivo...' : lesson ? 'Guardar cambios' : 'Crear lección'}
        </button>
      </div>
    </form>
  );
}
