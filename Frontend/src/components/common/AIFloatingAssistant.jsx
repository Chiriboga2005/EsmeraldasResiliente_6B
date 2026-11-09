import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  History, 
  Trash2, 
  ShieldAlert, 
  RefreshCw, 
  BrainCircuit, 
  ChevronRight, 
  HelpCircle,
  MessageSquare,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { aiApi } from '../../api/aiApi';

export const AIFloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'history'
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: '👋 ¡Hola! Soy el **Asistente de Inteligencia Artificial del COE Cantonal**.\n\nPuedes consultarme sobre **simulaciones de desborde del Río Teaone**, **índice de recurrencia por sectores**, **clasificación de triage con Scikit-learn** o **tendencias del Fenómeno El Niño**.\n\n*Todas tus consultas se almacenan en el historial de la base de datos PostgreSQL.*',
      categoria: 'GENERAL',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, activeTab]);

  // Cargar historial de la base de datos al abrir o cambiar de tab
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await aiApi.getHistorial();
      setHistoryList(data);
    } catch (err) {
      console.error('Error cargando historial de IA:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadHistory();
    }
  }, [isOpen, activeTab]);

  const handleSend = async (questionText = null) => {
    const textToSend = questionText || inputQuestion;
    if (!textToSend.trim() || loading) return;

    // Agregar mensaje del usuario a la vista
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await aiApi.consultar(textToSend);
      const aiMsg = {
        id: res.id || `ai-${Date.now()}`,
        sender: 'ai',
        text: res.respuesta,
        categoria: res.categoria,
        datos: res.datos_contexto,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error al consultar IA:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: '⚠️ Ocurrió un error al procesar la consulta con los modelos analíticos. Por favor, reintenta en unos instantes.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('¿Deseas vaciar el historial de consultas almacenado en la base de datos?')) {
      try {
        await aiApi.borrarHistorial();
        setHistoryList([]);
      } catch (err) {
        console.error('Error borrando historial:', err);
      }
    }
  };

  const quickPrompts = [
    { label: '🌊 Simulación Teaone (120 mm)', prompt: 'Simular crecida del Rio Teaone con 120 mm de lluvia' },
    { label: '📍 Sectores con más recurrencia', prompt: '¿Cuáles son los sectores con mayor recurrencia histórica de inundaciones?' },
    { label: '🤖 Triage ML (Derrumbe)', prompt: 'Clasificar prioridad de incidente con 3 personas atrapadas y 90 mm de lluvia' },
    { label: '📈 Tendencia Fenómeno El Niño', prompt: '¿Cuál es la tendencia histórica del Fenómeno El Niño en Esmeraldas?' },
  ];

  return (
    <>
      {/* BOTÓN FLOTANTE TRIGGER (FIJO EN ESQUINA INFERIOR DERECHA) */}
      <div className="fixed bottom-3 right-3 z-[1200] flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold rounded-full shadow-2xl shadow-indigo-500/40 border border-white/20 transition-all duration-300 transform hover:scale-105 active:scale-95"
          title="Abrir Asistente de IA Predictiva COE"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>

          <BrainCircuit className="w-4 h-4 text-sky-200 group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-xs tracking-wide font-black uppercase">
            IA Predictiva COE
          </span>
        </button>
      </div>

      {/* VENTANA MODAL / PANEL DE CONSULTAS DE IA */}
      {isOpen && (
        <div className="fixed bottom-16 right-2 sm:right-4 z-[1200] w-[calc(100vw-1rem)] sm:w-[480px] max-h-[82vh] h-[580px] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* HEADER DEL ASISTENTE */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-xs tracking-wide">
                    Asistente de IA • COE Esmeraldas
                  </h3>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-semibold">
                    Scikit-Learn
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Modelos predictivos y análisis de riesgos preventivos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TABS SELECTOR (CHAT VS HISTORIAL EN BD) */}
          <div className="flex bg-slate-950/80 border-b border-slate-800 px-3 pt-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
                activeTab === 'chat'
                  ? 'border-sky-500 text-sky-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Consultas en Vivo</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
                activeTab === 'history'
                  ? 'border-sky-500 text-sky-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial en BD ({historyList.length})</span>
            </button>
          </div>

          {/* CONTENIDO DEL TAB: CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900/60">
              
              {/* LISTA DE MENSAJES */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3 shadow-md whitespace-pre-wrap leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-sky-600 text-white rounded-br-none'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none'
                      }`}
                    >
                      {m.sender === 'ai' && m.categoria && (
                        <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-700/60 text-[10px] text-sky-300 font-mono">
                          <Sparkles className="w-3 h-3 text-sky-400" />
                          <span>Módulo: {m.categoria}</span>
                        </div>
                      )}
                      
                      <div className="text-[12px]">
                        {m.text}
                      </div>

                      <div className={`mt-1.5 text-[9px] text-right ${m.sender === 'user' ? 'text-sky-200' : 'text-slate-400'}`}>
                        {m.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-sky-400 bg-slate-800/60 border border-slate-700 p-2.5 rounded-xl w-fit">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Ejecutando inferencia con Scikit-learn y consultando PostGIS...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* QUICK PROMPTS (PREGUNTAS SUGERIDAS) */}
              <div className="px-3 py-2 bg-slate-950/50 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(qp.prompt)}
                    disabled={loading}
                    className="shrink-0 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 px-2.5 py-1 rounded-full border border-slate-700/80 transition shadow-sm"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* CAJA DE ENTRADA DE CONSULTA */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Pregúntale a la IA (ej: simulación 120mm, sectores en riesgo)..."
                  className="flex-1 bg-slate-800/90 text-white placeholder-slate-400 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 transition"
                  disabled={loading}
                />

                <button
                  onClick={() => handleSend()}
                  disabled={loading || !inputQuestion.trim()}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-md transition"
                  title="Enviar consulta"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* CONTENIDO DEL TAB: HISTORIAL EN BASE DE DATOS */}
          {activeTab === 'history' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900/60 p-3.5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Historial persistido en Aiven Cloud PostgreSQL</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={loadHistory}
                    disabled={loadingHistory}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded border border-slate-700"
                    title="Actualizar historial"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleClearHistory}
                    className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 rounded border border-red-500/20"
                    title="Borrar historial"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 text-xs">
                {historyList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                    <History className="w-8 h-8 mx-auto text-slate-600" />
                    <p>No hay consultas registradas en la base de datos todavía.</p>
                    <p className="text-[11px] text-slate-500">Haz una pregunta en la pestaña de chat para verla guardada aquí.</p>
                  </div>
                ) : (
                  historyList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-1.5 hover:border-slate-600 transition"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-sky-400 uppercase tracking-wider">
                          {item.categoria}
                        </span>
                        <span>{new Date(item.fecha_creacion).toLocaleString()}</span>
                      </div>
                      
                      <p className="font-bold text-white text-xs">
                        {item.pregunta}
                      </p>

                      <div className="text-[11px] text-slate-300 whitespace-pre-wrap bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        {item.respuesta}
                      </div>

                      <button
                        onClick={() => {
                          setActiveTab('chat');
                          handleSend(item.pregunta);
                        }}
                        className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 pt-1 font-semibold"
                      >
                        <span>Re-ejecutar simulación</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
};
export default AIFloatingAssistant;

