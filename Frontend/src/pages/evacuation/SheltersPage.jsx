import React, { useState, useEffect } from 'react';
import { 
  Home, 
  MapPin, 
  Users, 
  Phone, 
  Navigation, 
  Compass, 
  ShieldCheck, 
  AlertOctagon, 
  RefreshCw 
} from 'lucide-react';
import { evacuationApi } from '../../api/evacuationApi';

export const SheltersPage = () => {
  const [albergues, setAlbergues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearestShelter, setNearestShelter] = useState(null);
  const [locating, setLocating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await evacuationApi.getAlbergues();
      setAlbergues(res.features || []);
    } catch (err) {
      console.error('Error cargando albergues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const findNearest = () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no disponible.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await evacuationApi.getAlbergueCercano(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setNearestShelter(res);
        } catch (err) {
          alert('No se pudo encontrar un albergue cercano.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        alert('Se requiere permiso GPS para calcular la ruta más cercana.');
        setLocating(false);
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Cabecera y Buscador del Más Cercano */}
      <div className="bg-crisis-800 border border-crisis-700 p-5 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Home className="w-6 h-6 text-emerald-400" />
            Red de Albergues Temporales de Esmeraldas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo en tiempo real de capacidad máxima, cupos disponibles y servicios en refugio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={findNearest}
            disabled={locating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow transition"
          >
            <Compass className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            {locating ? 'Calculando...' : 'Buscar Albergue Más Cercano'}
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-300 hover:text-white bg-crisis-700 rounded-lg border border-crisis-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Albergue Más Cercano Destacado */}
      {nearestShelter && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 shadow-xl flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
              Refugio con Cupo Más Próximo
            </span>
            <h3 className="text-lg font-bold text-white mt-2">
              {nearestShelter.nombre}
            </h3>
            <p className="text-xs text-slate-300 mt-1">{nearestShelter.direccion}</p>
            <p className="text-xs font-semibold text-emerald-400 mt-2">
              Cupos Disponibles: {nearestShelter.capacidad_maxima - nearestShelter.ocupacion_actual} personas
            </p>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${nearestShelter.lat || 0.9682},${nearestShelter.lng || -79.6517}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" /> Cómo llegar
          </a>
        </div>
      )}

      {/* Tarjetas de Albergues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {albergues.map((feature, idx) => {
          const p = feature.properties;
          const coords = feature.geometry?.coordinates || [-79.65, 0.96];
          const pct = Math.round((p.ocupacion_actual / (p.capacidad_maxima || 1)) * 100);
          const cuposLibres = p.capacidad_maxima - p.ocupacion_actual;

          return (
            <div
              key={idx}
              className="bg-crisis-800 border border-crisis-700 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-500 transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-white text-sm line-clamp-2">
                    {p.nombre}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      cuposLibres > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {cuposLibres > 0 ? `${cuposLibres} libres` : 'Lleno'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{p.direccion || 'Cantón Esmeraldas'}</span>
                </p>

                {/* Barra de Ocupación */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Ocupación: {p.ocupacion_actual} / {p.capacidad_maxima}</span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Contacto & Acciones */}
              <div className="pt-3 border-t border-crisis-700 flex items-center justify-between text-xs">
                {p.telefono_contacto ? (
                  <a
                    href={`tel:${p.telefono_contacto}`}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-white"
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    <span>{p.telefono_contacto}</span>
                  </a>
                ) : (
                  <span className="text-slate-500">Sin contacto</span>
                )}

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Navigation className="w-3 h-3" /> Ver ruta
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
