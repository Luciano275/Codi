'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Image,
  Zap,
  Gem,
  Trophy,
  TrendingUp,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { UserProfile } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ProfileFormProps {
  user: UserProfile;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('codi_token');
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error al guardar' }));
        throw new Error(err.message || 'Error al guardar');
      }

      showToast('success', 'Perfil actualizado correctamente');
      router.refresh();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-24 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-pradera-50 text-pradera-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Avatar + Stats */}
      <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-lagos-400 to-valle-400 text-3xl font-bold text-white shadow-md">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              user.displayName.charAt(0).toUpperCase()
            )}
          </div>

          <div className="text-center sm:text-left">
            <h2 className="font-super-pandora text-xl text-gray-900">{user.displayName}</h2>
            <p className="font-simply-olive text-sm text-gray-500">@{user.username}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="font-candy-beans text-sm text-amber-700">
                  {user.xp.toLocaleString()} XP
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-50 px-3 py-1">
                <Gem className="h-4 w-4 text-cyan-500" />
                <span className="font-candy-beans text-sm text-cyan-700">
                  {user.gems}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-bosque-50 px-3 py-1">
                <Trophy className="h-4 w-4 text-bosque-500" />
                <span className="font-candy-beans text-sm text-bosque-700">
                  Nivel {user.level}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-pradera-50 px-3 py-1">
                <TrendingUp className="h-4 w-4 text-pradera-500" />
                <span className="font-candy-beans text-sm text-pradera-700">
                  {user.streak} días
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="font-super-pandora text-base text-gray-800">Editar perfil</h3>

        <div>
          <label className="mb-1 flex items-center gap-1.5 font-simply-olive text-sm font-medium text-gray-700">
            <User className="h-4 w-4 text-gray-400" />
            Nombre visible
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
          />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 font-simply-olive text-sm font-medium text-gray-700">
            <Mail className="h-4 w-4 text-gray-400" />
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
            placeholder="Sin correo"
          />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 font-simply-olive text-sm font-medium text-gray-700">
            <Image className="h-4 w-4 text-gray-400" />
            URL del avatar
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100"
            placeholder="https://ejemplo.com/avatar.png"
          />
        </div>

        {/* Preview */}
        {avatarUrl && (
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
            <span className="font-simply-olive text-xs text-gray-500">Vista previa:</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-lagos-400 to-valle-400 text-sm font-bold text-white">
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-pradera-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pradera-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Guardar cambios
          </button>
        </div>
      </form>
    </>
  );
}
