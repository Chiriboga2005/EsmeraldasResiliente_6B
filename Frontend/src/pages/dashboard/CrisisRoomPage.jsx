import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Marker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  AlertTriangle, 
  ShieldAlert, 
  Building2, 
  Home, 
  Layers, 
  Filter, 
  RefreshCw 
} from 'lucide-react';
import { gisApi } from '../../api/gisApi';
import { weatherApi } from '../../api/weatherApi';
import { evacuationApi } from '../../api/evacuationApi';
import { reportsApi } from '../../api/reportsApi';

// Arreglo de íconos por defecto de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coordenadas centrales de Esmeraldas
const ESMERALDAS_CENTER = [0.9682, -79.6517];

// Íconos personalizados
const shelterIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const CrisisRoomPage = () => {
  const [zonasRiesgo, setZonasRiesgo] = useState(null);
  const [redHidrica, setRedHidrica] = useState(null);
  const [infraestructuras, setInfraestructuras] = useState(null);
  const [albergues, setAlbergues] = useState(null);
  const [reportes, setReportes] = useState(null);
  const [clima, setClima] = useState(null);
  const [loading, setLoading] = useState(true);

  // Capas conmutables
  const [layers, setLayers] = useState({
    zonasRiesgo: true,
    albergues: true,
    infraestructuras: true,
    redHidrica: true,
    reportes: true,
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [zr, rh, inf, alb, rep, cli] = await Promise.allSettled([
        gisApi.getZonasRiesgo(),
        gisApi.getRedHidricaVial(),
        gisApi.getInfraestructuras(),
        evacuationApi.getAlbergues(),
        reportsApi.getReportes(),
        weatherApi.getClimaActual('Esmeraldas'),
      ]);

      if (zr.status === 'fulfilled') setZonasRiesgo(zr.value);
      if (rh.status === 'fulfilled') setRedHidrica(rh.value);
      if (inf.status === 'fulfilled') setInfraestructuras(inf.value);
      if (alb.status === 'fulfilled') setAlbergues(alb.value);
      if (rep.status === 'fulfilled') setReportes(rep.value);
      if (cli.status === 'fulfilled') setClima(cli.value);
    } catch (err) {
      console.error('Error cargando capas GIS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Estilo dinámico para polígonos de zonas de riesgo
  const getRiskStyle = (feature) => {
    const nivel = feature.properties?.nivel_riesgo || 'MEDIO';
    if (nivel === 'ALTO') {
      return { color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.45 };
    }
    if (nivel === 'MEDIO') {
      return { color: '#f59e0b', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.4 };
    }
    return { color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.35 };
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Barra Superior Táctica de Control y Resumen */}
      <div className="bg-crisis-800/90 backdrop-blur border-b border-crisis-700 px-4 py-2.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Sala de Crisis COE
          </span>
          <span className="text-xs text-slate-300">
            Cantón Esmeraldas • Monitoreo de Inundaciones y Albergues
          </span>
        </div>

        {/* Interruptores de Capas Rápidos */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayers(prev => ({ ...prev, zonasRiesgo: !prev.zonasRiesgo }))}
            className={`text-xs px-2.5 py-1 rounded transition border ${
              layers.zonasRiesgo 
                ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                : 'bg-crisis-700 text-slate-400 border-slate-600'
            }`}
          >
            Polígonos de Riesgo
          </button>
          <button
            onClick={() => setLayers(prev => ({ ...prev, albergues: !prev.albergues }))}
            className={`text-xs px-2.5 py-1 rounded transition border ${
              layers.albergues 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-crisis-700 text-slate-400 border-slate-600'
            }`}
          >
            Albergues
          </button>
          <button
            onClick={() => setLayers(prev => ({ ...prev, infraestructuras: !prev.infraestructuras }))}
            className={`text-xs px-2.5 py-1 rounded transition border ${
              layers.infraestructuras 
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' 
                : 'bg-crisis-700 text-slate-400 border-slate-600'
            }`}
          >
            Hospitales/Bomberos
          </button>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-1 text-slate-300 hover:text-white bg-crisis-700 rounded border border-crisis-600 ml-2"
            title="Recargar datos de Aiven"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div className="flex-1 relative">
        <MapContainer
          center={ESMERALDAS_CENTER}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          {/* Capa Base Cartográfica Oscura Táctica */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Capa de Polígonos de Riesgo */}
          {layers.zonasRiesgo && zonasRiesgo && (
            <GeoJSON
              key={`zr-${JSON.stringify(zonasRiesgo)}`}
              data={zonasRiesgo}
              style={getRiskStyle}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                layer.bindPopup(`
                  <div class="text-xs">
                    <p class="font-bold text-red-400 text-sm">${p.nombre || 'Zona de Riesgo'}</p>
                    <p class="mt-1"><strong>Nivel:</strong> ${p.nivel_riesgo || 'ALTO'}</p>
                    <p><strong>Evento:</strong> ${p.tipo_evento || 'INUNDACION'}</p>
                    <p class="mt-1 text-slate-300">${p.descripcion || ''}</p>
                  </div>
                `);
              }}
            />
          )}

          {/* Capa Red Hídrica */}
          {layers.redHidrica && redHidrica && (
            <GeoJSON
              key={`rh-${JSON.stringify(redHidrica)}`}
              data={redHidrica}
              style={{ color: '#0284c7', weight: 3, opacity: 0.8 }}
            />
          )}

          {/* Marcadores de Albergues */}
          {layers.albergues && albergues && albergues.features && albergues.features.map((feature, i) => {
            const coords = feature.geometry.coordinates; // [lng, lat]
            const p = feature.properties;
            const pct = Math.round((p.ocupacion_actual / (p.capacidad_maxima || 1)) * 100);
            return (
              <Marker
                key={`alb-${i}`}
                position={[coords[1], coords[0]]}
                icon={shelterIcon}
              >
                <Popup>
                  <div className="text-xs space-y-1.5 min-w-[200px]">
                    <div className="flex items-center justify-between font-bold text-emerald-400 text-sm">
                      <span>{p.nombre}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        Albergue
                      </span>
                    </div>
                    <p className="text-slate-300">{p.direccion}</p>
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span>Ocupación: {p.ocupacion_actual} / {p.capacidad_maxima}</span>
                        <span className="font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    {p.contacto_responsable && (
                      <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700">
                        Responsable: {p.contacto_responsable} ({p.telefono_contacto})
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcadores de Infraestructuras Esenciales */}
          {layers.infraestructuras && infraestructuras && infraestructuras.features && infraestructuras.features.map((feature, i) => {
            const coords = feature.geometry.coordinates;
            const p = feature.properties;
            return (
              <Marker
                key={`inf-${i}`}
                position={[coords[1], coords[0]]}
                icon={hospitalIcon}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-sky-400 text-sm">{p.nombre}</p>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                      {p.tipo}
                    </span>
                    <p className="text-slate-300 mt-1">{p.direccion}</p>
                    {p.telefono_contacto && (
                      <p className="text-slate-400">Tel: {p.telefono_contacto}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Tarjeta Flotante Meteorológica (OpenWeatherMap) */}
        <div className="absolute top-4 right-4 z-[1000] w-72 bg-crisis-800/95 backdrop-blur border border-crisis-700 rounded-xl p-4 shadow-2xl text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-crisis-700 pb-2">
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Clima en Esmeraldas
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
              En Vivo
            </span>
          </div>

          {clima ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-white">
                  {clima.temperatura_actual ? `${clima.temperatura_actual}°C` : '27°C'}
                </span>
                <span className="text-slate-300 capitalize text-right text-[11px]">
                  {clima.descripcion_clima || 'Cielo parcialmente nublado'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-crisis-700 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Humedad: {clima.humedad_porcentaje || 82}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-400" />
                  <span>Viento: {clima.viento_velocidad_kmh || 12} km/h</span>
                </div>
              </div>

              {clima.lluvia_acumulada_1h_mm > 0 ? (
                <div className="p-2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Precipitación detectada: {clima.lluvia_acumulada_1h_mm} mm/h</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Sin alerta inmediata de precipitaciones torrenciales en el Teaone.
                </p>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-2">
              Cargando servicio meteorológico...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
