import React, { useState } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Camera, 
  Send, 
  CheckCircle2, 
  WifiOff, 
  Users, 
  AlertCircle 
} from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';
import { useOffline } from '../../context/OfflineContext';

export const CitizenReportPage = () => {
  const { isOnline, saveReportOffline } = useOffline();

  const [formData, setFormData] = useState({
    tipo_evento: 'INUNDACION',
    nivel_gravedad: 'MEDIO',
    descripcion: '',
    personas_atrapadas: 0,
    familias_afectadas: 1,
    lat: '',
    lng: '',
  });

  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Captura GPS del navegador móvil
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Error GPS:', err);
        // Coordenadas aproximadas de Esmeraldas si el usuario deniega GPS
        setFormData((prev) => ({
          ...prev,
          lat: '0.968200',
          lng: '-79.651700',
        }));
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lat || !formData.lng) {
      alert('Por favor captura o ingresa las coordenadas GPS del incidente.');
      return;
    }
    setSubmitting(true);
    setStatusMessage(null);

    const payload = {
      tipo_evento: formData.tipo_evento,
      nivel_gravedad: formData.nivel_gravedad,
      descripcion: formData.descripcion,
      personas_atrapadas: Number(formData.personas_atrapadas),
      familias_afectadas: Number(formData.familias_afectadas),
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
    };

    if (isOnline) {
      try {
        const body = new FormData();
        Object.keys(payload).forEach((key) => body.append(key, payload[key]));
        if (foto) body.append('foto', foto);

        await reportsApi.crearReporte(body);
        setStatusMessage({
          type: 'success',
          text: '¡Reporte enviado exitosamente a la sala de crisis del COE!',
        });
        resetForm();
      } catch (err) {
        console.warn('Error enviando reporte online, guardando en Dexie offline:', err);
        await saveReportOffline(payload);
        setStatusMessage({
          type: 'offline',
          text: 'Fallo de conexión. Tu reporte se guardó de forma segura en tu teléfono (Modo Offline) y se sincronizará automáticamente al detectar internet.',
        });
        resetForm();
      }
    } else {
      // Modo offline directo
      await saveReportOffline(payload);
      setStatusMessage({
        type: 'offline',
        text: 'Sin señal de internet. El reporte se guardó localmente en la memoria del dispositivo y se enviará tan pronto recuperes red celular.',
      });
      resetForm();
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      tipo_evento: 'INUNDACION',
      nivel_gravedad: 'MEDIO',
      descripcion: '',
      personas_atrapadas: 0,
      familias_afectadas: 1,
      lat: '',
      lng: '',
    });
    setFoto(null);
    setFotoPreview(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Cabecera Móvil */}
      <div className="bg-crisis-800 border border-crisis-700 p-4 rounded-xl flex items-start justify-between shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Reporte Comunitario de Incidentes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Alerta en tiempo real sobre inundaciones, deslaves o emergencias en tu sector.
          </p>
        </div>
        {!isOnline && (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <WifiOff className="w-3.5 h-3.5" /> Offline Listo
          </span>
        )}
      </div>

      {/* Mensaje de Estado */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <WifiOff className="w-5 h-5 shrink-0" />
          )}
          <p className="text-xs leading-relaxed">{statusMessage.text}</p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-crisis-800 border border-crisis-700 rounded-xl p-5 space-y-4 shadow-xl">
        {/* Tipo de Evento */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
            Tipo de Evento o Amenaza
          </label>
          <select
            value={formData.tipo_evento}
            onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
            className="w-full bg-crisis-900 border border-crisis-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="INUNDACION">Inundación / Desbordamiento de Río</option>
            <option value="DESLIZAMIENTO">Deslizamiento / Derrumbe en Ladera</option>
            <option value="COLAPSO_ESTRUCTURAL">Colapso Estructural de Vivienda</option>
            <option value="VIA_CORTADA">Corte o Bloqueo Vial</option>
            <option value="OTRO">Otra Emergencia</option>
          </select>
        </div>

        {/* Nivel de Gravedad */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
            Nivel de Gravedad Percibido
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'BAJO', label: 'Bajo', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
              { id: 'MEDIO', label: 'Medio', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
              { id: 'ALTO', label: 'Alto', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
              { id: 'CRITICO', label: 'Crítico', color: 'border-red-500/40 text-red-400 bg-red-500/10' },
            ].map((g) => (
              <button
                type="button"
                key={g.id}
                onClick={() => setFormData({ ...formData, nivel_gravedad: g.id })}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  formData.nivel_gravedad === g.id
                    ? `${g.color} ring-2 ring-sky-500/40`
                    : 'border-crisis-600 text-slate-400 bg-crisis-900 hover:bg-crisis-700'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Geolocalización GPS */}
        <div className="bg-crisis-900/60 p-3.5 rounded-lg border border-crisis-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-400" />
              Ubicación GPS del Incidente
            </span>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={gpsLoading}
              className="text-xs font-medium px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 transition flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              {gpsLoading ? 'Obteniendo GPS...' : 'Usar mi GPS Actual'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400">Latitud</label>
              <input
                type="text"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                placeholder="ej: 0.968200"
                className="w-full mt-1 bg-crisis-800 border border-crisis-600 rounded px-2.5 py-1.5 text-xs text-slate-200"
                required
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">Longitud</label>
              <input
                type="text"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                placeholder="ej: -79.651700"
                className="w-full mt-1 bg-crisis-800 border border-crisis-600 rounded px-2.5 py-1.5 text-xs text-slate-200"
                required
              />
            </div>
          </div>
        </div>

        {/* Daños y Personas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-sky-400" /> Familias Afectadas
            </label>
            <input
              type="number"
              min="0"
              value={formData.familias_afectadas}
              onChange={(e) => setFormData({ ...formData, familias_afectadas: e.target.value })}
              className="w-full mt-1 bg-crisis-900 border border-crisis-600 rounded-lg px-3 py-1.5 text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Personas Atrapadas
            </label>
            <input
              type="number"
              min="0"
              value={formData.personas_atrapadas}
              onChange={(e) => setFormData({ ...formData, personas_atrapadas: e.target.value })}
              className="w-full mt-1 bg-crisis-900 border border-crisis-600 rounded-lg px-3 py-1.5 text-sm text-slate-200"
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
            Descripción de lo que está sucediendo
          </label>
          <textarea
            rows="3"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Describa el nivel de agua, si hay postes caídos o personas requiriendo auxilio..."
            className="w-full bg-crisis-900 border border-crisis-600 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            required
          ></textarea>
        </div>

        {/* Captura de Foto */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
            Evidencia Fotográfica (Opcional)
          </label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-crisis-600 hover:border-sky-500/50 rounded-xl p-4 cursor-pointer bg-crisis-900/40 transition">
            <Camera className="w-6 h-6 text-slate-400 mb-1" />
            <span className="text-xs text-slate-300">
              {foto ? foto.name : 'Tomar foto o subir imagen'}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFotoChange}
              className="hidden"
            />
          </label>
          {fotoPreview && (
            <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-crisis-600">
              <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-500 font-bold text-white transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 text-sm"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Enviando...' : isOnline ? 'Transmitir Reporte al COE' : 'Guardar Reporte en Memoria Offline'}
        </button>
      </form>
    </div>
  );
};

