'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Zap,
  Gem,
  Trophy,
  TrendingUp,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Flag,
} from '@/components/ui/Icon';
import type { UserProfile } from '@/lib/auth';
import { adminFetch } from '@/lib/admin-api';
import { AvatarUploadField } from '@/components/uploads/AvatarUploadField';
import { useSetCurrentUser } from '@/hooks/queries/useCurrentUser';
import {
  getPlayerBanner,
  playerBanners,
  type PlayerBannerId,
} from '@/components/player-profile/player-banner';

interface ProfileFormProps {
  user: UserProfile;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const setCurrentUser = useSetCurrentUser();

  const [currentUser, setProfileUser] = useState(user);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email ?? '');
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [profileBanner, setProfileBanner] = useState<PlayerBannerId>(
    getPlayerBanner(user.profileBanner).id,
  );
  const [savingBanner, setSavingBanner] = useState<PlayerBannerId | null>(null);
  const [xp, setXp] = useState(user.xp);
  const [gems, setGems] = useState(user.gems);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(
    () => () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    },
    [avatarPreviewUrl],
  );

  const setAvatarPreview = (file: File) => {
    setAvatarPreviewUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return URL.createObjectURL(file);
    });
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const publishUserUpdate = (updatedUser: UserProfile) => {
    setProfileUser(updatedUser);
    setCurrentUser(updatedUser);
    window.dispatchEvent(new CustomEvent<UserProfile>('user-updated', { detail: updatedUser }));
    router.refresh();
  };

  const saveAvatar = async (avatarUploadKey: string) => {
    const response = await adminFetch<{ user: UserProfile }>('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUploadKey }),
    });
    publishUserUpdate(response.user);
    showToast('success', 'Foto de perfil actualizada');
  };

  const deleteAvatar = async () => {
    const response = await adminFetch<{ user: UserProfile }>('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ removeAvatar: true }),
    });
    setAvatarPreviewUrl(null);
    publishUserUpdate(response.user);
    showToast('success', 'Foto de perfil eliminada');
  };

  const saveProfileBanner = async (nextBanner: PlayerBannerId) => {
    if (nextBanner === profileBanner || savingBanner) return;

    const previousBanner = profileBanner;
    setProfileBanner(nextBanner);
    setSavingBanner(nextBanner);
    try {
      const response = await adminFetch<{ user: UserProfile }>('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ profileBanner: nextBanner }),
      });
      publishUserUpdate(response.user);
      showToast('success', 'Estandarte competitivo actualizado');
    } catch (error) {
      setProfileBanner(previousBanner);
      showToast(
        'error',
        error instanceof Error ? error.message : 'No se pudo guardar el estandarte',
      );
    } finally {
      setSavingBanner(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await adminFetch<{ user: UserProfile }>('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim() || null,
          profileBanner,
          ...(user.role === 'TEACHER' ? { xp, gems } : {}),
        }),
      });
      showToast('success', 'Perfil actualizado correctamente');
      publishUserUpdate(response.user);
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {toast && (
        <div
          className={`fixed right-6 top-24 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success' ? 'bg-pradera-50 text-pradera-700' : 'bg-red-50 text-red-700'
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

      <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-lagos-400 to-valle-400 text-3xl font-bold text-white shadow-md">
            {avatarPreviewUrl || currentUser.avatarUrl ? (
              <img
                key={avatarPreviewUrl ?? currentUser.avatarUrl}
                src={avatarPreviewUrl ?? currentUser.avatarUrl!}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              currentUser.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="font-super-pandora text-xl text-gray-900">{currentUser.displayName}</h2>
            <p className="font-simply-olive text-sm text-gray-500">@{currentUser.username}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="font-candy-beans text-sm text-amber-700">
                  {currentUser.xp.toLocaleString()} XP
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-50 px-3 py-1">
                <Gem className="h-4 w-4 text-cyan-500" />
                <span className="font-candy-beans text-sm text-cyan-700">{currentUser.gems}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-bosque-50 px-3 py-1">
                <Trophy className="h-4 w-4 text-bosque-500" />
                <span className="font-candy-beans text-sm text-bosque-700">
                  Nivel {currentUser.level}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-pradera-50 px-3 py-1">
                <TrendingUp className="h-4 w-4 text-pradera-500" />
                <span className="font-candy-beans text-sm text-pradera-700">
                  {currentUser.streak} días
                </span>
              </span>
            </div>
            <Link
              href={`/dashboard/players/${currentUser.id}`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-bosque-200 bg-bosque-50 px-3 py-2 font-super-pandora text-sm text-bosque-700 transition hover:-translate-y-0.5 hover:border-bosque-400"
            >
              <Trophy className="h-4 w-4" />
              Ver mi perfil competitivo
            </Link>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
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

        <AvatarUploadField
          hasCurrentAvatar={Boolean(currentUser.avatarUrl)}
          onUploadKey={saveAvatar}
          onPreviewFile={setAvatarPreview}
          onRemove={deleteAvatar}
        />

        <fieldset>
          <legend className="mb-2 flex items-center gap-1.5 font-simply-olive text-sm font-medium text-gray-700">
            <Flag className="h-4 w-4 text-bosque-500" />
            Estandarte competitivo
          </legend>
          <p className="mb-3 font-simply-olive text-xs text-gray-500">
            Elegí uno para guardarlo y usarlo inmediatamente en tu ficha pública.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {playerBanners.map((banner) => {
              const selected = profileBanner === banner.id;
              return (
                <button
                  key={banner.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={savingBanner !== null}
                  onClick={() => void saveProfileBanner(banner.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-bosque-200 disabled:cursor-wait disabled:opacity-60 ${banner.surfaceClass} ${selected ? `${banner.borderClass} shadow-[0_3px_0_rgba(42,36,96,.35)]` : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <span>
                    <span className="block font-super-pandora text-sm text-white">
                      {banner.name}
                    </span>
                    <span
                      className={`mt-0.5 block font-simply-olive text-xs ${banner.ornamentClass}`}
                    >
                      {banner.description}
                    </span>
                  </span>
                  {selected && <CheckCircle2 className="h-5 w-5 text-white" />}
                </button>
              );
            })}
          </div>
        </fieldset>

        {user.role === 'TEACHER' && (
          <div className="grid gap-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1.5 font-simply-olive text-sm font-medium text-amber-800">
                <Zap className="h-4 w-4" />
                XP
              </label>
              <input
                type="number"
                min={0}
                value={xp}
                onChange={(event) => setXp(Math.max(0, Number(event.target.value) || 0))}
                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 font-simply-olive text-sm font-medium text-cyan-800">
                <Gem className="h-4 w-4" />
                Gemas
              </label>
              <input
                type="number"
                min={0}
                value={gems}
                onChange={(event) => setGems(Math.max(0, Number(event.target.value) || 0))}
                className="w-full rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
            <p className="sm:col-span-2 text-xs text-amber-700">
              Como docente podés ajustar tus estadísticas. Tu nivel se recalcula al guardar el XP.
            </p>
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
