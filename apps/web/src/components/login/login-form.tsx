'use client';

import { useState } from 'react';
import { DynamicCodiMascot } from '@/components/mascot/DynamicCodiMascot';
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from '@/components/ui/Icon';
import { readApiErrorMessage } from '@/lib/api-error';

const LOGIN_ERROR_MESSAGES: Record<number, string> = {
  400: 'Revisá el usuario y la contraseña',
  401: 'Usuario o contraseña incorrectos',
};

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
        setError(
          readApiErrorMessage({
            status: response.status,
            message: payload?.message,
            fallback: 'No pudimos iniciar sesión',
            overrides: LOGIN_ERROR_MESSAGES,
          }),
        );
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-panel-enter w-full max-w-112.5 mx-auto px-4">
      <div className="login-card bg-[#0f0f1a]/85 rounded-3xl border border-white/10 shadow-2xl">
        <div className="login-intro flex flex-col items-center text-center">
          <div className="login-mascot login-mascot-enter relative">
            <DynamicCodiMascot
              animation={error ? 'Codi_Frustrated' : loading ? 'Codi_Idle' : 'Codi_Wave'}
              loopAfter={error ? 'Codi_Crying' : loading ? undefined : 'Codi_Rest'}
              cameraFov={36}
              label={error ? 'Codi acompaña el error de inicio de sesión' : 'Codi saluda'}
              className="h-full w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.3)]"
            />
          </div>
          <h1 className="login-title font-extrabold text-white drop-shadow-sm">¡Bienvenido!</h1>
          <p className="login-subtitle text-white/60 font-medium">
            Iniciá sesión para continuar tu aventura.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-fields" aria-busy={loading}>
          <div>
            <label htmlFor="email" className="login-label block font-semibold text-white/80">
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
                className="login-input w-full pl-10 pr-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#55C703]/50 focus:border-[#55C703]/50 transition-all duration-200"
                required
                aria-required="true"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="login-label block font-semibold text-white/80">
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
                className="login-input w-full pl-10 pr-12 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#55C703]/50 focus:border-[#55C703]/50 transition-all duration-200"
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

          <div className="login-recovery flex items-center justify-between">
            <a
              href="/forgot-password"
              className="text-sm font-semibold text-[#55C703] hover:text-[#6aff00] transition-colors"
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
              className="login-submit group relative w-full overflow-hidden rounded-xl bg-linear-to-r from-[#73CE09] to-[#00d382] text-base font-bold text-white shadow-lg shadow-[#00d382]/30 transition-all duration-300 hover:scale-[1.02] hover:cursor-pointer hover:shadow-xl hover:shadow-[#00d382]/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
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
              <div className="absolute inset-0 bg-linear-to-r from-[#00d335] to-[#00ff9d] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
