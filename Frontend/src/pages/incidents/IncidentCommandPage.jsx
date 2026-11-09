import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  MapPin, 
  Users, 
  Flame, 
  Radio, 
  Search, 
  Filter, 
  Send, 
  Plus, 
  Eye, 
  Trash2,
  BellRing,
  HelpCircle,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const IncidentCommandPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [incidentes, setIncidentes] = useState([]);
  const [kpis, setKpis] = useState({
    total: 0,
    pendientes: 0,
    en_proceso: 0,
    atendidos: 0,
    descartados: 0,
    criticos: 0,
    personas_atrapadas: 0,
    familias_afectadas: 0,
    tasa_resolucion: 0
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('TODOS'); // 'TODOS' | 'PENDIENTE' | 'EN_PROCESO' | 'ATENDIDO' | 'DESCARTADO'
  const [gravityFilter, setGravityFilter] = useState('TODAS'); // 'TODAS' | 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO'
  const [originFilter, setOriginFilter] = useState('TODOS'); // 'TODOS' | 'CIUDADANO' | 'SIMULACION'
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Alerta Sectorial
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [sectorAlert, setSectorAlert] = useState({
    sector: '50 Casas / Ribera del Río Teaone',
    nivel: 'ROJA',
    tipo: 'DESBORDE_INMINENTE',
    mensaje: 'Alerta máxima de evacuación inmediata. Se prevé pico de crecida fluvial en las próximas 2 horas.',
    instrucciones: 'Dirigirse a pie hacia el Coliseo Nubia Villacís Díaz o Unidad Educativa Luis Vargas Torres.'
  });
  const [alertSuccess, setAlertSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, kpisRes] = await Promise.allSettled([
        reportsApi.getReportesTabla(),
        reportsApi.getKPIs()
      ]);

      if (listRes.status === 'fulfilled') {
        setIncidentes(listRes.value || []);
      }
      if (kpisRes.status === 'fulfilled') {
        setKpis(kpisRes.value || {});
      }
    } catch (err) {
      console.error('Error cargando incidentes COE:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Actualizar estado de incidente (Workflow Módulo 3)
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await reportsApi.actualizarEstadoReporte(id, { estado: newStatus });
      await loadData();
    } catch (err) {
      alert('Error actualizando estado del incidente: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Confirmas que deseas eliminar permanentemente este incidente del sistema?')) {
      try {
        await reportsApi.eliminarReporte(id);
        await loadData();
      } catch (err) {
        alert('Error eliminando reporte: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleEmitSectorAlert = (e) => {
    e.preventDefault();
    setAlertSuccess(true);
    setTimeout(() => {
      setAlertSuccess(false);
      setShowAlertModal(false);
    }, 2500);
  };

  // Filtrado reactivo en cliente
  const filteredList = incidentes.filter((inc) => {
    if (statusFilter !== 'TODOS' && inc.estado !== statusFilter) return false;
    if (gravityFilter !== 'TODAS' && inc.nivel_gravedad !== gravityFilter) return false;
    if (originFilter === 'CIUDADANO' && inc.es_simulacion) return false;
    if (originFilter === 'SIMULACION' && !inc.es_simulacion) return false;
    if (searchTerm) {
      const matchText = (inc.descripcion + ' ' + inc.tipo_evento + ' ' + inc.usuario_nombre).toLowerCase();
      if (!matchText.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  const getGravedadBadge = (gravedad) => {
    switch (gravedad) {
      case 'CRITICO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">Crítico</span>;
      case 'ALTO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">Alto</span>;
      case 'MEDIO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Medio</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30">Bajo</span>;
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
      case 'EN_PROCESO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" /> En Proceso
          </span>
        );
      case 'ATENDIDO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Atendido
          </span>
        );
      case 'DESCARTADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <XCircle className="w-3 h-3" /> Descartado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* CABECERA PRINCIPAL MÓDULO 3 */}
      <div className="bg-crisis-800 border border-crisis-700 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                Comando COE • Sala de Situación
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                En Vivo (WebSockets)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide mt-1">
              Centro de Operaciones y Gestión de Alertas
            </h1>
            <p className="text-xs text-slate-400">
              Seguimiento unificado de emergencias, clasificación por gravedad y gestión de alertas sectoriales.
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAlertModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 transition active:scale-95"
          >
            <BellRing className="w-4 h-4" />
            <span>Emitir Alerta Sectorial</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-crisis-700 hover:bg-crisis-600 text-slate-300 hover:text-white rounded-xl border border-crisis-600 transition"
            title="Refrescar incidentes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* DASHBOARD DE INDICADORES DE GESTIÓN (KPIS COE) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total */}
        <div className="bg-crisis-800 border border-crisis-700 p-4 rounded-xl shadow space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Incidentes</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white">{kpis.total || 0}</p>
          <span className="text-[10px] text-slate-400 font-medium">100% registros</span>
        </div>

        {/* Pendientes */}
        <div className="bg-crisis-800 border border-amber-500/30 p-4 rounded-xl shadow space-y-1 bg-amber-500/5">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span>Pendientes</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-400">{kpis.pendientes || 0}</p>
          <span className="text-[10px] text-amber-300/80 font-medium">Por asignar auxilio</span>
        </div>

        {/* En Proceso */}
        <div className="bg-crisis-800 border border-sky-500/30 p-4 rounded-xl shadow space-y-1 bg-sky-500/5">
          <div className="flex items-center justify-between text-xs text-sky-400 font-semibold">
            <span>En Proceso</span>
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400">{kpis.en_proceso || 0}</p>
          <span className="text-[10px] text-sky-300/80 font-medium">Equipos en sitio</span>
        </div>

        {/* Atendidos */}
        <div className="bg-crisis-800 border border-emerald-500/30 p-4 rounded-xl shadow space-y-1 bg-emerald-500/5">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>Atendidos</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{kpis.atendidos || 0}</p>
          <span className="text-[10px] text-emerald-300/80 font-medium">{kpis.tasa_resolucion || 0}% resolución</span>
        </div>

        {/* Críticos */}
        <div className="bg-crisis-800 border border-red-500/30 p-4 rounded-xl shadow space-y-1 bg-red-500/5">
          <div className="flex items-center justify-between text-xs text-red-400 font-semibold">
            <span>Nivel Crítico</span>
            <Flame className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-red-400">{kpis.criticos || 0}</p>
          <span className="text-[10px] text-red-300/80 font-medium">Riesgo inminente</span>
        </div>

        {/* Personas / Familias */}
        <div className="bg-crisis-800 border border-crisis-700 p-4 rounded-xl shadow space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Población en Riesgo</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400">
            {kpis.personas_atrapadas || 0} <span className="text-xs font-normal text-slate-400">atrapadas</span>
          </p>
          <span className="text-[10px] text-slate-400 font-medium">{kpis.familias_afectadas || 0} familias afectadas</span>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="bg-crisis-800 border border-crisis-700 p-4 rounded-xl shadow space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Tabs de Estado (Atendidos, Pendientes, En Proceso) */}
          <div className="flex flex-wrap bg-slate-100 dark:bg-crisis-900 p-1 rounded-xl border border-slate-200 dark:border-crisis-700 text-xs gap-1">
            <button
              onClick={() => setStatusFilter('TODOS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                statusFilter === 'TODOS' ? 'bg-sky-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({incidentes.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDIENTE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'PENDIENTE' ? 'bg-amber-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('EN_PROCESO')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'EN_PROCESO' ? 'bg-sky-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" /> En Proceso
            </button>
            <button
              onClick={() => setStatusFilter('ATENDIDO')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'ATENDIDO' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Atendidos
            </button>
            <button
              onClick={() => setStatusFilter('DESCARTADO')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'DESCARTADO' ? 'bg-slate-700 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" /> Descartados
            </button>
          </div>

          {/* Buscador */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por sector, evento o detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-crisis-900 border border-slate-300 dark:border-crisis-600 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Filtros secundarios: Gravedad y Origen */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-crisis-700/80 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filtrar por:
          </span>

          <select
            value={gravityFilter}
            onChange={(e) => setGravityFilter(e.target.value)}
            className="bg-crisis-900 border border-crisis-600 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="TODAS">Toda Gravedad</option>
            <option value="CRITICO">Crítico</option>
            <option value="ALTO">Alto</option>
            <option value="MEDIO">Medio</option>
            <option value="BAJO">Bajo</option>
          </select>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="bg-crisis-900 border border-crisis-600 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="TODOS">Todos los Orígenes</option>
            <option value="CIUDADANO">📢 Reporte Ciudadano</option>
            <option value="SIMULACION">🤖 Simulación IA / Pronóstico</option>
          </select>
        </div>
      </div>

      {/* LISTADO DE SEGUIMIENTO DE INCIDENTES */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 bg-crisis-800 rounded-2xl border border-crisis-700 space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-sky-400 animate-spin" />
            <p className="text-xs text-slate-400">Cargando incidentes y estadísticas del COE...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 bg-crisis-800 rounded-2xl border border-crisis-700 space-y-2">
            <FileCheck className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-bold text-white">No hay incidentes con los filtros seleccionados.</p>
            <p className="text-xs text-slate-400">Intenta cambiar los filtros de estado o la búsqueda.</p>
          </div>
        ) : (
          filteredList.map((inc) => (
            <div
              key={inc.id}
              className="bg-crisis-800 border border-crisis-700 hover:border-slate-500 rounded-xl p-4 sm:p-5 transition shadow-lg space-y-3"
            >
              {/* Fila Superior: Badges y Fecha */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {getEstadoBadge(inc.estado)}
                  {getGravedadBadge(inc.nivel_gravedad)}

                  {inc.es_simulacion ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      🤖 Simulación IA COE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      📢 Reporte Ciudadano Verificado
                    </span>
                  )}

                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {inc.id.substring(0, 8)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  {new Date(inc.fecha_incidente).toLocaleString()}
                </div>
              </div>

              {/* Contenido Central: Tipo y Descripción */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 space-y-1.5">
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{inc.tipo_evento.replace(/_/g, ' ')}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {inc.descripcion}
                  </p>

                  {inc.estimacion_danos_vivienda && (
                    <p className="text-[11px] text-slate-400 italic">
                      Danos reportados: {inc.estimacion_danos_vivienda}
                    </p>
                  )}
                </div>

                {/* Métricas del Incidente */}
                <div className="bg-slate-50 dark:bg-crisis-900/80 p-3 rounded-xl border border-slate-200 dark:border-crisis-700 text-xs space-y-1.5 shadow-sm">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                    <span>Personas atrapadas:</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{inc.personas_atrapadas}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                    <span>Familias afectadas:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{inc.familias_afectadas}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[10px] pt-1.5 border-t border-slate-200 dark:border-crisis-700">
                    <span>Informante:</span>
                    <span className="truncate max-w-[120px] font-semibold">{inc.usuario_nombre}</span>
                  </div>
                </div>
              </div>

              {/* Barra de Acciones y Transición de Estados (Workflow COE) */}
              <div className="pt-3 border-t border-crisis-700/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/')}
                    className="px-2.5 py-1 text-xs text-sky-400 hover:text-white hover:bg-crisis-700 rounded-lg border border-sky-500/30 flex items-center gap-1.5 transition"
                    title="Ver coordenadas en el mapa satelital"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Ver en Mapa</span>
                  </button>
                </div>

                {/* Botones de Cambio de Estado (Módulo 3) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {inc.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => handleUpdateStatus(inc.id, 'EN_PROCESO')}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Despachar / En Proceso</span>
                    </button>
                  )}

                  {inc.estado === 'EN_PROCESO' && (
                    <button
                      onClick={() => handleUpdateStatus(inc.id, 'ATENDIDO')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marcar Atendido</span>
                    </button>
                  )}

                  {inc.estado === 'ATENDIDO' && (
                    <button
                      onClick={() => handleUpdateStatus(inc.id, 'EN_PROCESO')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reabrir Caso</span>
                    </button>
                  )}

                  {inc.estado !== 'DESCARTADO' && (
                    <button
                      onClick={() => handleUpdateStatus(inc.id, 'DESCARTADO')}
                      className="px-2.5 py-1.5 rounded-lg bg-crisis-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-crisis-600 text-xs transition"
                      title="Descartar reporte no verificado o duplicado"
                    >
                      Descartar
                    </button>
                  )}

                  {/* Eliminar (Admin) */}
                  <button
                    onClick={() => handleDelete(inc.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-crisis-700 rounded-lg transition"
                    title="Eliminar reporte de la base de datos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE EMISIÓN DE ALERTA SECTORIAL (MÓDULO 3) */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-black text-sm uppercase">
                <BellRing className="w-5 h-5 animate-bounce" />
                <span>Emisor de Alerta Temprana Sectorial</span>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {alertSuccess ? (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center space-y-2 text-emerald-300">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="font-bold text-sm">¡Alerta Difundida con Éxito!</p>
                <p className="text-xs">Notificación enviada a la Red de Respuesta y Módulo de Monitoreo.</p>
              </div>
            ) : (
              <form onSubmit={handleEmitSectorAlert} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold">Sector o Barrio Afectado</label>
                  <input
                    type="text"
                    required
                    value={sectorAlert.sector}
                    onChange={(e) => setSectorAlert({ ...sectorAlert, sector: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold">Nivel de Alerta</label>
                    <select
                      value={sectorAlert.nivel}
                      onChange={(e) => setSectorAlert({ ...sectorAlert, nivel: e.target.value })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    >
                      <option value="ROJA">🔴 ALERTA ROJA (Evacuación)</option>
                      <option value="NARANJA">🟠 ALERTA NARANJA (Preparación)</option>
                      <option value="AMARILLA">🟡 ALERTA AMARILLA (Monitoreo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold">Tipo de Amenaza</label>
                    <select
                      value={sectorAlert.tipo}
                      onChange={(e) => setSectorAlert({ ...sectorAlert, tipo: e.target.value })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    >
                      <option value="DESBORDE_INMINENTE">Desborde Fluvial Río Teaone</option>
                      <option value="DESLIZAMIENTO_MASIVO">Deslizamiento de Talud</option>
                      <option value="LLUVIA_TORRENCIAL">Precipitación Crítica &gt;100mm</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold">Mensaje Oficial a la Población</label>
                  <textarea
                    rows="2"
                    required
                    value={sectorAlert.mensaje}
                    onChange={(e) => setSectorAlert({ ...sectorAlert, mensaje: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold">Instrucciones de Evacuación / Albergue Asignado</label>
                  <textarea
                    rows="2"
                    required
                    value={sectorAlert.instrucciones}
                    onChange={(e) => setSectorAlert({ ...sectorAlert, instrucciones: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAlertModal(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Transmitir Alerta</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
export default IncidentCommandPage;

