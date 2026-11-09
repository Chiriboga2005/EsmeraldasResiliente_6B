import React from 'react';
import { Shield, Wifi, WifiOff, RefreshCw, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();

  return (
    <header className="bg-crisis-800 border-b border-crisis-700 px-4 py-3 flex items-center justify-between shadow-md">
      {/* Brand & Título */}
      <div className="flex items-center space-x-3">
        <div className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/30">
          <Shield className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            ESMERALDAS RESILIENTE
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              6B • COE
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Sistema Integral de Gestión de Riesgos, Clima y Asistencia
          </p>
        </div>
      </div>

      {/* Indicadores de Conexión, Offline Sync y Usuario */}
      <div className="flex items-center space-x-4">
        {/* Conectividad */}
        <div className="flex items-center space-x-2 text-xs">
          {isOnline ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <Wifi className="w-3.5 h-3.5" /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium animate-pulse">
              <WifiOff className="w-3.5 h-3.5" /> Modo Offline
            </span>
          )}

          {pendingCount > 0 && (
            <button
              onClick={syncNow}
              disabled={isSyncing || !isOnline}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium hover:bg-indigo-500/30 transition disabled:opacity-50"
              title="Reportes pendientes por sincronizar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{pendingCount} pendientes</span>
            </button>
          )}
        </div>

        {/* Perfil & Auth */}
        {isAuthenticated ? (
          <div className="flex items-center space-x-3 pl-3 border-l border-crisis-700">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">
                {user?.nombre_completo || user?.first_name || user?.username || user?.telefono || 'Usuario'}
              </p>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                (user?.rol === 'ADMINISTRADOR' || user?.username === 'admin')
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 ring-1 ring-amber-400/40'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
              }`}>
                {user?.rol || (user?.username === 'admin' ? 'ADMINISTRADOR' : 'OPERADOR')}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-crisis-700 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition shadow"
          >
            <User className="w-3.5 h-3.5" /> Ingresar
          </Link>
        )}
      </div>
    </header>
  );
};

