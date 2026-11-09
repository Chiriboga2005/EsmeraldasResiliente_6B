import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Sparkles,
  Plus,
  Trash2,
  Building2,
  Flame,
  HeartPulse,
  X
} from 'lucide-react';
import { gisApi } from '../../api/gisApi';
import { weatherApi } from '../../api/weatherApi';
import { evacuationApi } from '../../api/evacuationApi';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

// API Key oficial de CARTO para eliminar marcas de agua en teselas Voyager
const CARTO_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfZTViYzllYjYiLCJqdGkiOiIyNjk1OGQwYWE0ZDYwZTUyYmI5Nzk0MTFmOThlYjJjZiJ9.EGdBLX9QpAvUHvpBcjrHiFLLnOJ7k-DqSevIFT5bH_k';

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

// Ícono personalizado exclusivo para albergues temporales y zonas de refugio (Casa/Refugio con techo seguro y cupo)
const createShelterMarker = (pct = 0, nombre = '', isAdmin = false) => {
  const bgColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
  const ringColor = pct >= 90 ? '#991b1b' : pct >= 70 ? '#b45309' : '#047857';
  const badgeText = pct >= 90 ? 'LLENO' : `${pct}%`;

  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: ${isAdmin ? 'grab' : 'pointer'}; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));">
        <!-- Badge de Refugio / Albergue -->
        <div style="
          width: 36px; 
          height: 36px; 
          background: ${bgColor}; 
          border: ${isAdmin ? '2.5px dashed #38bdf8' : '2.5px solid #ffffff'}; 
          border-radius: 10px; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
          box-shadow: 0 0 10px ${bgColor}88, inset 0 2px 4px rgba(255,255,255,0.3);
        ">
          <!-- Pictograma de Refugio / Casa Segura -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 10.5 12 3l9 7.5"/>
            <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>
            <path d="M10 21v-6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6"/>
          </svg>
        </div>
        <!-- Puntero inferior -->
        <div style="
          width: 0; 
          height: 0; 
          border-left: 6px solid transparent; 
          border-right: 6px solid transparent; 
          border-top: 7px solid ${bgColor}; 
          margin-top: -1px;
        "></div>
        <!-- Mini pill de estado de ocupación -->
        <div style="
          margin-top: 1px;
          background: rgba(15, 23, 42, 0.95);
          color: #ffffff;
          padding: 1px 6px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.3px;
          border: 1px solid ${ringColor};
          white-space: nowrap;
        ">
          ALBERGUE ${badgeText}
        </div>
      </div>
    `,
    className: 'custom-shelter-marker',
    iconSize: [42, 56],
    iconAnchor: [21, 56],
    popupAnchor: [0, -56],
  });
};

// Ícono personalizado para hospitales, bomberos y puestos de auxilio
const createHospitalMarker = (tipo = 'HOSPITAL', isAdmin = false) => {
  const isBomberos = tipo?.toUpperCase().includes('BOMBERO');
  const isPolicia = tipo?.toUpperCase().includes('POLICIA');
  const bgColor = isBomberos ? '#ea580c' : isPolicia ? '#2563eb' : '#dc2626';
  const label = isBomberos ? 'BOMBEROS' : isPolicia ? 'POLICÍA' : 'HOSPITAL';

  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: ${isAdmin ? 'grab' : 'pointer'}; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));">
        <div style="
          width: 32px; 
          height: 32px; 
          background: ${bgColor}; 
          border: ${isAdmin ? '2.5px dashed #38bdf8' : '2.5px solid #ffffff'}; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
          box-shadow: 0 0 10px ${bgColor}88;
        ">
          ${isBomberos ? `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          ` : `
            <!-- Cruz Médica Universal -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
            </svg>
          `}
        </div>
        <div style="
          width: 0; 
          height: 0; 
          border-left: 5px solid transparent; 
          border-right: 5px solid transparent; 
          border-top: 6px solid ${bgColor}; 
          margin-top: -1px;
        "></div>
        <div style="
          margin-top: 1px;
          background: rgba(15, 23, 42, 0.95);
          color: #ffffff;
          padding: 1px 5px;
          border-radius: 6px;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 0.3px;
          border: 1px solid ${isAdmin ? '#38bdf8' : bgColor};
          white-space: nowrap;
        ">
          ${label}
        </div>
      </div>
    `,
    className: 'custom-hospital-marker',
    iconSize: [32, 50],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

// Etiqueta territorial para cantones (Mapa/Ubicación administrativa con temperatura en vivo)
const createCantonPin = (nombre, isSelected, temp = null) => L.divIcon({
  html: `
    <div style="
      background: ${isSelected ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.94)'};
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 11px;
      border: 1.5px solid ${isSelected ? '#38bdf8' : '#475569'};
      box-shadow: 0 4px 14px rgba(0,0,0,0.6);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      cursor: pointer;
      backdrop-filter: blur(6px);
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#bae6fd' : '#38bdf8'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" y2="18"/>
        <line x1="15" y1="6" y2="21"/>
      </svg>
      <span>${nombre}</span>
      ${isSelected && temp !== null ? `
        <span style="
          background: rgba(245, 158, 11, 0.25);
          color: #fde047;
          border: 1px solid rgba(245, 158, 11, 0.5);
          padding: 0 4px;
          border-radius: 6px;
          font-size: 10px;
          font-family: monospace;
          margin-left: 2px;
        ">
          ${temp}°C
        </span>
      ` : ''}
    </div>
  `,
  className: 'custom-canton-pin',
  iconSize: [temp !== null ? 130 : 95, 26],
  iconAnchor: [temp !== null ? 65 : 47, 13],
  popupAnchor: [0, -15],
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
  const { user } = useAuth();
  // Modo de gestión restringido exclusivamente para el ADMINISTRADOR
  const userRol = (user?.rol || user?.properties?.rol || '').toUpperCase();
  const userUsername = (user?.username || user?.properties?.username || '').toLowerCase();
  const isAdmin = Boolean(
    user && (
      userRol === 'ADMINISTRADOR' || 
      userRol === 'ADMIN' || 
      userUsername === 'admin' || 
      user?.is_staff || 
      user?.is_superuser
    )
  );
  const [saveStatus, setSaveStatus] = useState(null);

  const [zonasRiesgo, setZonasRiesgo] = useState(null);
  const [redHidrica, setRedHidrica] = useState(null);
  const [infraestructuras, setInfraestructuras] = useState(null);
  const [albergues, setAlbergues] = useState(null);
  
  // Cantón activo seleccionado o detectado
  const [activeCanton, setActiveCanton] = useState(CANTONES[0]);
  const [targetFly, setTargetFly] = useState(null);
  const [mapCenterCoords, setMapCenterCoords] = useState(ESMERALDAS_CENTER);

  // Clima en vivo del cantón activo
  const [clima, setClima] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [lastAutoDetected, setLastAutoDetected] = useState(null);

  // Modo meteorológico activo (Estilo MSN El Tiempo)
  // 'temp': Temperatura | 'rain': Precipitaciones | 'wind': Viento | 'clouds': Nubosidad | 'storm': Tormentas
  const [weatherMode, setWeatherMode] = useState('temp');

  // Mapa base: 'calles' (Esri AWS sin marca de agua) | 'sat' (Esri Satélite HD) | 'osm' (Francia) | 'carto' (Voyager)
  const [baseMap, setBaseMap] = useState('calles');

  // Capas territoriales conmutables
  const [layers, setLayers] = useState({
    zonasRiesgo: true,
    albergues: true,
    infraestructuras: true,
    redHidrica: true,
  });

  // Normalización defensiva de listas de infraestructuras y albergues
  const infraFeatures = useMemo(() => {
    if (!infraestructuras) return [];
    if (Array.isArray(infraestructuras)) return infraestructuras;
    if (Array.isArray(infraestructuras.features)) return infraestructuras.features;
    if (Array.isArray(infraestructuras.results)) return infraestructuras.results;
    if (infraestructuras.results?.features) return infraestructuras.results.features;
    return [];
  }, [infraestructuras]);

  const shelterFeatures = useMemo(() => {
    if (!albergues) return [];
    if (Array.isArray(albergues)) return albergues;
    if (Array.isArray(albergues.features)) return albergues.features;
    if (Array.isArray(albergues.results)) return albergues.results;
    if (albergues.results?.features) return albergues.results.features;
    return [];
  }, [albergues]);

  // Línea de tiempo interactiva (MSN El Tiempo Timeline)
  const [timelineIndex, setTimelineIndex] = useState(11);
  const [isPlaying, setIsPlaying] = useState(false);

  // Modal y Formulario para creación de Hospitales y Cuerpo de Bomberos (Exclusivo Administrador)
  const [showCreateInfraModal, setShowCreateInfraModal] = useState(false);
  const [infraForm, setInfraForm] = useState({
    nombre: '',
    tipo: 'HOSPITAL',
    direccion: '',
    telefono_contacto: '',
    contacto_responsable: '',
    capacidad_atencion: 100,
    lat: 0.968,
    lon: -79.654,
  });

  const handleCreateInfraestructura = async (e) => {
    e.preventDefault();
    if (!infraForm.nombre?.trim()) {
      alert('Por favor ingrese el nombre oficial de la infraestructura.');
      return;
    }
    const latNum = Number(infraForm.lat);
    const lonNum = Number(infraForm.lon);
    if (isNaN(latNum) || isNaN(lonNum)) {
      alert('Coordenadas GPS no válidas.');
      return;
    }

    const payload = {
      nombre: infraForm.nombre.trim(),
      tipo: infraForm.tipo || 'HOSPITAL',
      direccion: infraForm.direccion?.trim() || 'Cantón Esmeraldas',
      telefono_contacto: infraForm.telefono_contacto?.trim() || '',
      contacto_responsable: infraForm.contacto_responsable?.trim() || '',
      capacidad_atencion: Number(infraForm.capacidad_atencion) || 100,
      lat: Number(latNum.toFixed(5)),
      lon: Number(lonNum.toFixed(5)),
    };

    try {
      const resCreated = await gisApi.createInfraestructura(payload);
      setShowCreateInfraModal(false);

      const createdFeature = resCreated?.infraestructura || {
        type: 'Feature',
        id: resCreated?.id || Date.now(),
        geometry: {
          type: 'Point',
          coordinates: [payload.lon, payload.lat],
        },
        properties: {
          id: resCreated?.id || Date.now(),
          nombre: payload.nombre,
          tipo: payload.tipo,
          direccion: payload.direccion,
          telefono_contacto: payload.telefono_contacto,
          contacto_responsable: payload.contacto_responsable,
          capacidad_atencion: payload.capacidad_atencion,
          activo: true,
        },
      };

      // Inserción visual reactiva inmediata en el visor
      setInfraestructuras((prev) => {
        if (!prev) return { type: 'FeatureCollection', features: [createdFeature] };
        if (Array.isArray(prev)) return [...prev, createdFeature];
        const prevFeatures = prev.features || [];
        return {
          ...prev,
          features: [...prevFeatures, createdFeature],
        };
      });

      // Mover cámara a la nueva infraestructura
      setTargetFly({ lat: payload.lat, lon: payload.lon, zoom: 15, ts: Date.now() });

      // Sincronizar desde la base de datos PostgreSQL en Aiven
      const fresh = await gisApi.getInfraestructuras();
      if (fresh) setInfraestructuras(fresh);

      setSaveStatus({
        type: 'success',
        text: `✅ ${payload.tipo}: "${payload.nombre}" registrado exitosamente en la base de datos Aiven.`,
      });
      setTimeout(() => setSaveStatus(null), 6000);
    } catch (err) {
      console.error('Error guardando infraestructura:', err);
      alert('Error guardando infraestructura en Aiven: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteInfraestructura = async (id, nombre) => {
    if (window.confirm(`¿Confirmas que deseas eliminar permanentemente "${nombre}" de la base de datos?`)) {
      try {
        await gisApi.deleteInfraestructura(id);
        const res = await gisApi.getInfraestructuras();
        setInfraestructuras(res);
        setSaveStatus({
          type: 'success',
          text: `🗑️ "${nombre}" eliminado del sistema.`,
        });
        setTimeout(() => setSaveStatus(null), 6000);
      } catch (err) {
        alert('Error eliminando infraestructura: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  // Manejador de arrastre de infraestructuras (Hospitales / Bomberos) para reubicación en tierra firme (Exclusivo Administrador)
  const handleInfraDragEnd = (infraId, infraNombre) => async (e) => {
    const marker = e.target;
    const newPos = marker.getLatLng();
    const newLat = Number(newPos.lat.toFixed(5));
    const newLon = Number(newPos.lng.toFixed(5));

    setInfraestructuras((prev) => {
      if (!prev) return prev;
      if (Array.isArray(prev)) {
        return prev.map((f) => {
          const fid = f.id || f.properties?.id;
          if (fid === infraId) {
            return {
              ...f,
              geometry: {
                ...f.geometry,
                coordinates: [newLon, newLat],
              },
            };
          }
          return f;
        });
      }
      if (prev.features) {
        return {
          ...prev,
          features: prev.features.map((f) => {
            const fid = f.id || f.properties?.id;
            if (fid === infraId) {
              return {
                ...f,
                geometry: {
                  ...f.geometry,
                  coordinates: [newLon, newLat],
                },
              };
            }
            return f;
          }),
        };
      }
      return prev;
    });

    try {
      await gisApi.updateInfraestructura(infraId, { lat: newLat, lon: newLon });
      setSaveStatus({
        type: 'success',
        text: `✅ ${infraNombre} reubicado exitosamente a [${newLat}, ${newLon}] en PostGIS.`,
      });
      setTimeout(() => setSaveStatus(null), 6000);
    } catch (err) {
      console.error('Error al guardar infraestructura:', err);
      setSaveStatus({
        type: 'error',
        text: `⚠️ No se pudo guardar la ubicación en la base de datos.`,
      });
      setTimeout(() => setSaveStatus(null), 6000);
    }
  };

  // Manejador de arrastre de albergues para reubicación interactiva en tierra firme (Modo Admin)
  const handleShelterDragEnd = (albergueId, albergueNombre) => async (e) => {
    const marker = e.target;
    const newPos = marker.getLatLng();
    const newLat = Number(newPos.lat.toFixed(5));
    const newLon = Number(newPos.lng.toFixed(5));

    // Actualización visual inmediata en estado local GeoJSON
    setAlbergues((prev) => {
      if (!prev) return prev;
      if (Array.isArray(prev)) {
        return prev.map((f) => {
          const fid = f.id || f.properties?.id;
          if (fid === albergueId) {
            return {
              ...f,
              geometry: {
                ...f.geometry,
                coordinates: [newLon, newLat],
              },
            };
          }
          return f;
        });
      }
      if (prev.features) {
        return {
          ...prev,
          features: prev.features.map((f) => {
            const fid = f.id || f.properties?.id;
            if (fid === albergueId) {
              return {
                ...f,
                geometry: {
                  ...f.geometry,
                  coordinates: [newLon, newLat],
                },
              };
            }
            return f;
          }),
        };
      }
      return prev;
    });

    try {
      await evacuationApi.updateAlbergue(albergueId, { lat: newLat, lon: newLon });
      setSaveStatus({
        type: 'success',
        text: `✅ Albergue "${albergueNombre}" reubicado exitosamente a [${newLat}, ${newLon}] en la base de datos PostGIS.`,
      });
      setTimeout(() => setSaveStatus(null), 6000);
    } catch (err) {
      console.error('Error al guardar albergue:', err);
      setSaveStatus({
        type: 'error',
        text: `⚠️ No se pudo guardar la ubicación en la base de datos.`,
      });
      setTimeout(() => setSaveStatus(null), 6000);
    }
  };

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
    setMapCenterCoords([lat, lon]);
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

  // Previsión horaria garantizada y reactiva (24 horas dinámicas con variación continua)
  const hourlyList = useMemo(() => {
    if (clima?.prevision_horaria && clima.prevision_horaria.length > 0) {
      return clima.prevision_horaria;
    }
    const baseT = clima?.temperatura_c || 28.5;
    return Array.from({ length: 24 }, (_, i) => {
      const hh = String(i).padStart(2, '0') + ':00';
      const factor = Math.sin(((i - 8) / 24) * 2 * Math.PI);
      const temp = Number((baseT + factor * 3.6).toFixed(1));
      const lluvia = i >= 13 && i <= 17 ? Number((Math.sin((i - 13) / 4 * Math.PI) * 16.5).toFixed(1)) : 0.0;
      const viento = Number((10.5 + Math.abs(factor) * 7.5).toFixed(1));
      return {
        hora: hh,
        temp,
        lluvia,
        viento,
        codigo: lluvia > 5 ? 63 : lluvia > 0 ? 51 : 2,
        condicion: lluvia > 5 ? 'Lluvia moderada' : lluvia > 0 ? 'Llovizna dispersa' : 'Parcialmente nublado',
      };
    });
  }, [clima]);

  // Animación del reproductor de línea de tiempo horaria
  useEffect(() => {
    let timer;
    if (isPlaying && hourlyList.length > 0) {
      timer = setInterval(() => {
        setTimelineIndex((prev) => (prev + 1) % hourlyList.length);
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, hourlyList]);

  // Punto horario activo sincronizado dinámicamente con el slider
  const currentHourlyPoint = hourlyList[timelineIndex] || hourlyList[0] || {
    hora: '11:00',
    temp: 28.5,
    lluvia: 0.0,
    viento: 12.0,
    condicion: 'Parcialmente Nublado'
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
        <div className="bg-white/95 dark:bg-crisis-800/95 backdrop-blur-md border-b border-slate-200 dark:border-crisis-700 px-3 md:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 z-10 shadow-sm">
          
          {/* Título & Badge de Monitoreo */}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-500/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              SALA DE CRISIS COE • RADAR EN VIVO
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 hidden lg:inline font-medium">
              Provincia de Esmeraldas • Open-Meteo & OpenWeatherMap
            </span>
          </div>

          {/* BARRA DE MODOS METEOROLÓGICOS (ESTILO MSN EL TIEMPO) */}
          <div className="flex items-center bg-slate-100 dark:bg-crisis-900/90 p-1 rounded-xl border border-slate-300 dark:border-crisis-700/80 shadow-inner gap-1">
            <button
              onClick={() => setWeatherMode('temp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'temp'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md ring-1 ring-amber-300'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
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
                  ? 'bg-sky-600 text-white shadow-md ring-1 ring-sky-300'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
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
                  ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-300'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
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
                  ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-300'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
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
                  ? 'bg-red-600 text-white shadow-md ring-1 ring-red-300'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
              }`}
              title="Alerta de Tormentas y Desborde de Cuencas"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tormentas & Riesgo</span>
            </button>
          </div>

          {/* Selector de Mapa Base Ultra-Rápido */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-crisis-900/90 p-0.5 rounded-xl border border-slate-300 dark:border-crisis-700/80 text-xs">
              <button
                onClick={() => setBaseMap('calles')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                  baseMap === 'calles' ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-300' : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
                title="Esri World Street Map: Libre de marcas de agua, alta definición y carga rápida"
              >
                Calles Esri (Recomendado)
              </button>
              <button
                onClick={() => setBaseMap('sat')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                  baseMap === 'sat' ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-300' : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
                title="Imágenes Satelitales de Alta Resolución (Esri World Imagery)"
              >
                Satelital
              </button>
              <button
                onClick={() => setBaseMap('osm')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                  baseMap === 'osm' ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-300' : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
                title="OpenStreetMap Mirror Comunitario"
              >
                OSM
              </button>
            </div>

            <button
              onClick={() => fetchWeatherForCanton(activeCanton)}
              disabled={loadingWeather}
              className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-crisis-700 dark:hover:bg-crisis-600 rounded-lg border border-slate-300 dark:border-crisis-600 transition"
              title="Refrescar telemetría del cantón activo"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingWeather ? 'animate-spin text-sky-500 dark:text-sky-400' : ''}`} />
            </button>

            {/* Acciones de Creación (Exclusivo Administrador) */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-crisis-700">
                <button
                  onClick={() => {
                    const centerLat = mapCenterCoords ? mapCenterCoords[0] : (activeCanton?.lat || ESMERALDAS_CENTER[0]);
                    const centerLon = mapCenterCoords ? mapCenterCoords[1] : (activeCanton?.lon || ESMERALDAS_CENTER[1]);
                    setInfraForm({
                      nombre: '',
                      tipo: 'HOSPITAL',
                      direccion: 'Av. Libertad y Calle 10, Esmeraldas',
                      telefono_contacto: '062723000',
                      contacto_responsable: 'Dr. Roberto Estupiñán',
                      capacidad_atencion: 120,
                      lat: Number(centerLat.toFixed(5)),
                      lon: Number(centerLon.toFixed(5)),
                    });
                    setShowCreateInfraModal(true);
                  }}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-lg shadow flex items-center gap-1 transition active:scale-95"
                  title="Registrar nuevo hospital en la base de datos"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Hospital</span>
                </button>

                <button
                  onClick={() => {
                    const centerLat = mapCenterCoords ? mapCenterCoords[0] : (activeCanton?.lat || ESMERALDAS_CENTER[0]);
                    const centerLon = mapCenterCoords ? mapCenterCoords[1] : (activeCanton?.lon || ESMERALDAS_CENTER[1]);
                    setInfraForm({
                      nombre: '',
                      tipo: 'BOMBEROS',
                      direccion: 'Calle Sucre y Rocafuerte, Esmeraldas',
                      telefono_contacto: '062720102',
                      contacto_responsable: 'Cmdte. Miguel Perea',
                      capacidad_atencion: 45,
                      lat: Number(centerLat.toFixed(5)),
                      lon: Number(centerLon.toFixed(5)),
                    });
                    setShowCreateInfraModal(true);
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg shadow flex items-center gap-1 transition active:scale-95"
                  title="Registrar nueva estación de bomberos en la base de datos"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Bomberos</span>
                </button>
              </div>
            )}
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
                url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`}
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
                  icon={createCantonPin(c.shortName, isSelected, isSelected ? Number(currentHourlyPoint.temp).toFixed(1) : null)}
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

            {/* 5. ALBERGUES TEMPORALES Y ZONAS DE EVACUACIÓN / REFUGIO (ARRASTRABLES EN MODO ADMIN) */}
            {layers.albergues && shelterFeatures.map((feature, i) => {
              const rawCoords = feature.geometry?.coordinates;
              if (!rawCoords) return null;
              const coords = Array.isArray(rawCoords)
                ? rawCoords
                : typeof rawCoords === 'string'
                  ? rawCoords.trim().split(/\s+/).map(Number)
                  : null;
              if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null;

              const p = feature.properties || {};
              const albId = feature.id || p.id || (i + 1);
              const pct = Math.round((p.ocupacion_actual / (p.capacidad_maxima || 1)) * 100);
              return (
                <Marker 
                  key={`alb-${albId}`} 
                  position={[coords[1], coords[0]]} 
                  icon={createShelterMarker(pct, p.nombre, isAdmin)}
                  draggable={isAdmin}
                  eventHandlers={{
                    dragend: handleShelterDragEnd(albId, p.nombre),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-2 min-w-[220px] p-1 text-slate-800 dark:text-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                          <span>Albergue y Refugio Seguro</span>
                        </div>
                        {isAdmin && (
                          <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 px-1.5 py-0.5 rounded font-extrabold">
                            ADMIN (Arrastrable)
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white text-sm">{p.nombre}</p>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">{p.direccion || 'Cantón Esmeraldas'}</p>
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px] mt-0.5">
                          GPS: {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
                        </p>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60">
                        <div className="flex justify-between text-[11px] mb-1 text-slate-700 dark:text-slate-200">
                          <span>Ocupación: <strong>{p.ocupacion_actual}</strong> / {p.capacidad_maxima}</span>
                          <span className={`font-bold ${pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700/80 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} 
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5">
                          Cupos disponibles: <strong className="text-emerald-600 dark:text-emerald-400">{Math.max(0, p.capacidad_maxima - p.ocupacion_actual)} personas</strong>
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60 text-[10px] text-sky-700 dark:text-sky-300 flex items-center gap-1 font-semibold">
                          <span>✋ Arrastra este albergue en el mapa para corregir su posición en tierra firme.</span>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 6. INFRAESTRUCTURAS ESENCIALES (HOSPITALES, BOMBEROS) */}
            {layers.infraestructuras && infraFeatures.map((feature, i) => {
              const rawCoords = feature.geometry?.coordinates;
              if (!rawCoords) return null;
              const coords = Array.isArray(rawCoords)
                ? rawCoords
                : typeof rawCoords === 'string'
                  ? rawCoords.trim().split(/\s+/).map(Number)
                  : null;
              if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null;

              const p = feature.properties || {};
              const infraId = feature.id || p.id || (i + 1);

              return (
                <Marker 
                  key={`inf-${infraId}`} 
                  position={[coords[1], coords[0]]} 
                  icon={createHospitalMarker(p.tipo, isAdmin)}
                  draggable={isAdmin}
                  eventHandlers={{
                    dragend: handleInfraDragEnd(infraId, p.nombre),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1.5 min-w-[200px] p-1 text-slate-800 dark:text-slate-200">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-1">
                        <span className="text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider text-[10px]">
                          {p.tipo || 'HOSPITAL'}
                        </span>
                        {isAdmin && (
                          <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 px-1.5 py-0.5 rounded font-extrabold">
                            ADMIN (Arrastrable)
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{p.nombre}</p>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px]">{p.direccion || 'Esmeraldas'}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                        GPS: {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
                      </p>
                      {p.telefono_contacto && (
                        <p className="text-slate-600 dark:text-slate-400 text-[10px] pt-1">
                          Contacto: <span className="text-sky-700 dark:text-sky-300 font-medium">{p.telefono_contacto}</span>
                        </p>
                      )}
                      {isAdmin && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                          <div className="text-[10px] text-sky-700 dark:text-sky-300 flex items-center gap-1 font-semibold">
                            <span>✋ Arrastra este icono en el mapa para corregir su posición en tierra firme.</span>
                          </div>
                          <button
                            onClick={() => handleDeleteInfraestructura(infraId, p.nombre)}
                            className="w-full py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 transition shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Eliminar de Base de Datos</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* TOAST DE REUBICACIÓN EN BASE DE DATOS */}
          {saveStatus && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[1200] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md border animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2 ${
              saveStatus.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200 ring-2 ring-emerald-500/30'
                : 'bg-red-950/95 border-red-500/60 text-red-200'
            }`}>
              <span>{saveStatus.text}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONSOLA INFERIOR UNIFICADA: TELEMETRÍA DINÁMICA & TIMELINE MSN EL TIEMPO */}
          {/* ========================================================================= */}
          <div className="absolute bottom-2 left-2 right-2 lg:right-52 z-[1000] flex flex-col gap-1.5 pointer-events-none">
            
            <div className="pointer-events-auto bg-white/95 dark:bg-crisis-800/95 backdrop-blur-md border border-slate-200 dark:border-crisis-700/80 rounded-2xl p-2.5 shadow-2xl space-y-2">
              
              {/* FILA 1: CANTÓN ACTIVO, CHIPS SELECTORES Y BADGES DE TELEMETRÍA */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                
                {/* Cantón Activo */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/25 flex items-center justify-center shrink-0 shadow-inner">
                    <WeatherIcon condition={clima?.condicion} className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs tracking-wide">
                        {clima?.lugar || activeCanton.nombre}
                      </h3>
                      <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                        En Vivo
                      </span>
                      {isAdmin && (
                        <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 px-1.5 py-0.2 rounded font-extrabold hidden sm:inline">
                          ADMIN (Arrastra Albergues)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="capitalize">{currentHourlyPoint.condicion || clima?.condicion || 'Monitoreo activo'}</span>
                      <span>•</span>
                      <span>Sensación: <strong className="text-slate-900 dark:text-white">{(Number(currentHourlyPoint.temp) + 2.5).toFixed(1)}°C</strong></span>
                    </p>
                  </div>
                </div>

                {/* Chips de Selección Rápida de Cantones */}
                <div className="flex items-center gap-1 overflow-x-auto py-0.5 px-1 bg-slate-100 dark:bg-crisis-900/80 rounded-lg border border-slate-200 dark:border-crisis-700/70">
                  {CANTONES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCanton(c)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition whitespace-nowrap ${
                        activeCanton.id === c.id
                          ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-300'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-700/70'
                      }`}
                    >
                      {c.shortName}
                    </button>
                  ))}
                </div>

                {/* Métricas en Tiempo Real (Resaltando el modo meteorológico seleccionado) */}
                <div className="flex items-center gap-1.5 text-xs">
                  {/* Temp */}
                  <div className={`px-2 py-1 rounded-lg border transition ${
                    weatherMode === 'temp'
                      ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/20 dark:border-amber-500/60 dark:text-amber-300 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-crisis-900/80 dark:border-crisis-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Temp</span>
                      <strong className="text-xs font-mono">{Number(currentHourlyPoint.temp).toFixed(1)}°C</strong>
                    </div>
                  </div>

                  {/* Lluvia */}
                  <div className={`px-2 py-1 rounded-lg border transition ${
                    weatherMode === 'rain'
                      ? 'bg-sky-100 text-sky-900 border-sky-400 dark:bg-sky-500/20 dark:border-sky-500/60 dark:text-sky-300 shadow-md ring-1 ring-sky-400/40'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-crisis-900/80 dark:border-crisis-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Lluvia</span>
                      <strong className="text-xs font-mono">{Number(currentHourlyPoint.lluvia).toFixed(1)} mm</strong>
                    </div>
                  </div>

                  {/* Viento */}
                  <div className={`px-2 py-1 rounded-lg border transition ${
                    weatherMode === 'wind'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-500/20 dark:border-emerald-500/60 dark:text-emerald-300 shadow-md ring-1 ring-emerald-400/40'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-crisis-900/80 dark:border-crisis-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Viento</span>
                      <strong className="text-xs font-mono">{currentHourlyPoint.viento || clima?.velocidad_viento_kmh || 12} km/h</strong>
                    </div>
                  </div>

                  {/* Nubes */}
                  <div className={`px-2 py-1 rounded-lg border transition ${
                    weatherMode === 'clouds'
                      ? 'bg-indigo-100 text-indigo-900 border-indigo-400 dark:bg-indigo-500/20 dark:border-indigo-500/60 dark:text-indigo-300 shadow-md ring-1 ring-indigo-400/40'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-crisis-900/80 dark:border-crisis-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1">
                      <Cloud className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Nubes</span>
                      <strong className="text-xs">{clima?.nubosidad_porcentaje || 55}%</strong>
                    </div>
                  </div>

                  {/* Riesgo */}
                  <div className={`px-2 py-1 rounded-lg border flex items-center gap-1 ${
                    currentHourlyPoint.lluvia > 15
                      ? 'bg-red-100 text-red-900 border-red-300 dark:bg-red-500/20 dark:border-red-500/40 dark:text-red-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300'
                  }`}>
                    {currentHourlyPoint.lluvia > 15 ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    )}
                    <span className="font-bold text-[11px]">
                      {currentHourlyPoint.lluvia > 15 ? 'Alerta Crecida' : 'Nivel Estable'}
                    </span>
                  </div>
                </div>

              </div>

              {/* FILA 2: BARRA DE TIEMPO HORARIA INTERACTIVA (SLIDER MSN EL TIEMPO) */}
              <div className="pt-1.5 border-t border-slate-200 dark:border-crisis-700/70 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] transition shadow"
                    >
                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                    </button>
                    <span className="text-slate-900 dark:text-white text-xs font-bold">
                      Previsión Horaria (24h)
                    </span>
                  </div>

                  <div className="text-sky-700 dark:text-sky-400 font-mono text-xs">
                    Hora: <strong className="text-slate-900 dark:text-white">{currentHourlyPoint.hora}</strong> • {Number(currentHourlyPoint.temp).toFixed(1)}°C • {Number(currentHourlyPoint.lluvia).toFixed(1)} mm lluvia
                  </div>
                </div>

                {/* Slider interactivo continuo */}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="range"
                    min="0"
                    max={Math.max(1, hourlyList.length - 1)}
                    value={timelineIndex}
                    onChange={(e) => setTimelineIndex(parseInt(e.target.value))}
                    className="w-full h-2 bg-crisis-950 rounded-lg appearance-none cursor-pointer accent-sky-400 border border-slate-700"
                  />
                </div>

                {/* Marcas horarias fijas (cada 3 horas) */}
                <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
                  {hourlyList
                    .filter((_, idx) => idx % 3 === 0)
                    .map((h, i) => (
                      <span
                        key={i}
                        onClick={() => {
                          const originalIdx = hourlyList.findIndex((p) => p.hora === h.hora);
                          if (originalIdx !== -1) setTimelineIndex(originalIdx);
                        }}
                        className={`cursor-pointer hover:text-white transition font-medium ${
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
      </div>

      {/* MODAL CREAR HOSPITAL / BOMBEROS (EXCLUSIVO ADMINISTRADOR) */}
      {showCreateInfraModal && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {infraForm.tipo === 'HOSPITAL' ? (
                  <HeartPulse className="w-5 h-5 text-red-500" />
                ) : (
                  <Flame className="w-5 h-5 text-amber-500" />
                )}
                <span>Registrar {infraForm.tipo === 'HOSPITAL' ? 'Nuevo Hospital' : 'Nueva Estación de Bomberos'}</span>
              </h3>
              <button
                onClick={() => setShowCreateInfraModal(false)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInfraestructura} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Tipo de Infraestructura</label>
                  <select
                    value={infraForm.tipo}
                    onChange={(e) => setInfraForm({ ...infraForm, tipo: e.target.value })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="HOSPITAL">🏥 Hospital / Centro Médico</option>
                    <option value="BOMBEROS">🚒 Cuerpo de Bomberos</option>
                    <option value="POLICIA">👮 Policía / Puesto de Auxilio</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Capacidad de Atención</label>
                  <input
                    type="number"
                    min="1"
                    value={infraForm.capacidad_atencion}
                    onChange={(e) => setInfraForm({ ...infraForm, capacidad_atencion: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Nombre Oficial *</label>
                <input
                  type="text"
                  required
                  placeholder={infraForm.tipo === 'HOSPITAL' ? 'ej: Hospital General Delfina Torres' : 'ej: Estación de Bomberos San Rafael'}
                  value={infraForm.nombre}
                  onChange={(e) => setInfraForm({ ...infraForm, nombre: e.target.value })}
                  className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Teléfono de Contacto</label>
                  <input
                    type="text"
                    placeholder="ej: 062723000"
                    value={infraForm.telefono_contacto}
                    onChange={(e) => setInfraForm({ ...infraForm, telefono_contacto: e.target.value })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Responsable a Cargo</label>
                  <input
                    type="text"
                    placeholder="ej: Dr. Roberto Estupiñán"
                    value={infraForm.contacto_responsable}
                    onChange={(e) => setInfraForm({ ...infraForm, contacto_responsable: e.target.value })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Dirección / Sector</label>
                <input
                  type="text"
                  placeholder="ej: Av. Libertad y Calle 10, Sector Centro"
                  value={infraForm.direccion}
                  onChange={(e) => setInfraForm({ ...infraForm, direccion: e.target.value })}
                  className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Latitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={infraForm.lat}
                    onChange={(e) => setInfraForm({ ...infraForm, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Longitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={infraForm.lon}
                    onChange={(e) => setInfraForm({ ...infraForm, lon: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateInfraModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-white font-bold rounded-lg shadow transition active:scale-95 flex items-center gap-1.5 ${
                    infraForm.tipo === 'HOSPITAL' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar en Base de Datos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </ErrorBoundary>
  );
};
export default CrisisRoomPage;
