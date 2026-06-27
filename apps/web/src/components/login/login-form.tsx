'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  return (
    <motion.div
      className="w-full max-w-112.5 mx-auto px-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="bg-[#0f0f1a]/85 rounded-3xl border border-white/10 shadow-2xl p-8 md:p-10">
        <div className="flex flex-col items-center text-center mb-7">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Image
              src="/logo.png"
              alt="Codi"
              width={200}
              height={200}
              className="w-full max-w-50 h-auto mb-4 drop-shadow-lg"
            />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-sm">
            ¡Bienvenido!
          </h1>
          <p className="text-white/60 mt-1.5 text-sm md:text-base font-medium">
            Iniciá sesión para continuar tu aventura.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-white/80 mb-1.5">
              Correo electrónico o usuario
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40" aria-hidden="true" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@codi.com"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#00D2D3]/50 focus:border-[#00D2D3]/50 transition-all duration-200"
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
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#00D2D3]/50 focus:border-[#00D2D3]/50 transition-all duration-200"
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
                {showPassword ? <EyeOff className="w-4.5 h-4.5" aria-hidden="true" /> : <Eye className="w-4.5 h-4.5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="remember" className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="w-4 h-4 rounded border-white/30 bg-white/10 text-[#00D2D3] focus:ring-[#00D2D3]/40 cursor-pointer accent-[#00D2D3]"
              />
              <span className="text-sm text-white/70 font-medium">Recordarme</span>
            </label>
            <a href="/forgot-password" className="text-sm font-semibold text-[#00D2D3] hover:text-[#00E8E9] transition-colors">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div aria-live="polite" aria-atomic="true">
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white font-bold text-base rounded-xl bg-linear-to-r from-[#00A3FF] to-[#00D2D3] shadow-lg shadow-[#00D2D3]/30 hover:shadow-xl hover:shadow-[#00D2D3]/40 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span className="sr-only">Iniciando sesión...</span>
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-[#00D2D3] to-[#00A3FF] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white/60">
            ¿No tenés cuenta?{' '}
            <a href="/register" className="font-bold text-[#00D2D3] hover:text-[#00E8E9] transition-colors">
              Crear cuenta
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
