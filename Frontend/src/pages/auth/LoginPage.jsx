import React, { useState } from 'react';
import { Shield, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Credenciales no válidas. Ingrese su número celular o usuario registrado.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-crisis-800 border border-crisis-700 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Acceso al Sistema COE
          </h2>
          <p className="text-xs text-slate-400">
            Plataforma de Mando y Respuesta a Emergencias de Esmeraldas
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Número Celular o Usuario
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="ej: 0991234567"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-crisis-900 border border-crisis-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-crisis-900 border border-crisis-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-500 font-bold text-white text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <span>{loading ? 'Validando...' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-crisis-700">
          <p className="text-[11px] text-slate-500">
            ¿Eres ciudadano y necesitas reportar una emergencia? Puedes usar el módulo de reporte comunitario sin iniciar sesión.
          </p>
        </div>
      </div>
    </div>
  );
};
