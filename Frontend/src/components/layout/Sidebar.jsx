import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  MapPin, 
  AlertTriangle, 
  Home, 
  HeartHandshake, 
  Layers
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    {
      to: '/',
      label: 'Sala de Crisis (COE)',
      icon: Activity,
      badge: 'En Vivo',
    },
    {
      to: '/reportes',
      label: 'Reporte Comunitario',
      icon: AlertTriangle,
      badge: 'Móvil',
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
    <aside className="w-64 bg-crisis-800 border-r border-crisis-700 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
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
                        ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                        : 'text-slate-300 hover:bg-crisis-700/60 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-crisis-700 text-slate-300 border border-slate-600">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Resumen de Datos Activos */}
        <div className="bg-crisis-900/60 p-3 rounded-lg border border-crisis-700 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Base Espacial Activa</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Aiven PostGIS (EPSG:4326) conectado. Polígonos de susceptibilidad y ríos Teaone/Esmeraldas cargados.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-crisis-700 text-center text-[11px] text-slate-500">
        Municipio de Esmeraldas • COE Cantonal
      </div>
    </aside>
  );
};

