import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Package, 
  Users, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  Boxes 
} from 'lucide-react';
import { humanitarianApi } from '../../api/humanitarianApi';

export const HumanitarianPage = () => {
  const [tab, setTab] = useState('censo'); // 'censo' o 'suministros'
  const [familias, setFamilias] = useState([]);
  const [suministros, setSuministros] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulario de censo familiar
  const [nuevoCenso, setNuevoCenso] = useState({
    codigo_censo: `CENSO-ESM-${Math.floor(1000 + Math.random() * 9000)}`,
    jefe_familia_nombre: '',
    jefe_familia_cedula: '',
    telefono_contacto: '',
    parroquia: '50 Casas',
    barrio_sector: 'Ribera del Teaone',
    numero_integrantes: 4,
    ninos_menores_5: 1,
    adultos_mayores: 0,
    personas_discapacidad: 0,
    danos_vivienda: 'TOTAL',
    requiere_evacuacion_inmediata: true,
  });

  const [censoGuardado, setCensoGuardado] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.allSettled([
        humanitarianApi.getCensoFamilias(),
        humanitarianApi.getSuministros(),
      ]);
      if (fRes.status === 'fulfilled') setFamilias(fRes.value || []);
      if (sRes.status === 'fulfilled') setSuministros(sRes.value || []);
    } catch (err) {
      console.error('Error cargando asistencia humanitaria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitCenso = async (e) => {
    e.preventDefault();
    try {
      await humanitarianApi.crearCensoFamilia(nuevoCenso);
      setCensoGuardado(true);
      loadData();
      setTimeout(() => setCensoGuardado(false), 4000);
      setNuevoCenso({
        codigo_censo: `CENSO-ESM-${Math.floor(1000 + Math.random() * 9000)}`,
        jefe_familia_nombre: '',
        jefe_familia_cedula: '',
        telefono_contacto: '',
        parroquia: '50 Casas',
        barrio_sector: 'Ribera del Teaone',
        numero_integrantes: 4,
        ninos_menores_5: 1,
        adultos_mayores: 0,
        personas_discapacidad: 0,
        danos_vivienda: 'TOTAL',
        requiere_evacuacion_inmediata: true,
      });
    } catch (err) {
      alert('Error guardando la ficha censal: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Cabecera y Selector de Pestañas */}
      <div className="bg-crisis-800 border border-crisis-700 p-5 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <HeartHandshake className="w-6 h-6 text-sky-400" />
            Asistencia Humanitaria y Censo de Damnificados
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ficha censal de hogares afectados, vulnerabilidad familiar y control de suministros en bodega.
          </p>
        </div>

        <div className="flex bg-crisis-900 p-1 rounded-lg border border-crisis-700">
          <button
            onClick={() => setTab('censo')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'censo'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Ficha Censal
          </button>
          <button
            onClick={() => setTab('suministros')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'suministros'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" /> Bodegas & Kits
          </button>
        </div>
      </div>

      {censoGuardado && (
        <div className="p-3.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Ficha de censo registrada correctamente en el padrón humanitario.</span>
        </div>
      )}

      {tab === 'censo' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Levantamiento Censal */}
          <form
            onSubmit={handleSubmitCenso}
            className="lg:col-span-2 bg-crisis-800 border border-crisis-700 rounded-xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-crisis-700 pb-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Nueva Ficha Familiar
              </span>
              <span className="text-xs font-mono text-slate-400">
                {nuevoCenso.codigo_censo}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  Nombre Jefe de Hogar
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: María Elena Bone"
                  value={nuevoCenso.jefe_familia_nombre}
                  onChange={(e) => setNuevoCenso({ ...nuevoCenso, jefe_familia_nombre: e.target.value })}
                  className="w-full mt-1 bg-crisis-900 border border-crisis-600 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  Cédula de Identidad (10 dígitos)
                </label>
                <input
                  type="text"
                  required
                  maxLength="10"
                  placeholder="ej: 0801234567"
                  value={nuevoCenso.jefe_familia_cedula}
                  onChange={(e) => setNuevoCenso({ ...nuevoCenso, jefe_familia_cedula: e.target.value })}
                  className="w-full mt-1 bg-crisis-900 border border-crisis-600 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  Teléfono Celular
                </label>
                <input
                  type="text"
                  placeholder="ej: 0991234567"
                  value={nuevoCenso.telefono_contacto}
                  onChange={(e) => setNuevoCenso({ ...nuevoCenso, telefono_contacto: e.target.value })}
                  className="w-full mt-1 bg-crisis-900 border border-crisis-600 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  Barrio o Sector
                </label>
                <input
                  type="text"
                  value={nuevoCenso.barrio_sector}
                  onChange={(e) => setNuevoCenso({ ...nuevoCenso, barrio_sector: e.target.value })}
                  className="w-full mt-1 bg-crisis-900 border border-crisis-600 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Composición Familiar */}
            <div className="bg-crisis-900/60 p-3 rounded-lg border border-crisis-700 space-y-2">
              <span className="text-xs font-bold text-slate-300">
                Indicadores de Vulnerabilidad en el Hogar
              </span>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400">Total Integrantes</label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoCenso.numero_integrantes}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, numero_integrantes: Number(e.target.value) })}
                    className="w-full mt-1 bg-crisis-800 border border-crisis-600 rounded px-2 py-1 text-xs text-center text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Niños (&lt;5 años)</label>
                  <input
                    type="number"
                    min="0"
                    value={nuevoCenso.ninos_menores_5}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, ninos_menores_5: Number(e.target.value) })}
                    className="w-full mt-1 bg-crisis-800 border border-crisis-600 rounded px-2 py-1 text-xs text-center text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Adultos Mayores</label>
                  <input
                    type="number"
                    min="0"
                    value={nuevoCenso.adultos_mayores}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, adultos_mayores: Number(e.target.value) })}
                    className="w-full mt-1 bg-crisis-800 border border-crisis-600 rounded px-2 py-1 text-xs text-center text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Discapacidad</label>
                  <input
                    type="number"
                    min="0"
                    value={nuevoCenso.personas_discapacidad}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, personas_discapacidad: Number(e.target.value) })}
                    className="w-full mt-1 bg-crisis-800 border border-crisis-600 rounded px-2 py-1 text-xs text-center text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white transition flex items-center justify-center gap-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" /> Registrar Familia Damnificada
            </button>
          </form>

          {/* Resumen Lateral de Familias Censadas */}
          <div className="bg-crisis-800 border border-crisis-700 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              Padrón Censal ({familias.length})
            </h3>
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {familias.length > 0 ? (
                familias.map((f, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-crisis-900 border border-crisis-700 text-xs space-y-1"
                  >
                    <div className="flex justify-between font-semibold text-slate-200">
                      <span>{f.jefe_familia_nombre}</span>
                      <span className="text-[10px] text-sky-400 font-mono">
                        {f.codigo_censo}
                      </span>
                    </div>
                    <p className="text-slate-400">CI: {f.jefe_familia_cedula}</p>
                    <p className="text-[11px] text-slate-500">
                      {f.numero_integrantes} integrantes • {f.barrio_sector}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  No hay familias censadas registradas aún.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Catálogo de Suministros */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {suministros.map((item, idx) => (
            <div
              key={idx}
              className="bg-crisis-800 border border-crisis-700 rounded-xl p-4 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-crisis-700 text-sky-400 border border-slate-600">
                  {item.codigo_sku}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {item.tipo}
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">{item.nombre_suministro}</h4>
              <p className="text-xs text-slate-400">{item.descripcion}</p>
              <div className="pt-2 border-t border-crisis-700 flex justify-between text-xs text-slate-300">
                <span>Unidad: {item.unidad_medida}</span>
                <span className="font-bold">{item.peso_kg} kg</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
