import React, { useState, useEffect } from 'react';
import { Shield, Lock, Phone, ArrowRight, AlertCircle, Key, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { login, loginWithKeycloakToken } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Detección automática del Token OIDC retornado por Keycloak (OAuth2 Implicit / Token Flow)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      try {
        const params = new URLSearchParams(hash.replace('#', ''));
        const kcToken = params.get('access_token');
        if (kcToken) {
          // Decodificar payload RS256 de Keycloak
          const base64Url = kcToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);

          const roles = (payload.realm_access?.roles || []).map((r) => r.toUpperCase());
          let rol = 'INVITADO';
          if (roles.includes('ADMINISTRADOR') || roles.includes('ADMIN') || roles.includes('GESTOR')) {
            rol = 'GESTOR';
          } else if (roles.includes('OPERADOR')) {
            rol = 'OPERADOR';
          } else if (roles.includes('DIGITALIZADOR')) {
            rol = 'DIGITALIZADOR';
          }

          const kcUser = {
            id: payload.sub,
            username: payload.preferred_username || payload.email,
            nombre_completo: payload.name || payload.preferred_username || 'Usuario Keycloak',
            email: payload.email,
            rol: rol,
            is_staff: rol === 'GESTOR' || rol === 'OPERADOR',
          };

          loginWithKeycloakToken(kcToken, kcUser);
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/');
        }
      } catch (e) {
        console.error('Error decodificando token Keycloak:', e);
        setError('Error al procesar la sesión de Keycloak.');
      }
    }
  }, [navigate, loginWithKeycloakToken]);

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

  const handleKeycloakLogin = () => {
    const kcBaseUrl = 'https://innocent-arrivals-sec-penetration.trycloudflare.com';
    const realm = 'esmeraldas-resiliente';
    const clientId = 'frontend-web';
    const redirectUri = window.location.origin + '/login';
    const authUrl = `${kcBaseUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&response_type=token&scope=openid%20profile%20email&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-md w-full bg-crisis-800 border border-crisis-700 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
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
                placeholder="ej: 0991234567 o Antonella123@gmail.com"
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

        {/* Separador OIDC */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-crisis-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-crisis-800 px-3 text-slate-400 font-medium">O autentícate mediante</span>
          </div>
        </div>

        {/* Botón Acceso Centralizado con Keycloak IAM */}
        <button
          type="button"
          onClick={handleKeycloakLogin}
          className="w-full py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-950 border border-sky-500/40 hover:border-sky-400 text-sky-400 hover:text-sky-300 text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-md group"
        >
          <Key className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />
          <span>Ingresar con Keycloak IAM (Single Sign-On)</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
        </button>

        <div className="text-center pt-2 border-t border-crisis-700">
          <p className="text-[11px] text-slate-500">
            ¿Eres ciudadano y necesitas reportar una emergencia? Puedes usar el módulo de reporte comunitario sin iniciar sesión.
          </p>
        </div>
      </div>
    </div>
  );
};

