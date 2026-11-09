import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Marker, 
  Popup, 
  Tooltip,
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  AlertTriangle, 
  Building2, 
  Home, 
  Layers, 
  RefreshCw,
  Zap,
  Play,
  Pause,
  Map as MapIcon,
  Eye,
  EyeOff
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

// Ícono de Rayo / Tormenta eléctrica como en la imagen de referencia
const lightningIcon = L.divIcon({
  html: `
    <div style="
      background-color: #facc15;
      color: #000;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px #facc15, 0 0 20px rgba(250, 204, 21, 0.6);
      animation: pulse 1.5s infinite;
      font-weight: bold;
      font-size: 14px;
      border: 1.5px solid #ffffff;
    ">
      ⚡
    </div>
  `,
  className: 'custom-lightning-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

export const CrisisRoomPage = () => {
  const [zonasRiesgo, setZonasRiesgo] = useState(null);
  const [redHidrica, setRedHidrica] = useState(null);
  const [infraestructuras, setInfraestructuras] = useState(null);
  const [albergues, setAlbergues] = useState(null);
  const [reportes, setReportes] = useState(null);
  const [clima, setClima] = useState(null);
  const [loading, setLoading] = useState(true);

  // Radar meteorológico (RainViewer & OpenWeatherMap)
  const [radarPath, setRadarPath] = useState(null);
  const [radarHost, setRadarHost] = useState('https://tilecache.rainviewer.com');
  const [radarTimestamp, setRadarTimestamp] = useState('');
  const [radarOpacity, setRadarOpacity] = useState(0.75);

  // Selector de mapa base (OpenStreetMap estándar, Satélite, Topo)
  const [baseMap, setBaseMap] = useState('osm'); // 'osm' | 'sat' | 'topo'

  // Capas conmutables
  const [layers, setLayers] = useState({
    radarClima: true, // Radar de Lluvia y Tormenta estilo imagen 2
    zonasRiesgo: true,
    albergues: true,
    infraestructuras: true,
    redHidrica: true,
    reportes: true,
    tormentas: true, // Celdas de tormenta eléctrica (rayos)
  });

  // Celdas de tormenta de referencia sobre la costa y cuenca de Esmeraldas
  const stormCells = [
    { id: 1, lat: 0.9820, lng: -79.6420, label: 'Lluvia moderada a fuerte - 11:04', desc: 'Precipitación activa sobre desembocadura del Teaone' },
    { id: 2, lat: 0.9410, lng: -79.6830, label: 'Descarga eléctrica aislada', desc: 'Actividad convectiva en sector Las 50 Casas' },
    { id: 3, lat: 0.8950, lng: -79.6200, label: 'Lluvia - moderada', desc: 'Monitoreo de crecida de afluentes' },
    { id: 4, lat: 1.0200, lng: -79.6000, label: 'Frente de tormenta costera', desc: 'Rachas de viento hacia el puerto de Esmeraldas' },
  ];

  const loadRadar = async () => {
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await res.json();
      if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
        const last = data.radar.past[data.radar.past.length - 1];
        setRadarHost(data.host || 'https://tilecache.rainviewer.com');
        setRadarPath(last.path);
        const date = new Date(last.time * 1000);
        setRadarTimestamp(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.warn('Error cargando radar RainViewer:', e);
    }
  };

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
    loadRadar();
    // Actualizar radar cada 5 minutos
    const interval = setInterval(loadRadar, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Estilo dinámico para polígonos de zonas de riesgo
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
    <div className="relative w-full h-full flex flex-col">
      {/* Barra Superior Táctica de Control y Resumen */}
      <div className="bg-crisis-800/95 backdrop-blur border-b border-crisis-700 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            COE • Monitoreo en Vivo
          </span>
          <span className="text-xs text-slate-300 hidden md:inline">
            Cantón Esmeraldas • Radar de Tormentas y Capas Geoespaciales
          </span>
        </div>

        {/* Selector de Mapa Base y Capas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Mapa Base */}
          <div className="flex bg-crisis-900 p-0.5 rounded border border-crisis-700 text-xs">
            <button
              onClick={() => setBaseMap('osm')}
              className={`px-2 py-1 rounded transition text-[11px] font-semibold ${
                baseMap === 'osm' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              OpenStreetMap
            </button>
            <button
              onClick={() => setBaseMap('sat')}
              className={`px-2 py-1 rounded transition text-[11px] font-semibold ${
                baseMap === 'sat' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satelital
            </button>
            <button
              onClick={() => setBaseMap('topo')}
              className={`px-2 py-1 rounded transition text-[11px] font-semibold ${
                baseMap === 'topo' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Topográfico
            </button>
          </div>

          {/* Toggle Radar de Clima / Tormentas */}
          <button
            onClick={() => setLayers(prev => ({ ...prev, radarClima: !prev.radarClima }))}
            className={`text-xs px-2.5 py-1 rounded transition border flex items-center gap-1.5 font-bold ${
              layers.radarClima 
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-sm' 
                : 'bg-crisis-700 text-slate-400 border-slate-600'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            Radar Meteorológico {radarTimestamp && `(${radarTimestamp})`}
          </button>

          {/* Rayos / Tormentas */}
          <button
            onClick={() => setLayers(prev => ({ ...prev, tormentas: !prev.tormentas }))}
            className={`text-xs px-2 py-1 rounded transition border flex items-center gap-1 ${
              layers.tormentas 
                ? 'bg-amber-500/25 text-amber-300 border-amber-500/50' 
                : 'bg-crisis-700 text-slate-400 border-slate-600'
            }`}
          >
            <Zap className="w-3 h-3 text-yellow-400" />
            Tormentas ⚡
          </button>

          {/* Polígonos de Riesgo */}
          <button
            onClick={() => setLayers(prev => ({ ...prev, zonasRiesgo: !prev.zonasRiesgo }))}
            className={`text-xs px-2 py-1 rounded transition border ${
              layers.zonasRiesgo 
                ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                : 'bg-crisis-700 text-slate-400 border-slate-600'
            }`}
          >
            Zonas Riesgo
          </button>

          {/* Albergues */}
          <button
            onClick={() => setLayers(prev => ({ ...prev, albergues: !prev.albergues }))}
            className={`text-xs px-2 py-1 rounded transition border ${
              layers.albergues 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-crisis-700 text-slate-400 border-slate-600'
            }`}
          >
            Albergues
          </button>

          {/* Recargar */}
          <button
            onClick={() => { loadDashboardData(); loadRadar(); }}
            disabled={loading}
            className="p-1.5 text-slate-300 hover:text-white bg-crisis-700 rounded border border-crisis-600"
            title="Recargar datos del COE y radar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div className="flex-1 relative">
        <MapContainer
          center={ESMERALDAS_CENTER}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          {/* 1. Capa Base Seleccionada: OpenStreetMap 100% libre sin API Key */}
          {baseMap === 'osm' && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {baseMap === 'sat' && (
            <TileLayer
              attribution='&copy; Esri, Maxar, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          )}

          {baseMap === 'topo' && (
            <TileLayer
              attribution='&copy; OpenTopoMap contributors'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              maxZoom={17}
            />
          )}

          {/* 2. Capa de Radar de Precipitaciones y Tormentas (Estilo Imagen 2 de Referencia) */}
          {layers.radarClima && radarPath && (
            <TileLayer
              url={`${radarHost}${radarPath}/256/{z}/{x}/{y}/2/1_1.png`}
              opacity={radarOpacity}
              zIndex={500}
            />
          )}

          {/* 3. Indicadores de Celdas de Tormenta Eléctrica (Rayos ⚡ con tooltip interactivo) */}
          {layers.tormentas && stormCells.map((cell) => (
            <Marker
              key={`storm-${cell.id}`}
              position={[cell.lat, cell.lng]}
              icon={lightningIcon}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95} permanent={false}>
                <div className="text-xs font-semibold bg-slate-900 text-white p-1 rounded shadow">
                  <p className="flex items-center gap-1 text-yellow-300">
                    <Zap className="w-3 h-3 text-yellow-400" /> {cell.label}
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">{cell.desc}</p>
                </div>
              </Tooltip>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-400 text-sm flex items-center gap-1">
                    ⚡ {cell.label}
                  </p>
                  <p className="text-slate-300">{cell.desc}</p>
                  <p className="text-[10px] text-slate-400">Coordenadas: {cell.lat.toFixed(4)}, {cell.lng.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* 4. Capa de Polígonos de Riesgo */}
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

          {/* 5. Capa Red Hídrica */}
          {layers.redHidrica && redHidrica && (
            <GeoJSON
              key={`rh-${JSON.stringify(redHidrica)}`}
              data={redHidrica}
              style={{ color: '#0284c7', weight: 3, opacity: 0.8 }}
            />
          )}

          {/* 6. Marcadores de Albergues */}
          {layers.albergues && albergues && albergues.features && albergues.features.map((feature, i) => {
            const coords = feature.geometry.coordinates;
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

          {/* 7. Marcadores de Infraestructuras Esenciales */}
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
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Leyenda Táctica del Radar Meteorológico (Inferior Izquierda) */}
        {layers.radarClima && (
          <div className="absolute bottom-6 left-4 z-[1000] bg-crisis-900/90 backdrop-blur border border-crisis-700 rounded-lg p-2.5 shadow-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-emerald-400" />
                Intensidad de Lluvia y Viento
              </span>
              <span className="text-[10px] text-slate-400">
                Opacidad: {Math.round(radarOpacity * 100)}%
              </span>
            </div>
            
            {/* Barra de Colores del Radar */}
            <div className="flex items-center gap-1 text-[10px] text-slate-300">
              <span className="w-4 h-3 rounded-sm bg-[#38bdf8] inline-block" title="Débil"></span>
              <span>Débil</span>
              <span className="w-4 h-3 rounded-sm bg-[#22c55e] inline-block ml-1" title="Moderada"></span>
              <span>Moderada</span>
              <span className="w-4 h-3 rounded-sm bg-[#eab308] inline-block ml-1" title="Fuerte"></span>
              <span>Fuerte</span>
              <span className="w-4 h-3 rounded-sm bg-[#ef4444] inline-block ml-1" title="Tormenta"></span>
              <span>Tormenta</span>
              <span className="ml-2 font-bold text-yellow-300">⚡ Rayos</span>
            </div>

            {/* Slider de Opacidad */}
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={radarOpacity}
              onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
              className="w-full h-1 bg-crisis-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        )}

        {/* Tarjeta Flotante Meteorológica (OpenWeatherMap) */}
        <div className="absolute top-4 right-4 z-[1000] w-72 bg-crisis-800/95 backdrop-blur border border-crisis-700 rounded-xl p-4 shadow-2xl text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-crisis-700 pb-2">
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Clima en Esmeraldas
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
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
                  {clima.descripcion_clima || 'Cielo con celdas de lluvia'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-crisis-700 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Humedad: {clima.humedad_porcentaje || 84}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Viento: {clima.viento_velocidad_kmh || 14} km/h</span>
                </div>
              </div>

              <div className="p-2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                <CloudRain className="w-4 h-4 shrink-0" />
                <span>Radar activo • Monitoreo de desborde Río Teaone</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-white">27.4°C</span>
                <span className="text-slate-300 text-right text-[11px]">Lluvia ligera a moderada</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-crisis-700 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Humedad: 86%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Viento: 16 km/h SO</span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-300 bg-emerald-500/15 p-2 rounded border border-emerald-500/30">
                🌧️ Celdas de lluvia activas sobre la costa de Esmeraldas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
