import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Marker, 
  Popup, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Cloud, 
  Zap, 
  Play, 
  Pause, 
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Compass,
  MapPin,
  Sun,
  Layers,
  Sparkles
} from 'lucide-react';
import { gisApi } from '../../api/gisApi';
import { weatherApi } from '../../api/weatherApi';
import { evacuationApi } from '../../api/evacuationApi';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

// Fix de íconos predeterminados de Leaflet en Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coordenadas centrales de Esmeraldas
const ESMERALDAS_CENTER = [0.9682, -79.6517];

// Catálogo de Cantones de la Provincia de Esmeraldas
const CANTONES = [
  { id: 'esmeraldas', nombre: 'Esmeraldas (Capital)', shortName: 'Esmeraldas', lat: 0.9681, lon: -79.6582 },
  { id: 'quininde', nombre: 'Quinindé (Rosa Zárate)', shortName: 'Quinindé', lat: 0.3283, lon: -79.4678 },
  { id: 'atacames', nombre: 'Atacames', shortName: 'Atacames', lat: 0.8667, lon: -79.8444 },
  { id: 'san_lorenzo', nombre: 'San Lorenzo', shortName: 'San Lorenzo', lat: 1.2869, lon: -78.8358 },
  { id: 'muisne', nombre: 'Muisne', shortName: 'Muisne', lat: 0.6106, lon: -80.0197 },
  { id: 'rioverde', nombre: 'Rioverde', shortName: 'Rioverde', lat: 1.0744, lon: -79.4000 },
  { id: 'eloy_alfaro', nombre: 'Eloy Alfaro (Borbón)', shortName: 'Eloy Alfaro', lat: 1.2464, lon: -78.9839 },
];

// Íconos personalizados para albergues y centros hospitalarios
const shelterIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [24, 38],
  iconAnchor: [12, 38],
  popupAnchor: [1, -32],
  shadowSize: [38, 38]
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [24, 38],
  iconAnchor: [12, 38],
  popupAnchor: [1, -32],
  shadowSize: [38, 38]
});

// Pin dinámico para cantones
const createCantonPin = (nombre, isSelected) => L.divIcon({
  html: `
    <div style="
      background-color: ${isSelected ? '#0284c7' : 'rgba(15, 23, 42, 0.88)'};
      color: #ffffff;
      padding: 3px 9px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 11px;
      border: 1.5px solid ${isSelected ? '#38bdf8' : '#475569'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.45);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      cursor: pointer;
      backdrop-filter: blur(4px);
    ">
      <span style="
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background-color: ${isSelected ? '#38bdf8' : '#10b981'};
        display: inline-block;
        box-shadow: 0 0 6px ${isSelected ? '#38bdf8' : '#10b981'};
      "></span>
      ${nombre}
    </div>
  `,
  className: 'custom-canton-pin',
  iconSize: [85, 26],
  iconAnchor: [42, 13],
});

const isValidGeoJson = (data) => {
  return data && (data.type === 'FeatureCollection' || data.type === 'Feature');
};

// Componente para detectar movimiento del mapa y volar a cantones
function MapController({ onCenterChange, targetFly }) {
  const map = useMap();

  useEffect(() => {
    if (targetFly) {
      map.flyTo([targetFly.lat, targetFly.lon], targetFly.zoom || 13, {
        duration: 1.2,
      });
    }
  }, [targetFly, map]);

  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    },
  });

  return null;
}

// Ícono dinámico según la condición meteorológica
const WeatherIcon = ({ condition = '', className = 'w-5 h-5' }) => {
  const c = condition.toLowerCase();
  if (c.includes('tormenta') || c.includes('rayo') || c.includes('eléctric')) return <Zap className={`${className} text-amber-400`} />;
  if (c.includes('lluv') || c.includes('chubasco') || c.includes('llovizna')) return <Droplets className={`${className} text-sky-400`} />;
  if (c.includes('nub') || c.includes('cubierto')) return <Cloud className={`${className} text-slate-300`} />;
  if (c.includes('viento')) return <Wind className={`${className} text-emerald-400`} />;
  return <Sun className={`${className} text-amber-400`} />;
};

export const CrisisRoomPage = () => {
  const [zonasRiesgo, setZonasRiesgo] = useState(null);
  const [redHidrica, setRedHidrica] = useState(null);
  const [infraestructuras, setInfraestructuras] = useState(null);
  const [albergues, setAlbergues] = useState(null);
  
  // Cantón activo seleccionado o detectado
  const [activeCanton, setActiveCanton] = useState(CANTONES[0]);
  const [targetFly, setTargetFly] = useState(null);

  // Clima en vivo del cantón activo
  const [clima, setClima] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [lastAutoDetected, setLastAutoDetected] = useState(null);

  // Modo meteorológico activo (Estilo MSN El Tiempo)
  // 'temp': Temperatura | 'rain': Precipitaciones | 'wind': Viento | 'clouds': Nubosidad | 'storm': Tormentas
  const [weatherMode, setWeatherMode] = useState('temp');

  // Mapa base: 'carto' (Voyager ultra-rápido) | 'calles' (Esri AWS) | 'osm' (Francia) | 'sat' (Esri Satélite)
  const [baseMap, setBaseMap] = useState('carto');

  // Capas territoriales conmutables
  const [layers, setLayers] = useState({
    zonasRiesgo: true,
    albergues: true,
    infraestructuras: true,
    redHidrica: true,
  });

  // Línea de tiempo interactiva (MSN El Tiempo Timeline)
  const [timelineIndex, setTimelineIndex] = useState(11);
  const [isPlaying, setIsPlaying] = useState(false);

  // Carga de clima según cantón
  const fetchWeatherForCanton = useCallback(async (cantonObj) => {
    setLoadingWeather(true);
    try {
      const data = await weatherApi.getClimaActual(cantonObj.id);
      setClima(data);
      if (data?.prevision_horaria?.length > 0) {
        const nowHour = new Date().getHours();
        const foundIdx = data.prevision_horaria.findIndex(
          (p) => parseInt(p.hora) === nowHour
        );
        if (foundIdx !== -1) setTimelineIndex(foundIdx);
      }
    } catch (err) {
      console.error('Error cargando clima de', cantonObj.nombre, err);
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  // Carga inicial de capas territoriales y clima
  const loadInitialData = async () => {
    try {
      const [zr, rh, inf, alb] = await Promise.allSettled([
        gisApi.getZonasRiesgo(),
        gisApi.getRedHidricaVial(),
        gisApi.getInfraestructuras(),
        evacuationApi.getAlbergues(),
      ]);

      if (zr.status === 'fulfilled') setZonasRiesgo(zr.value);
      if (rh.status === 'fulfilled') setRedHidrica(rh.value);
      if (inf.status === 'fulfilled') setInfraestructuras(inf.value);
      if (alb.status === 'fulfilled') setAlbergues(alb.value);

      // Cargar clima de Esmeraldas inicial
      await fetchWeatherForCanton(CANTONES[0]);
    } catch (err) {
      console.error('Error cargando datos del COE:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [fetchWeatherForCanton]);

  // Detector automático de cantón al mover o hacer zoom en el mapa
  const handleMapCenterChanged = useCallback((lat, lon) => {
    let closest = CANTONES[0];
    let minDistance = Infinity;

    for (const c of CANTONES) {
      const dist = Math.hypot(lat - c.lat, lon - c.lon);
      if (dist < minDistance) {
        minDistance = dist;
        closest = c;
      }
    }

    // Si el usuario movió el visor cerca del nuevo cantón y es diferente al actual
    if (closest.id !== activeCanton.id) {
      setActiveCanton(closest);
      setLastAutoDetected(closest.shortName);
      fetchWeatherForCanton(closest);
    }
  }, [activeCanton, fetchWeatherForCanton]);

  // Selección manual de cantón (desde los chips inferiores o clic en pin)
  const handleSelectCanton = (cantonObj) => {
    setActiveCanton(cantonObj);
    setTargetFly({ lat: cantonObj.lat, lon: cantonObj.lon, zoom: 13, ts: Date.now() });
    fetchWeatherForCanton(cantonObj);
  };

  // Animación del reproductor de línea de tiempo horaria
  useEffect(() => {
    let timer;
    if (isPlaying && clima?.prevision_horaria?.length > 0) {
      timer = setInterval(() => {
        setTimelineIndex((prev) => (prev + 1) % clima.prevision_horaria.length);
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [isPlaying, clima]);

  // Punto horario activo
  const currentHourlyPoint = clima?.prevision_horaria?.[timelineIndex] || {
    hora: '11:00',
    temp: clima?.temperatura_c || 29.5,
    lluvia: clima?.precipitacion_1h_mm || 0.0,
  };

  const getRiskStyle = (feature) => {
    const nivel = feature.properties?.nivel_riesgo || 'MEDIO';
    if (nivel === 'ALTO') return { color: '#ef4444', weight: 2.5, fillColor: '#ef4444', fillOpacity: 0.45 };
    if (nivel === 'MEDIO') return { color: '#f59e0b', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.4 };
    return { color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.35 };
  };

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full flex flex-col bg-slate-900 overflow-hidden">
        
        {/* ========================================================================= */}
        {/* BARRA SUPERIOR: SELECTOR DE CAPAS METEOROLÓGICAS & MAPA BASE */}
        {/* ========================================================================= */}
        <div className="bg-crisis-800/95 backdrop-blur-md border-b border-crisis-700 px-3 md:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 z-10 shadow-lg">
          
          {/* Título & Badge de Monitoreo */}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SALA DE CRISIS COE • RADAR EN VIVO
            </span>
            <span className="text-[11px] text-slate-300 hidden lg:inline font-medium">
              Provincia de Esmeraldas • Open-Meteo & OpenWeatherMap
            </span>
          </div>

          {/* BARRA DE MODOS METEOROLÓGICOS (ESTILO MSN EL TIEMPO) */}
          <div className="flex items-center bg-crisis-900/90 p-1 rounded-xl border border-crisis-700/80 shadow-inner gap-1">
            <button
              onClick={() => setWeatherMode('temp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'temp'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-300'
                  : 'text-slate-300 hover:text-white hover:bg-crisis-800'
              }`}
              title="Capa de Temperatura"
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temperatura</span>
            </button>

            <button
              onClick={() => setWeatherMode('rain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'rain'
                  ? 'bg-sky-500 text-white shadow-md ring-1 ring-sky-300'
                  : 'text-slate-300 hover:text-white hover:bg-crisis-800'
              }`}
              title="Capa de Precipitaciones y Lluvias"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Precipitaciones</span>
            </button>

            <button
              onClick={() => setWeatherMode('wind')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'wind'
                  ? 'bg-emerald-500 text-slate-950 shadow-md ring-1 ring-emerald-300'
                  : 'text-slate-300 hover:text-white hover:bg-crisis-800'
              }`}
              title="Velocidad y Dirección del Viento"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Viento</span>
            </button>

            <button
              onClick={() => setWeatherMode('clouds')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'clouds'
                  ? 'bg-indigo-500 text-white shadow-md ring-1 ring-indigo-300'
                  : 'text-slate-300 hover:text-white hover:bg-crisis-800'
              }`}
              title="Nubosidad Satelital"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Nubosidad</span>
            </button>

            <button
              onClick={() => setWeatherMode('storm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'storm'
                  ? 'bg-red-500 text-white shadow-md ring-1 ring-red-300'
                  : 'text-slate-300 hover:text-white hover:bg-crisis-800'
              }`}
              title="Alerta de Tormentas y Desborde de Cuencas"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tormentas & Riesgo</span>
            </button>
          </div>

          {/* Selector de Mapa Base Ultra-Rápido */}
          <div className="flex items-center gap-2">
            <div className="flex bg-crisis-900/90 p-0.5 rounded-xl border border-crisis-700/80 text-xs">
              <button
                onClick={() => setBaseMap('carto')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                  baseMap === 'carto' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Carto Voyager: Servidor CDN ultra-rápido sin demoras de zoom"
              >
                Rápido CDN
              </button>
              <button
                onClick={() => setBaseMap('calles')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                  baseMap === 'calles' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Esri World Street Map"
              >
                Calles Esri
              </button>
              <button
                onClick={() => setBaseMap('osm')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                  baseMap === 'osm' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="OpenStreetMap Mirror Oficial"
              >
                OSM
              </button>
              <button
                onClick={() => setBaseMap('sat')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                  baseMap === 'sat' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Imágenes Satelitales de Alta Resolución"
              >
                Satelital
              </button>
            </div>

            <button
              onClick={() => fetchWeatherForCanton(activeCanton)}
              disabled={loadingWeather}
              className="p-1.5 text-slate-300 hover:text-white bg-crisis-700 hover:bg-crisis-600 rounded-lg border border-crisis-600 transition"
              title="Refrescar telemetría del cantón activo"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingWeather ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAPA PRINCIPAL LEAFLET CON RENDIMIENTO DE TESELAS OPTIMIZADO */}
        {/* ========================================================================= */}
        <div className="flex-1 relative">
          <MapContainer
            center={ESMERALDAS_CENTER}
            zoom={12}
            minZoom={5}
            maxZoom={19}
            scrollWheelZoom={true}
            zoomAnimation={true}
            fadeAnimation={true}
            className="w-full h-full"
          >
            {/* Controlador de movimiento de mapa para autodetección de cantón */}
            <MapController 
              onCenterChange={handleMapCenterChanged} 
              targetFly={targetFly}
            />

            {/* 1. MAPA BASE CON BUFFER ALTO Y SIN BLOQUEOS DE ZOOM */}
            {baseMap === 'carto' && (
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains={['a', 'b', 'c', 'd']}
                maxZoom={19}
                keepBuffer={12}
                updateWhenZooming={false}
                updateInterval={100}
              />
            )}

            {baseMap === 'calles' && (
              <TileLayer
                attribution='&copy; Esri, TomTom'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                keepBuffer={12}
                updateWhenZooming={false}
                updateInterval={100}
              />
            )}

            {baseMap === 'osm' && (
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
                subdomains={['a', 'b', 'c']}
                maxZoom={19}
                keepBuffer={12}
                updateWhenZooming={false}
                updateInterval={100}
              />
            )}

            {baseMap === 'sat' && (
              <TileLayer
                attribution='&copy; Esri, Maxar'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                keepBuffer={12}
                updateWhenZooming={false}
                updateInterval={100}
              />
            )}

            {/* 2. PINES DISCRETOS DE TODOS LOS CANTONES */}
            {CANTONES.map((c) => {
              const isSelected = activeCanton.id === c.id;
              return (
                <Marker
                  key={`canton-pin-${c.id}`}
                  position={[c.lat, c.lon]}
                  icon={createCantonPin(c.shortName, isSelected)}
                  eventHandlers={{
                    click: () => handleSelectCanton(c),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 min-w-[150px]">
                      <p className="font-bold text-sky-400 text-sm">{c.nombre}</p>
                      <p className="text-slate-300">
                        Coordenadas: {c.lat.toFixed(4)}, {c.lon.toFixed(4)}
                      </p>
                      <button
                        onClick={() => handleSelectCanton(c)}
                        className="mt-1 w-full bg-sky-600 hover:bg-sky-500 text-white py-1 rounded font-bold text-[11px]"
                      >
                        Centrar y Ver Pronóstico
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 3. CAPAS GIS DE RIESGO DE AIVEN POSTGIS */}
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

            {/* 4. RED HÍDRICA (RÍO TEAONE Y ESMERALDAS) */}
            {layers.redHidrica && isValidGeoJson(redHidrica) && (
              <GeoJSON
                key={`rh-${redHidrica.features?.length || 0}`}
                data={redHidrica}
                style={{ color: '#0284c7', weight: 3.5, opacity: 0.85 }}
              />
            )}

            {/* 5. ALBERGUES TEMPORALES */}
            {layers.albergues && albergues?.features?.map((feature, i) => {
              const coords = feature.geometry?.coordinates;
              if (!coords) return null;
              const p = feature.properties;
              const pct = Math.round((p.ocupacion_actual / (p.capacidad_maxima || 1)) * 100);
              return (
                <Marker key={`alb-${i}`} position={[coords[1], coords[0]]} icon={shelterIcon}>
                  <Popup>
                    <div className="text-xs space-y-1.5 min-w-[190px]">
                      <p className="font-bold text-emerald-400 text-sm">{p.nombre}</p>
                      <p className="text-slate-300">{p.direccion}</p>
                      <div className="pt-1">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span>Ocupación: {p.ocupacion_actual}/{p.capacidad_maxima}</span>
                          <span className="font-bold">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 6. INFRAESTRUCTURAS ESENCIALES */}
            {layers.infraestructuras && infraestructuras?.features?.map((feature, i) => {
              const coords = feature.geometry?.coordinates;
              if (!coords) return null;
              const p = feature.properties;
              return (
                <Marker key={`inf-${i}`} position={[coords[1], coords[0]]} icon={hospitalIcon}>
                  <Popup>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-sky-400 text-sm">{p.nombre}</p>
                      <p className="text-slate-300">{p.direccion}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* ========================================================================= */}
          {/* CONTENEDOR INFERIOR COMBINADO:                                            */}
          {/* 1) WIDGET DE TELEMETRÍA DINÁMICO (ARRIBA DE LA BARRA DE TIEMPO)            */}
          {/* 2) BARRA DE PREVISIÓN HORARIA (TIMELINE SLIDER MSN)                        */}
          {/* ========================================================================= */}
          <div className="absolute bottom-3 left-3 right-3 z-[1000] flex flex-col gap-2.5 pointer-events-none">
            
            {/* WIDGET METEOROLÓGICO ACTIVO: SE ACTUALIZA AL MOVER EL MAPA O SELECCIONAR QUININDÉ */}
            <div className="pointer-events-auto bg-crisis-800/95 backdrop-blur-md border border-crisis-700/80 rounded-2xl p-3 shadow-2xl transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                
                {/* A. Cantón Activo e Indicador de Autodetección */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0 shadow-inner">
                    <WeatherIcon condition={clima?.condicion} className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm tracking-wide">
                        {clima?.lugar || activeCanton.nombre}
                      </h3>
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Detector Automático
                      </span>
                      {lastAutoDetected && (
                        <span className="text-[10px] text-sky-300 font-mono hidden md:inline">
                          (Visor en: {lastAutoDetected})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{clima?.condicion || 'Monitoreo activo'}</span>
                      <span>•</span>
                      <span>Sensación: <strong className="text-white">{clima?.sensacion_termica_c || 32}°C</strong></span>
                      <span>•</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {activeCanton.lat.toFixed(3)}°N, {Math.abs(activeCanton.lon).toFixed(3)}°W
                      </span>
                    </p>
                  </div>
                </div>

                {/* B. Selector Rápido de Cantones (Chips interactivos con un clic) */}
                <div className="flex items-center gap-1 overflow-x-auto py-1 px-1 bg-crisis-900/70 rounded-xl border border-crisis-700/70 max-w-full">
                  {CANTONES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCanton(c)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                        activeCanton.id === c.id
                          ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-300'
                          : 'text-slate-300 hover:text-white hover:bg-crisis-700/70'
                      }`}
                    >
                      {c.shortName}
                    </button>
                  ))}
                </div>

                {/* C. Métricas en Tiempo Real (Resaltando el modo meteorológico seleccionado) */}
                <div className="flex items-center gap-2 text-xs">
                  {/* Temperatura */}
                  <div className={`px-2.5 py-1.5 rounded-xl border transition ${
                    weatherMode === 'temp'
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-crisis-900/80 border-crisis-700 text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-[10px] text-slate-400 leading-none">Temp</p>
                        <p className="font-bold text-sm leading-tight">{Math.round(currentHourlyPoint.temp)}°C</p>
                      </div>
                    </div>
                  </div>

                  {/* Lluvia */}
                  <div className={`px-2.5 py-1.5 rounded-xl border transition ${
                    weatherMode === 'rain'
                      ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 shadow-md ring-1 ring-sky-400/40'
                      : 'bg-crisis-900/80 border-crisis-700 text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-sky-400" />
                      <div>
                        <p className="text-[10px] text-slate-400 leading-none">Lluvia</p>
                        <p className="font-bold text-sm leading-tight">{currentHourlyPoint.lluvia} mm</p>
                      </div>
                    </div>
                  </div>

                  {/* Viento */}
                  <div className={`px-2.5 py-1.5 rounded-xl border transition ${
                    weatherMode === 'wind'
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-md ring-1 ring-emerald-400/40'
                      : 'bg-crisis-900/80 border-crisis-700 text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-[10px] text-slate-400 leading-none">Viento</p>
                        <p className="font-bold text-sm leading-tight">{clima?.velocidad_viento_kmh || 12} km/h</p>
                      </div>
                    </div>
                  </div>

                  {/* Nubosidad */}
                  <div className={`px-2.5 py-1.5 rounded-xl border transition ${
                    weatherMode === 'clouds'
                      ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 shadow-md ring-1 ring-indigo-400/40'
                      : 'bg-crisis-900/80 border-crisis-700 text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="text-[10px] text-slate-400 leading-none">Nubes</p>
                        <p className="font-bold text-sm leading-tight">{clima?.nubosidad_porcentaje || 55}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Estado Cuenca / Tormenta */}
                  <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                    currentHourlyPoint.lluvia > 15
                      ? 'bg-red-500/20 border-red-500/40 text-red-300'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}>
                    {currentHourlyPoint.lluvia > 15 ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-[10px] text-slate-400 leading-none">Riesgo Río</p>
                      <p className="font-bold text-xs leading-tight">
                        {currentHourlyPoint.lluvia > 15 ? 'Alerta Crecida' : 'Nivel Estable'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* BARRA DE PREVISIÓN HORARIA INTERACTIVA (ESTILO TIMELINE MSN EL TIEMPO) */}
            <div className="pointer-events-auto bg-crisis-800/95 backdrop-blur-md border border-crisis-700/80 rounded-xl p-3 shadow-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-md"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                  </button>
                  <span className="text-white font-bold">
                    Previsión Horaria para {clima?.lugar || activeCanton.nombre} (Hoy)
                  </span>
                </div>

                <div className="text-sky-400 font-mono text-xs">
                  Hora: <strong className="text-white">{currentHourlyPoint.hora}</strong> • {currentHourlyPoint.temp}°C • {currentHourlyPoint.lluvia} mm lluvia
                </div>
              </div>

              {/* Slider de horas */}
              {clima?.prevision_horaria && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="range"
                    min="0"
                    max={clima.prevision_horaria.length - 1}
                    value={timelineIndex}
                    onChange={(e) => setTimelineIndex(parseInt(e.target.value))}
                    className="w-full h-2 bg-crisis-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              )}

              {/* Marcas de Tiempo Horarias (Cada 3 horas) */}
              <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                {clima?.prevision_horaria?.filter((_, idx) => idx % 3 === 0).map((h, i) => (
                  <span
                    key={i}
                    onClick={() => {
                      const originalIdx = clima.prevision_horaria.findIndex(p => p.hora === h.hora);
                      if (originalIdx !== -1) setTimelineIndex(originalIdx);
                    }}
                    className={`cursor-pointer hover:text-white transition ${
                      currentHourlyPoint.hora === h.hora ? 'text-sky-400 font-bold underline' : ''
                    }`}
                  >
                    {h.hora}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </ErrorBoundary>
  );
};
export default CrisisRoomPage;
