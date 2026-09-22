'use client';

import { useState } from 'react';
import { DynamicCodiMascot } from '@/components/mascot/DynamicCodiMascot';
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from '@/components/ui/Icon';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: unknown } | null;
        throw new Error(
          typeof payload?.message === 'string' ? payload.message : `HTTP ${response.status}`,
        );
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message === 'Unauthorized'
            ? 'Usuario o contraseña incorrectos'
            : err.message
          : 'Error de conexión con el servidor',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-panel-enter mx-auto w-full max-w-130">
      <div className="rounded-[2.25rem] border border-white/15 bg-[#101522]/92 px-6 py-7 shadow-[0_30px_90px_rgba(12,53,43,0.3)] backdrop-blur-xl sm:px-10 sm:py-9">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="login-mascot-enter relative -mt-3 mb-1 h-40 w-58 sm:h-44 sm:w-68">
            <DynamicCodiMascot
              animation={error ? 'Codi_Frustrated' : loading ? 'Codi_Idle' : 'Codi_Wave'}
              loopAfter={error ? 'Codi_Crying' : loading ? undefined : 'Codi_Rest'}
              label={error ? 'Codi acompaña el error de inicio de sesión' : 'Codi saluda'}
              className="h-full w-full -translate-x-4 drop-shadow-[0_14px_22px_rgba(0,0,0,0.32)] sm:-translate-x-5"
            />
          </div>
          <h1 className="font-super-pandora text-3xl font-bold text-white drop-shadow-sm sm:text-4xl">
            ¡Bienvenido!
          </h1>
          <p className="mt-2 text-sm font-medium text-white/65 sm:text-base">
            Iniciá sesión para continuar tu aventura.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-white/80 mb-1.5">
              Nombre de Usuario
            </label>
            <div className="relative">
              <User
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40"
                aria-hidden="true"
              />
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu_usuario"
                style={{
                  outline: 'none',
                }}
                className="w-full rounded-2xl border border-white/15 bg-white/8 py-3.5 pr-4 pl-10 text-sm text-white placeholder:text-white/30 transition-all duration-200 focus:border-[#72e5a2]/70 focus:ring-2 focus:ring-[#72e5a2]/35 focus:outline-none"
                required
                aria-required="true"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-white/80 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40"
                aria-hidden="true"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  outline: 'none',
                }}
                className="w-full rounded-2xl border border-white/15 bg-white/8 py-3.5 pr-12 pl-10 text-sm text-white placeholder:text-white/30 transition-all duration-200 focus:border-[#72e5a2]/70 focus:ring-2 focus:ring-[#72e5a2]/35 focus:outline-none"
                required
                aria-required="true"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4.5 h-4.5" aria-hidden="true" />
                ) : (
                  <Eye className="w-4.5 h-4.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <a
              href="/forgot-password"
              className="text-sm font-semibold text-[#72e5a2] transition-colors hover:text-[#a2f5c3]"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-3 text-sm text-red-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div aria-live="polite" aria-atomic="true">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-linear-to-r from-[#57d98d] to-[#28cda0] py-3.5 text-base font-bold text-[#10251f] shadow-lg shadow-[#42d797]/20 transition-[transform,box-shadow] duration-300 hover:scale-[1.015] hover:cursor-pointer hover:shadow-xl hover:shadow-[#42d797]/30 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-[#7ae9a8] to-[#4ee6bc] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
