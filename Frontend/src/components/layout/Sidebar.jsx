import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  MapPin, 
  AlertTriangle, 
  Home, 
  HeartHandshake, 
  Layers,
  ShieldAlert,
  PhoneCall
} from 'lucide-react';
import { EmergencyContactsModal } from '../common/EmergencyContactsModal';

export const Sidebar = () => {
  const [showContactsModal, setShowContactsModal] = useState(false);

  const navItems = [
    {
      to: '/',
      label: 'Sala de Crisis (COE)',
      icon: Activity,
      badge: 'En Vivo',
    },
    {
      to: '/incidentes',
      label: 'Seguimiento Incidentes',
      icon: ShieldAlert,
    },
    {
      to: '/reportes',
      label: 'Reporte Comunitario',
      icon: AlertTriangle,
    },
    {
      to: '/albergues',
      label: 'Albergues y Evacuación',
      icon: Home,
    },
    {
      to: '/humanitaria',
      label: 'Censo y Asistencia',
      icon: HeartHandshake,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-crisis-800 border-r border-slate-200 dark:border-crisis-700 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
            Módulos del Sistema
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 font-bold shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-crisis-700/60 hover:text-slate-950 dark:hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge === 'En Vivo' ? (
                    <span className="relative flex h-2.5 w-2.5 items-center justify-center mr-1" title="Sistema Activo en Tiempo Real">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-sm shadow-emerald-400"></span>
                    </span>
                  ) : item.badge ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-crisis-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Resumen de Datos Activos */}
        <div className="bg-slate-50 dark:bg-crisis-900/60 p-3 rounded-lg border border-slate-200 dark:border-crisis-700 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-300 font-semibold">
            <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Base Espacial Activa</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Aiven PostGIS (EPSG:4326) conectado. Polígonos de susceptibilidad y ríos Teaone/Esmeraldas cargados.
          </p>
        </div>

        {/* Botón Destacado: Contactos de Emergencia (Directorio Rápido) */}
        <div>
          <button
            onClick={() => setShowContactsModal(true)}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-red-600/90 to-rose-700/90 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/20 border border-red-500/30 flex items-center justify-between transition active:scale-95 group"
          >
            <div className="flex items-center gap-2.5">
              <PhoneCall className="w-4 h-4 text-white group-hover:animate-bounce" />
              <span>Contactos de Emergencia</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase">
              COE
            </span>
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-crisis-700 text-center text-[11px] text-slate-500">
        Municipio de Esmeraldas • COE Cantonal
      </div>

      {/* Modal Directorio de Emergencia */}
      <EmergencyContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />
    </aside>
  );
};

