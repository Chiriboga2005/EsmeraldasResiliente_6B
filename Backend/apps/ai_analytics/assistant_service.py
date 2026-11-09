import re
from .models import ConsultaIA
from .core.historical_analyzer import HistoricalAnalyzer
from .core.recurrence_engine import RecurrenceEngine
from .core.ml_classifier import IncidentMLClassifier
from .core.trend_analyzer import TrendAnalyzer
from .core.geo_temporal_patterns import GeoTemporalPatternAnalyzer
from .core.risk_scenario_simulator import RiskScenarioSimulator

# Inicializar servicios en memoria (Singleton)
_historical = None
_recurrence = None
_classifier = None
_trend = None
_geo_temporal = None
_simulator = None

def get_services():
    global _historical, _recurrence, _classifier, _trend, _geo_temporal, _simulator
    if _historical is None:
        _historical = HistoricalAnalyzer()
        _recurrence = RecurrenceEngine()
        _classifier = IncidentMLClassifier()
        _trend = TrendAnalyzer()
        _geo_temporal = GeoTemporalPatternAnalyzer()
        _simulator = RiskScenarioSimulator()
    return _historical, _recurrence, _classifier, _trend, _geo_temporal, _simulator

DISCLAIMER = (
    "\n\n*Nota de Rigor Científico (UTLVTE 2026): Modelos analíticos desarrollados con Python y Scikit-learn. "
    "Resultados experimentales de soporte a la toma de decisiones que no sustituyen pronósticos del INAMHI/SNGR.*"
)

class AIAssistantService:
    @classmethod
    def procesar_consulta(cls, pregunta: str, usuario=None):
        q = pregunta.lower().strip()
        hist, rec, clf, trd, geo, sim = get_services()
        categoria = "GENERAL"
        datos_contexto = {}

        # 1. INTENCIÓN: Simulación de Lluvias / Escenarios de Inundación / Río Teaone
        if any(w in q for w in ['simula', 'crecida', 'escenario', 'desborde', 'teaone', 'río', 'rio', '120', 'caudal']):
            categoria = "SIMULACION"
            # Extraer mm de lluvia si se menciona
            match_lluvia = re.search(r'(\d+)\s*(mm|milimetros|milímetros)?', q)
            lluvia = float(match_lluvia.group(1)) if match_lluvia else 120.0
            
            res_sim = sim.simular_escenario_precipitacion(lluvia_24h_mm=lluvia)
            datos_contexto = res_sim
            
            top_afectados = res_sim.get("sectores", [])[:4]
            sectores_txt = "\n".join([
                f"- **{s['sector']}**: {s['familias_en_riesgo_estimadas']} familias en riesgo ({s['nivel_riesgo']}) - Probabilidad: {s['probabilidad_inundacion_pct']}% - Refugio sugerido: {s.get('albergue_sugerido', 'Coliseo')}"
                for s in top_afectados
            ])

            params = res_sim.get("parametros_simulacion", {})
            impacto = res_sim.get("resumen_impacto", {})

            respuesta = (
                f"🌊 **Simulación Hidrológica para {lluvia} mm de lluvia en 24h:**\n\n"
                f"- **Nivel proyectado Río Teaone:** `{params.get('nivel_rio_teaone_m')} m` (Cota de desbordamiento: 3.2 m).\n"
                f"- **Impacto territorial global:** {impacto.get('total_familias_en_riesgo', 0)} familias en riesgo alto/extremo ({impacto.get('sectores_riesgo_extremo', 0)} sectores en alerta roja).\n"
                f"- **Sectores con mayor compromiso fluvial:**\n{sectores_txt}\n\n"
                f"**Recomendación COE:** Activar sirenas de alerta temprana en la cuenca baja del Teaone y preparar albergues de concentración en cotas altas."
                + DISCLAIMER
            )

        # 2. INTENCIÓN: Recurrencia / Zonas más peligrosas / Sectores vulnerables
        elif any(w in q for w in ['recurrencia', 'sector', 'sectores', 'peligros', 'vulnerab', 'crítico', 'critico', 'frecuente']):
            categoria = "RECURRENCIA"
            sectores = rec.calcular_sectores_recurrentes()
            datos_contexto = {"sectores": sectores[:6]}
            
            top_rec = sectores[:4]
            detalles = "\n".join([
                f"- **{s['sector']}** ({s['canton']}): Índice Recurrencia `{s['indice_recurrencia']}/100` [{s['nivel_riesgo']}]. "
                f"Distancia a cauce: {s['distancia_cauce_m']}m • Familias históricas: {s['total_familias_afectadas']}."
                for s in top_rec
            ])

            respuesta = (
                f"📍 **Análisis de Recurrencia Histórica (2019-2026):**\n\n"
                f"Se han identificado los sectores con mayor susceptibilidad hidrometeorológica repetitiva:\n\n"
                f"{detalles}\n\n"
                f"**Acción preventiva:** Priorizar obras de desazolve, muros de escollera y protocolos de evacuación temprana en estos puntos críticos."
                + DISCLAIMER
            )

        # 3. INTENCIÓN: Clasificación de Incidente / Triage ML / Prioridad
        elif any(w in q for w in ['clasifica', 'prioridad', 'triage', 'atrapad', 'derrumbe', 'emergencia']):
            categoria = "CLASIFICACION_ML"
            # Detectar número de atrapados
            match_atrapados = re.search(r'(\d+)\s*(atrapad|persona|victima)', q)
            atrapados = int(match_atrapados.group(1)) if match_atrapados else 2
            
            match_lluvia = re.search(r'(\d+)\s*(mm)?', q)
            lluvia = float(match_lluvia.group(1)) if match_lluvia else 90.0

            datos_test = {
                "lluvia_acumulada_24h_mm": lluvia,
                "personas_atrapadas": atrapados,
                "familias_afectadas": 5,
                "viviendas_colapsadas": 1 if atrapados > 2 else 0,
                "vulnerabilidad_base": 0.85
            }
            res_clf = clf.clasificar_incidente(datos_test)
            datos_contexto = res_clf

            respuesta = (
                f"🤖 **Clasificación y Priorización de Incidente por Scikit-Learn:**\n\n"
                f"- **Prioridad asignada:** `{res_clf.get('prioridad')}` (Código `{res_clf.get('codigo_triage')}`)\n"
                f"- **Score Compuesto de Severidad:** `{res_clf.get('score_severidad')}/100`\n"
                f"- **Confianza del Modelo (Random Forest):** `{res_clf.get('probabilidad_modelo_pct')}%`\n"
                f"- **Acción de Respuesta Inmediata:** {res_clf.get('accion_inmediata')}\n"
                f"- **Recursos a despachar:** {', '.join(res_clf.get('recursos_sugeridos', []))}"
                + DISCLAIMER
            )

        # 4. INTENCIÓN: Tendencias / Fenómeno El Niño / Estacionalidad
        elif any(w in q for w in ['tendencia', 'niño', 'nino', 'clima', 'mes', 'anual', 'histórico', 'historico']):
            categoria = "TENDENCIAS"
            tend = trd.tendencia_interanual_y_pendiente()
            mens = trd.tendencias_mensuales()
            datos_contexto = {"interanual": tend, "mensual": mens[:4]}

            respuesta = (
                f"📈 **Tendencias y Comportamiento del Fenómeno El Niño:**\n\n"
                f"- **Meses críticos de mayor pluviosidad:** Enero, Febrero, Marzo y Abril concentran más del 65% de los desbordamientos.\n"
                f"- **Tendencia interanual estimada:** Pendiente `{tend.get('pendiente_tendencia_anual')}` con factor multiplicador El Niño de `{tend.get('factor_multiplicador_el_nino')}x` en incidentes.\n"
                f"- **Conclusión:** Ante eventos de calentamiento oceánico (ENSO), la provincia de Esmeraldas experimenta un aumento severo en la frecuencia de lluvias convectivas de alta intensidad horaria."
                + DISCLAIMER
            )

        # 5. INTENCIÓN: General / Ayuda
        else:
            categoria = "GENERAL"
            hist_res = hist.resumen_global()
            datos_contexto = hist_res

            respuesta = (
                f"🛡️ **Asistente de IA para Gestión de Riesgos • Esmeraldas Resiliente:**\n\n"
                f"He procesado tu consulta. Puedo asistirte en tiempo real con:\n\n"
                f"1. **Simulaciones Hidrológicas:** Proyectar desbordes del Río Teaone ante umbrales de lluvia (ej. *'Simular crecida con 140 mm'*).\n"
                f"2. **Índice de Recurrencia:** Evaluar los sectores con mayor historial de inundaciones (ej. *'¿Cuáles son los sectores más críticos?'*).\n"
                f"3. **Clasificación Automática de Triage:** Evaluar severidad de incidentes mediante Scikit-learn (ej. *'Clasificar derrumbe con 3 atrapados'*).\n"
                f"4. **Tendencias El Niño:** Estacionalidad y patrones geoespaciales analizados.\n\n"
                f"*Base histórica activa: {hist_res.get('total_eventos', 0)} registros entre {hist_res.get('periodo_anios', '2019-2026')}.*"
                + DISCLAIMER
            )

        # Guardar en base de datos PostgreSQL
        consulta = ConsultaIA.objects.create(
            usuario=usuario if (usuario and usuario.is_authenticated) else None,
            pregunta=pregunta,
            respuesta=respuesta,
            categoria=categoria,
            datos_contexto=datos_contexto,
            es_experimental=True
        )

        return {
            "id": str(consulta.id),
            "pregunta": consulta.pregunta,
            "respuesta": consulta.respuesta,
            "categoria": consulta.categoria,
            "datos_contexto": consulta.datos_contexto,
            "fecha_creacion": consulta.fecha_creacion.isoformat()
        }
