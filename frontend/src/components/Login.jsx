import React, { useState } from 'react';
import { X, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login({ isOpen, onClose, onLoginSuccess, apiBase, isDemo }) {
  if (!isOpen) return null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isDemo) {
      // In Demo Mode (offline backend), mock authentication
      setTimeout(() => {
        if (username === 'admin' && password === '123456') {
          onLoginSuccess('demo-mock-token-12345');
        } else {
          setError('Usuario o contraseña de demostración incorrectos. Pruebe: admin / 123456');
        }
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        onLoginSuccess(data.token);
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div 
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6 relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-gray-400 hover:text-white transition-all active:scale-95"
        >
          <X size={16} />
        </button>

        {/* Branding header */}
        <div className="text-center mt-3 mb-6">
          <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock size={20} />
          </div>
          <h3 className="text-lg font-extrabold text-white">Acceso Administrador</h3>
          <p className="text-xs text-zinc-500 mt-1">Ingresa para configurar la tienda y gestionar productos.</p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 flex items-start gap-2 text-rose-400 text-left text-xs">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Username field */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5 pl-1">
              Usuario
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-600">
                <User size={14} />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: admin"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-pink-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5 pl-1">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-600">
                <Lock size={14} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-pink-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-600 hover:text-zinc-400 active:scale-95 transition-all"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Guidelines */}
          {isDemo && (
            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-2.5 text-[10px] text-yellow-400 leading-normal">
              🔑 <b>Modo Demo Activo</b>: Inicia sesión con el usuario: <span className="font-mono bg-yellow-500/10 px-1 rounded">admin</span> y contraseña: <span className="font-mono bg-yellow-500/10 px-1 rounded">123456</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-2xl text-xs mt-2 shadow-lg flex items-center justify-center"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
