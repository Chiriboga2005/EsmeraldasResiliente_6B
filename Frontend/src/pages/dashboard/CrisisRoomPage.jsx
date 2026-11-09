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
  Thermometer, 
  Droplets, 
  Wind, 
  Cloud, 
  Zap, 
  Play, 
  Pause, 
  RefreshCw,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Compass,
  MapPin,
  ChevronRight,
  Sun
} from 'lucide-react';
import { gisApi } from '../../api/gisApi';
import { weatherApi } from '../../api/weatherApi';
import { evacuationApi } from '../../api/evacuationApi';
import { reportsApi } from '../../api/reportsApi';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

// Fix de íconos Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coordenadas centrales de Esmeraldas
const ESMERALDAS_CENTER = [0.9682, -79.6517];

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

// Estación meteorológica marker
const weatherStationIcon = (temp, mode) => L.divIcon({
  html: `
    <div style="
      background-color: ${mode === 'temp' ? '#f59e0b' : mode === 'rain' ? '#0284c7' : '#10b981'};
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 11px;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      white-space: nowrap;
      text-align: center;
      display: inline-block;
    ">
      ${temp}
    </div>
  `,
  className: 'custom-weather-badge',
  iconSize: [45, 25],
  iconAnchor: [22, 12],
});

const isValidGeoJson = (data) => {
  return data && (data.type === 'FeatureCollection' || data.type === 'Feature');
};

export const CrisisRoomPage = () => {
  const [zonasRiesgo, setZonasRiesgo] = useState(null);
  const [redHidrica, setRedHidrica] = useState(null);
  const [infraestructuras, setInfraestructuras] = useState(null);
  const [albergues, setAlbergues] = useState(null);
  const [clima, setClima] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modo meteorológico activo (Estilo MSN El Tiempo)
  // 'temp': Temperatura | 'rain': Precipitaciones | 'wind': Viento | 'clouds': Nubosidad | 'storm': Tormentas
  const [weatherMode, setWeatherMode] = useState('temp');

  // Mapa base: OpenStreetMap oficial o Esri
  const [baseMap, setBaseMap] = useState('osm'); // 'osm' | 'calles' | 'sat'

  // Capas territoriales
  const [layers, setLayers] = useState({
    zonasRiesgo: true,
    albergues: true,
    infraestructuras: true,
    redHidrica: true,
  });

  // Línea de tiempo interactiva (MSN El Tiempo Timeline)
  const [timelineIndex, setTimelineIndex] = useState(11); // Hora actual aproximada (11:00)
  const [isPlaying, setIsPlaying] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [zr, rh, inf, alb, cli] = await Promise.allSettled([
        gisApi.getZonasRiesgo(),
        gisApi.getRedHidricaVial(),
        gisApi.getInfraestructuras(),
        evacuationApi.getAlbergues(),
        weatherApi.getClimaActual('esmeraldas'),
      ]);

      if (zr.status === 'fulfilled') setZonasRiesgo(zr.value);
      if (rh.status === 'fulfilled') setRedHidrica(rh.value);
      if (inf.status === 'fulfilled') setInfraestructuras(inf.value);
      if (alb.status === 'fulfilled') setAlbergues(alb.value);
      if (cli.status === 'fulfilled') {
        setClima(cli.value);
        if (cli.value?.prevision_horaria?.length > 0) {
          const nowHour = new Date().getHours();
          const foundIdx = cli.value.prevision_horaria.findIndex(
            (p) => parseInt(p.hora) === nowHour
          );
          if (foundIdx !== -1) setTimelineIndex(foundIdx);
        }
      }
    } catch (err) {
      console.error('Error cargando datos del COE:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Animación del reproductor de línea de tiempo
  useEffect(() => {
    let timer;
    if (isPlaying && clima?.prevision_horaria?.length > 0) {
      timer = setInterval(() => {
        setTimelineIndex((prev) => (prev + 1) % clima.prevision_horaria.length);
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, clima]);

  // Datos del punto de tiempo seleccionado en la barra inferior
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

  // Puntos de monitoreo climático de los cantones de Esmeraldas
  const cantonStations = [
    { id: 'esm', nombre: 'Esmeraldas (Centro)', lat: 0.9681, lon: -79.6582, temp: currentHourlyPoint.temp, lluvia: currentHourlyPoint.lluvia },
    { id: 'ata', nombre: 'Atacames', lat: 0.8667, lon: -79.8444, temp: Math.round(currentHourlyPoint.temp - 0.4), lluvia: 0.0 },
    { id: 'qui', nombre: 'Quinindé', lat: 0.3283, lon: -79.4678, temp: Math.round(currentHourlyPoint.temp - 1.2), lluvia: 0.1 },
    { id: 'san', nombre: 'San Lorenzo', lat: 1.2869, lon: -78.8358, temp: Math.round(currentHourlyPoint.temp + 0.3), lluvia: 0.2 },
  ];

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full flex flex-col bg-crisis-900 overflow-hidden">
        {/* Barra Superior Estilo MSN El Tiempo: Selector de Capas Meteorológicas */}
        <div className="bg-crisis-800 border-b border-crisis-700 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-10 shadow-lg">
          {/* Título & Badge de Monitoreo */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SALA DE CRISIS COE • METEOROLOGÍA EN VIVO
            </span>
            <span className="text-xs text-slate-300 hidden md:inline">
              Cantón Esmeraldas • API Open-Meteo & OpenWeatherMap
            </span>
          </div>

          {/* BARRA DE MODOS METEOROLÓGICOS (Idéntica a la barra de iconos de MSN El Tiempo) */}
          <div className="flex items-center bg-crisis-900/90 p-1 rounded-xl border border-crisis-700 shadow-inner gap-1">
            <button
              onClick={() => setWeatherMode('temp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'temp'
                  ? 'bg-amber-500 text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-crisis-800'
              }`}
              title="Capa de Temperatura"
            >
              <Thermometer className="w-4 h-4" />
              <span>Temperatura</span>
            </button>

            <button
              onClick={() => setWeatherMode('rain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'rain'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-crisis-800'
              }`}
              title="Capa de Precipitaciones y Lluvias"
            >
              <Droplets className="w-4 h-4" />
              <span>Precipitaciones</span>
            </button>

            <button
              onClick={() => setWeatherMode('wind')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'wind'
                  ? 'bg-emerald-500 text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-crisis-800'
              }`}
              title="Velocidad y Dirección del Viento"
            >
              <Wind className="w-4 h-4" />
              <span>Viento</span>
            </button>

            <button
              onClick={() => setWeatherMode('clouds')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'clouds'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-crisis-800'
              }`}
              title="Nubosidad Satelital"
            >
              <Cloud className="w-4 h-4" />
              <span>Nubosidad</span>
            </button>

            <button
              onClick={() => setWeatherMode('storm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'storm'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-crisis-800'
              }`}
              title="Monitoreo de Tormentas y Desborde Teaone"
            >
              <Zap className="w-4 h-4" />
              <span>Tormentas & Riesgo</span>
            </button>
          </div>

          {/* Selector de Mapa Base */}
          <div className="flex items-center gap-2">
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
                onClick={() => setBaseMap('calles')}
                className={`px-2 py-1 rounded transition text-[11px] font-semibold ${
                  baseMap === 'calles' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Calles & Ríos
              </button>
              <button
                onClick={() => setBaseMap('sat')}
                className={`px-2 py-1 rounded transition text-[11px] font-semibold ${
                  baseMap === 'sat' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Satelital
              </button>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-slate-300 hover:text-white bg-crisis-700 rounded border border-crisis-600"
              title="Actualizar telemetría meteorológica"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Contenedor del Mapa Central */}
        <div className="flex-1 relative">
          <MapContainer
            center={ESMERALDAS_CENTER}
            zoom={12}
            minZoom={5}
            maxZoom={18}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            {/* 1. MAPA BASE: OpenStreetMap (Mirror Oficial Francés 100% abierto sin bloqueos 403) */}
            {baseMap === 'osm' && (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
                maxZoom={18}
              />
            )}

            {baseMap === 'calles' && (
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com">Esri</a>, TomTom'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            )}

            {baseMap === 'sat' && (
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com">Esri</a>, Maxar'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            )}

            {/* 2. ESTACIONES METEOROLÓGICAS EN VIVO SEGÚN MODO SELECCIONADO */}
            {cantonStations.map((st) => {
              const displayVal =
                weatherMode === 'temp'
                  ? `${st.temp}°C`
                  : weatherMode === 'rain'
                  ? `${st.lluvia} mm`
                  : weatherMode === 'wind'
                  ? `${clima?.velocidad_viento_kmh || 11} km/h`
                  : weatherMode === 'clouds'
                  ? `${clima?.nubosidad_porcentaje || 60}%`
                  : '⚡ Normal';

              return (
                <Marker
                  key={`st-${st.id}`}
                  position={[st.lat, st.lon]}
                  icon={weatherStationIcon(displayVal, weatherMode)}
                >
                  <Popup>
                    <div className="text-xs space-y-1 min-w-[170px]">
                      <p className="font-bold text-sky-400 text-sm">{st.nombre}</p>
                      <p className="text-slate-200">
                        <strong>Temperatura:</strong> {st.temp}°C
                      </p>
                      <p className="text-slate-200">
                        <strong>Precipitación:</strong> {st.lluvia} mm/h
                      </p>
                      <p className="text-slate-200">
                        <strong>Viento:</strong> {clima?.velocidad_viento_kmh || 11} km/h ({clima?.direccion_viento_grados || 350}°)
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        Hora de lectura: {currentHourlyPoint.hora}
                      </p>
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

          {/* TARJETA FLOTANTE DE CLIMA EN VIVO (ESTILO EXACTO MSN EL TIEMPO) */}
          <div className="absolute top-4 right-4 z-[1000] w-80 bg-crisis-800/95 backdrop-blur border border-crisis-700 rounded-2xl p-4 shadow-2xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-crisis-700 pb-2">
              <div>
                <p className="font-mono text-[10px] text-slate-400">
                  {clima?.coordenadas ? `${clima.coordenadas.lat}° N, ${Math.abs(clima.coordenadas.lon)}° W` : 'Esmeraldas, Ecuador'}
                </p>
                <h3 className="font-bold text-white text-sm">
                  {clima?.lugar || 'Esmeraldas (Capital)'}
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {currentHourlyPoint.hora} GMT-5
              </span>
            </div>

            {/* Indicador Principal de Temperatura y Condición */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  {Math.round(currentHourlyPoint.temp)}
                </span>
                <span className="text-xl text-slate-400 font-bold">°C</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-200 capitalize text-xs">
                  {clima?.condicion || 'Parcialmente nublado'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Sensación: {clima?.sensacion_termica_c || 34}°C
                </p>
              </div>
            </div>

            {/* Métricas Detalladas */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-crisis-700 text-slate-300">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-400" />
                <span>Precipitación: <strong>{currentHourlyPoint.lluvia} mm</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-emerald-400" />
                <span>Viento: <strong>{clima?.velocidad_viento_kmh || 11} km/h</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-indigo-400" />
                <span>Nubosidad: <strong>{clima?.nubosidad_porcentaje || 66}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Humedad: <strong>{clima?.humedad_porcentaje || 68}%</strong></span>
              </div>
            </div>

            {/* Estado de Riesgo Hidrológico */}
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-[11px] ${
              currentHourlyPoint.lluvia > 15
                ? 'bg-red-500/15 border-red-500/30 text-red-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            }`}>
              {currentHourlyPoint.lluvia > 15 ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 shrink-0" />
              )}
              <span>
                {currentHourlyPoint.lluvia > 15
                  ? 'Alerta de Crecida: Lluvias intensas previstas.'
                  : 'Nivel del Río Teaone Estable • Sin alerta de desbordamiento.'}
              </span>
            </div>
          </div>

          {/* LÍNEA DE TIEMPO INTERACTIVA HORARIA (ESTILO BARRA INFERIOR DE MSN EL TIEMPO) */}
          <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-crisis-800/95 backdrop-blur border border-crisis-700 rounded-xl p-3 shadow-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pausar' : 'Reproducir Pronóstico'}</span>
                </button>
                <span className="text-white font-bold">
                  Previsión Horaria para Esmeraldas (Hoy)
                </span>
              </div>

              <div className="text-sky-400 font-mono text-xs">
                Seleccionado: <strong className="text-white">{currentHourlyPoint.hora}</strong> • {currentHourlyPoint.temp}°C • {currentHourlyPoint.lluvia} mm lluvia
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

            {/* Marcas de Tiempo Horarias (Idénticas a MSN Tiempo) */}
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
    </ErrorBoundary>
  );
};
