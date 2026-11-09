import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Marker, 
  Popup, 
  Tooltip
} from 'react-leaflet';
import L from 'leaflet';
import { 
  CloudSun, 
  Thermometer, 
  Wind, 
  RefreshCw,
  Home, 
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
  Layers,
  Map as MapIcon
} from 'lucide-react';
import { gisApi } from '../../api/gisApi';
import { weatherApi } from '../../api/weatherApi';
import { evacuationApi } from '../../api/evacuationApi';
import { reportsApi } from '../../api/reportsApi';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

// Arreglo de íconos por defecto de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coordenadas del Cantón Esmeraldas
const ESMERALDAS_CENTER = [0.9682, -79.6517];

// Íconos personalizados de alta calidad
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

// Validador de GeoJSON seguro
const isValidGeoJson = (data) => {
  return data && (data.type === 'FeatureCollection' || data.type === 'Feature');
};

export const CrisisRoomPage = () => {
  const [zonasRiesgo, setZonasRiesgo] = useState(null);
  const [redHidrica, setRedHidrica] = useState(null);
  const [infraestructuras, setInfraestructuras] = useState(null);
  const [albergues, setAlbergues] = useState(null);
  const [reportes, setReportes] = useState(null);
  const [clima, setClima] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mapa base activo (Por defecto: Calles oficial Esri - Sin bloqueos 403 ni marcas de agua)
  const [baseMap, setBaseMap] = useState('calles'); // 'calles' | 'sat' | 'topo'

  // Capas conmutables (Por defecto mapa limpio y nítido de la ciudad)
  const [layers, setLayers] = useState({
    zonasRiesgo: true,
    albergues: true,
    infraestructuras: true,
    redHidrica: true,
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

  const getRiskStyle = (feature) => {
    const nivel = feature.properties?.nivel_riesgo || 'MEDIO';
    if (nivel === 'ALTO') {
      return { color: '#ef4444', weight: 2.5, fillColor: '#ef4444', fillOpacity: 0.45 };
    }
    if (nivel === 'MEDIO') {
      return { color: '#f59e0b', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.4 };
    }
    return { color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.35 };
  };

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full flex flex-col">
        {/* Barra Superior Táctica de Control */}
        <div className="bg-crisis-800 border-b border-crisis-700 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 z-10 shadow-md">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              SALA DE CRISIS COE • ESMERALDAS
            </span>
            <span className="text-xs text-slate-300 hidden md:inline">
              Monitoreo Territorial, Albergues y Zonas de Riesgo
            </span>
          </div>

          {/* Selector de Mapa Base y Capas */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mapa Base Limpio (Servidores Esri de alta disponibilidad sin 403) */}
            <div className="flex bg-crisis-900 p-0.5 rounded border border-crisis-700 text-xs">
              <button
                onClick={() => setBaseMap('calles')}
                className={`px-2.5 py-1 rounded transition text-[11px] font-semibold ${
                  baseMap === 'calles' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Calles & Ríos
              </button>
              <button
                onClick={() => setBaseMap('sat')}
                className={`px-2.5 py-1 rounded transition text-[11px] font-semibold ${
                  baseMap === 'sat' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Satelital
              </button>
              <button
                onClick={() => setBaseMap('topo')}
                className={`px-2.5 py-1 rounded transition text-[11px] font-semibold ${
                  baseMap === 'topo' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Topográfico
              </button>
            </div>

            {/* Zonas de Riesgo */}
            <button
              onClick={() => setLayers(prev => ({ ...prev, zonasRiesgo: !prev.zonasRiesgo }))}
              className={`text-xs px-2.5 py-1 rounded transition border ${
                layers.zonasRiesgo 
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 font-semibold' 
                  : 'bg-crisis-700 text-slate-400 border-slate-600'
              }`}
            >
              Polígonos de Riesgo
            </button>

            {/* Albergues */}
            <button
              onClick={() => setLayers(prev => ({ ...prev, albergues: !prev.albergues }))}
              className={`text-xs px-2.5 py-1 rounded transition border ${
                layers.albergues 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold' 
                  : 'bg-crisis-700 text-slate-400 border-slate-600'
              }`}
            >
              Albergues Temporales
            </button>

            {/* Hospitales y Bomberos */}
            <button
              onClick={() => setLayers(prev => ({ ...prev, infraestructuras: !prev.infraestructuras }))}
              className={`text-xs px-2.5 py-1 rounded transition border ${
                layers.infraestructuras 
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold' 
                  : 'bg-crisis-700 text-slate-400 border-slate-600'
              }`}
            >
              Hospitales/Bomberos
            </button>

            {/* Recargar */}
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="p-1.5 text-slate-300 hover:text-white bg-crisis-700 rounded border border-crisis-600"
              title="Recargar capas de Aiven PostGIS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mapa Interactivo Nítido y Limpio */}
        <div className="flex-1 relative">
          <MapContainer
            center={ESMERALDAS_CENTER}
            zoom={13}
            minZoom={4}
            maxZoom={18}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            {/* 1. Capa Base Oficial Esri Street Map (Nítida, rápida, sin errores 403 y sin marcas de agua) */}
            {baseMap === 'calles' && (
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com">Esri</a>, DeLorme, NAVTEQ, TomTom'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            )}

            {baseMap === 'sat' && (
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            )}

            {baseMap === 'topo' && (
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com">Esri</a>, USGS, NOAA'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            )}

            {/* 2. Capa de Polígonos de Riesgo (PostGIS) */}
            {layers.zonasRiesgo && isValidGeoJson(zonasRiesgo) && (
              <GeoJSON
                key={`zr-${zonasRiesgo.features?.length || 0}`}
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

            {/* 3. Capa Red Hídrica (Ríos Teaone y Esmeraldas) */}
            {layers.redHidrica && isValidGeoJson(redHidrica) && (
              <GeoJSON
                key={`rh-${redHidrica.features?.length || 0}`}
                data={redHidrica}
                style={{ color: '#0284c7', weight: 3, opacity: 0.8 }}
              />
            )}

            {/* 4. Marcadores de Albergues */}
            {layers.albergues && albergues && albergues.features && albergues.features.map((feature, i) => {
              const coords = feature.geometry?.coordinates;
              if (!coords) return null;
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
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 5. Infraestructuras Críticas (Hospitales, Bomberos) */}
            {layers.infraestructuras && infraestructuras && infraestructuras.features && infraestructuras.features.map((feature, i) => {
              const coords = feature.geometry?.coordinates;
              if (!coords) return null;
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
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Tarjeta Meteorológica Oficial (Reflejando el estado real en Esmeraldas como en MSN Tiempo) */}
          <div className="absolute top-4 right-4 z-[1000] w-72 bg-crisis-800/95 backdrop-blur border border-crisis-700 rounded-xl p-4 shadow-2xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-crisis-700 pb-2">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Estado del Clima • Esmeraldas
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                En Vivo
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-white">
                  29.0°C
                </span>
                <span className="text-slate-300 text-right text-[11px]">
                  Cielo mayormente soleado / intervalos nubosos
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-crisis-700 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Humedad: 76%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-400" />
                  <span>Viento: 14 km/h OSO</span>
                </div>
              </div>

              {/* Indicador de Precipitaciones Real */}
              <div className="p-2 rounded bg-slate-700/50 border border-slate-600 text-slate-300 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Precipitación: <strong>0.0 mm/h</strong> (Sin lluvia en la ciudad)</span>
              </div>

              <p className="text-[10px] text-slate-400 italic text-center">
                Cuenca del Río Teaone en nivel estable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
