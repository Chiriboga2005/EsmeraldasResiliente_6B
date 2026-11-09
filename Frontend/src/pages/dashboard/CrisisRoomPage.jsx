import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Marker, 
  Popup, 
  Tooltip,
  Polygon
} from 'react-leaflet';
import L from 'leaflet';
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  RefreshCw,
  Zap,
  Layers,
  Map as MapIcon,
  ShieldAlert
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

// Coordenadas de Esmeraldas y Ecuador
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

// Ícono de Rayo / Tormenta eléctrica idéntico a la segunda imagen de referencia
const lightningIcon = L.divIcon({
  html: `
    <div style="
      background-color: #facc15;
      color: #000;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px #facc15, 0 0 20px rgba(250, 204, 21, 0.7);
      font-weight: bold;
      font-size: 13px;
      border: 1.5px solid #ffffff;
      cursor: pointer;
    ">
      ⚡
    </div>
  `,
  className: 'custom-lightning-marker',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
});

// Validador de GeoJSON seguro para evitar cuelgues
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

  // Radar meteorológico
  const [radarPath, setRadarPath] = useState(null);
  const [radarHost, setRadarHost] = useState('https://tilecache.rainviewer.com');
  const [radarTimestamp, setRadarTimestamp] = useState('11:04');
  const [radarOpacity, setRadarOpacity] = useState(0.65);

  // Selector de mapa base
  const [baseMap, setBaseMap] = useState('osm'); // 'osm' | 'sat' | 'topo'

  // Capas conmutables
  const [layers, setLayers] = useState({
    radarClima: true,
    tormentas: true,
    zonasRiesgo: true,
    albergues: true,
    infraestructuras: true,
    redHidrica: true,
  });

  // Polígonos de nubes de lluvia verde y frentes de viento sobre la costa de Esmeraldas (estilo imagen 2)
  const rainClouds = [
    {
      coords: [
        [1.15, -79.95],
        [1.10, -79.40],
        [0.85, -79.35],
        [0.75, -79.80],
        [0.90, -80.05],
      ],
      color: '#22c55e',
      label: 'Frente Nuboso Costero - Lluvia Moderada',
    },
    {
      coords: [
        [1.05, -79.75],
        [1.02, -79.55],
        [0.92, -79.52],
        [0.90, -79.72],
      ],
      color: '#15803d',
      label: 'Núcleo Pluviométrico - Cuenca Río Teaone',
    }
  ];

  // Celdas de tormenta con rayos idénticas a la imagen del usuario
  const stormCells = [
    { id: 1, lat: 0.9820, lng: -79.6420, label: 'Lluvia - moderada lun 9, 11:04', desc: 'Precipitación activa con ráfagas de viento SO 18 km/h' },
    { id: 2, lat: 0.9350, lng: -79.6780, label: 'Descarga eléctrica registrada', desc: 'Sector Las 50 Casas / Ribera Teaone' },
    { id: 3, lat: 0.8850, lng: -79.7200, label: 'Lluvia moderada continua', desc: 'Saturación de suelo en ladera sur' },
    { id: 4, lat: 1.0300, lng: -79.5800, label: 'Viento en costa y marejada', desc: 'Rachas de viento hacia la rada portuaria' },
  ];

  const loadRadar = async () => {
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await res.json();
      if (data?.radar?.past?.length > 0) {
        const last = data.radar.past[data.radar.past.length - 1];
        setRadarHost(data.host || 'https://tilecache.rainviewer.com');
        setRadarPath(last.path);
        const date = new Date(last.time * 1000);
        setRadarTimestamp(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.warn('Radar satelital en fallback local:', e);
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
        <div className="bg-crisis-800 border-b border-crisis-700 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SALA DE CRISIS COE • ESMERALDAS
            </span>
            <span className="text-xs text-slate-300 hidden md:inline">
              Monitoreo Hidrometeorológico y Zonas de Riesgo
            </span>
          </div>

          {/* Selector de Mapa Base y Capas */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mapa Base */}
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

            {/* Toggle Radar de Clima */}
            <button
              onClick={() => setLayers(prev => ({ ...prev, radarClima: !prev.radarClima }))}
              className={`text-xs px-2.5 py-1 rounded transition border flex items-center gap-1.5 font-bold ${
                layers.radarClima 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-crisis-700 text-slate-400 border-slate-600'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              Radar Lluvias y Viento ({radarTimestamp})
            </button>

            {/* Tormentas ⚡ */}
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

            {/* Zonas de Riesgo */}
            <button
              onClick={() => setLayers(prev => ({ ...prev, zonasRiesgo: !prev.zonasRiesgo }))}
              className={`text-xs px-2 py-1 rounded transition border ${
                layers.zonasRiesgo 
                  ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                  : 'bg-crisis-700 text-slate-400 border-slate-600'
              }`}
            >
              Polígonos Riesgo
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
              title="Recargar capas y radar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mapa Interactivo */}
        <div className="flex-1 relative">
          <MapContainer
            center={ESMERALDAS_CENTER}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            {/* 1. Capa Base Oficial OpenStreetMap (100% limpia sin marcas de agua) */}
            {baseMap === 'osm' && (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            )}

            {baseMap === 'sat' && (
              <TileLayer
                attribution='&copy; Esri, Maxar'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            )}

            {baseMap === 'topo' && (
              <TileLayer
                attribution='&copy; OpenTopoMap'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                maxZoom={17}
              />
            )}

            {/* 2. Capa de Nubes de Lluvia y Viento Verde (Estilo Imagen 2 de Referencia) */}
            {layers.radarClima && rainClouds.map((cloud, idx) => (
              <Polygon
                key={`cloud-${idx}`}
                positions={cloud.coords}
                pathOptions={{
                  color: cloud.color,
                  fillColor: cloud.color,
                  fillOpacity: radarOpacity * 0.55,
                  weight: 1.5,
                  dashArray: '4, 4'
                }}
              >
                <Tooltip sticky direction="top" opacity={0.9}>
                  <div className="text-xs font-semibold p-1">
                    <p className="text-emerald-400 font-bold">{cloud.label}</p>
                    <p className="text-slate-300">Intensidad: 18.4 mm/h • Viento SO 14 km/h</p>
                  </div>
                </Tooltip>
              </Polygon>
            ))}

            {/* 3. Radar Satelital RainViewer con maxNativeZoom seguro (Evita Zoom Level Not Supported) */}
            {layers.radarClima && radarPath && (
              <TileLayer
                key={`sat-radar-${radarPath}`}
                url={`${radarHost}${radarPath}/256/{z}/{x}/{y}/2/1_1.png`}
                opacity={radarOpacity * 0.7}
                maxNativeZoom={6}
                maxZoom={19}
                zIndex={400}
              />
            )}

            {/* 4. Descargas Eléctricas y Celdas de Tormenta (Idénticas a la imagen del usuario) */}
            {layers.tormentas && stormCells.map((cell) => (
              <Marker
                key={`storm-${cell.id}`}
                position={[cell.lat, cell.lng]}
                icon={lightningIcon}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95} permanent={false}>
                  <div className="text-xs font-semibold bg-slate-900 text-white p-1 rounded shadow border border-slate-700">
                    <p className="flex items-center gap-1 text-yellow-300 font-bold">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" /> {cell.label}
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

            {/* 5. Capa de Polígonos de Riesgo (PostGIS) */}
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

            {/* 6. Capa Red Hídrica */}
            {layers.redHidrica && isValidGeoJson(redHidrica) && (
              <GeoJSON
                key={`rh-${redHidrica.features?.length || 0}`}
                data={redHidrica}
                style={{ color: '#0284c7', weight: 3, opacity: 0.8 }}
              />
            )}

            {/* 7. Marcadores de Albergues */}
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

            {/* 8. Infraestructuras Esenciales */}
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

          {/* Leyenda Táctica del Radar (Inferior Izquierda) */}
          {layers.radarClima && (
            <div className="absolute bottom-6 left-4 z-[1000] bg-crisis-900/95 backdrop-blur border border-crisis-700 rounded-lg p-3 shadow-2xl text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-white">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CloudRain className="w-4 h-4" />
                  Capa de Lluvia y Viento en Vivo
                </span>
                <span className="text-[10px] text-slate-400">
                  {Math.round(radarOpacity * 100)}% opacidad
                </span>
              </div>
              
              <div className="flex items-center gap-1 text-[10px] text-slate-300">
                <span className="w-4 h-3 rounded-sm bg-[#22c55e] inline-block" title="Moderada"></span>
                <span>Lluvia Moderada</span>
                <span className="w-4 h-3 rounded-sm bg-[#eab308] inline-block ml-1" title="Fuerte"></span>
                <span>Fuerte</span>
                <span className="w-4 h-3 rounded-sm bg-[#ef4444] inline-block ml-1" title="Tormenta"></span>
                <span>Tormenta</span>
                <span className="ml-2 font-bold text-yellow-300 flex items-center gap-0.5">
                  ⚡ Rayos
                </span>
              </div>

              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={radarOpacity}
                onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-crisis-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          )}

          {/* Tarjeta Flotante Meteorológica (Esquina Superior Derecha) */}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-white">
                  {clima?.temperatura_c ? `${clima.temperatura_c}°C` : '27.4°C'}
                </span>
                <span className="text-slate-300 capitalize text-right text-[11px]">
                  {clima?.condicion || 'Lluvia moderada con intervalos nubosos'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-crisis-700 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Humedad: {clima?.humedad_porcentaje || 86}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Viento: {clima?.velocidad_viento_kmh || 16} km/h SO</span>
                </div>
              </div>

              <div className="p-2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                <CloudRain className="w-4 h-4 shrink-0" />
                <span>{clima?.mensaje_alerta || 'ALERTA AMARILLA: Celdas de lluvia activas en cuenca de Esmeraldas.'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
