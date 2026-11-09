"""
API RESTful y Servidor Web del Módulo 6: Inteligencia Artificial y Análisis Predictivo
Hackathon Esmeraldas Resiliente 2026 - UTLVTE
"""

import os
import json
from flask import Flask, request, jsonify, render_template, send_from_directory
from src.core.historical_analyzer import HistoricalAnalyzer
from src.core.recurrence_engine import RecurrenceEngine
from src.core.ml_classifier import IncidentMLClassifier
from src.core.trend_analyzer import TrendAnalyzer
from src.core.geo_temporal_patterns import GeoTemporalPatternAnalyzer
from src.core.risk_scenario_simulator import RiskScenarioSimulator

app = Flask(
    __name__,
    template_folder=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "templates")),
    static_folder=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static"))
)

# Instanciación de componentes analíticos
historical_svc = HistoricalAnalyzer()
recurrence_svc = RecurrenceEngine()
ml_classifier_svc = IncidentMLClassifier()
trend_svc = TrendAnalyzer()
geo_temporal_svc = GeoTemporalPatternAnalyzer()
scenario_sim_svc = RiskScenarioSimulator()

AVISO_CIENTIFICO_OFICIAL = (
    "Rigor Científico: Modelos analíticos y algoritmos de Machine Learning desarrollados en Python "
    "con Scikit-learn (UTLVTE 2026). Los resultados son experimentales y orientados al apoyo en la "
    "toma de decisiones del COE Cantonal y Bomberos; no sustituyen los boletines ni pronósticos "
    "oficiales del INAMHI o de la Secretaría Nacional de Gestión de Riesgos (SNGRE)."
)

def api_response(data=None, error=None, status_code=200):
    payload = {
        "modulo": "Módulo 6: Inteligencia Artificial y Análisis Predictivo",
        "reto": "Esmeraldas Resiliente 2026",
        "aviso_rigor_cientifico": AVISO_CIENTIFICO_OFICIAL,
        "exito": error is None
    }
    if error:
        payload["error"] = error
    if data is not None:
        payload["datos"] = data
    return jsonify(payload), status_code

# ================= RUTAS WEB (DASHBOARD) =================

@app.route("/")
def dashboard():
    return render_template("index.html")

# ================= RUTAS API RESTFUL =================

@app.route("/api/v1/health", methods=["GET"])
def health_check():
    return api_response({
        "estado": "ACTIVO Y OPERATIVO",
        "version": "1.0.0",
        "framework_ml": "Scikit-learn 1.9.1 / Python 3.13",
        "componentes_activos": [
            "1. Análisis de registros históricos",
            "2. Identificación de sectores con recurrencia",
            "3. Clasificación y priorización automática ML",
            "4. Análisis de tendencias y efecto El Niño",
            "5. Patrones geográficos (DBSCAN) y temporales",
            "6. Estimación de escenarios hidrológicos de riesgo"
        ]
    })

@app.route("/api/v1/resumen-historico", methods=["GET"])
def obtener_resumen_historico():
    resumen = historical_svc.resumen_global()
    series = historical_svc.serie_temporal_anual()
    top_eventos = historical_svc.top_eventos_catastroficos()
    return api_response({
        "resumen_general": resumen,
        "serie_anual": series,
        "eventos_historicos_criticos": top_eventos
    })

@app.route("/api/v1/sectores-recurrentes", methods=["GET"])
def obtener_sectores_recurrentes():
    sectores = recurrence_svc.calcular_sectores_recurrentes()
    return api_response({
        "total_sectores_evaluados": len(sectores),
        "sectores_recurrentes": sectores
    })

@app.route("/api/v1/tendencias", methods=["GET"])
def obtener_tendencias():
    mensual = trend_svc.tendencias_mensuales()
    interanual = trend_svc.tendencia_interanual_y_pendiente()
    return api_response({
        "estacionalidad_mensual": mensual,
        "tendencia_interanual_el_nino": interanual
    })

@app.route("/api/v1/patrones-geotemporales", methods=["GET"])
def obtener_patrones_geotemporales():
    clusters = geo_temporal_svc.obtener_clusters_geograficos()
    horario = geo_temporal_svc.distribucion_temporal_horaria()
    return api_response({
        "hotspots_clusters_dbscan": clusters,
        "patron_horario_24h": horario
    })

@app.route("/api/v1/metricas-modelo", methods=["GET"])
def obtener_metricas_modelo():
    metricas_path = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "metricas_modelo.json")
    if os.path.exists(metricas_path):
        with open(metricas_path, "r", encoding="utf-8") as f:
            metricas = json.load(f)
        return api_response(metricas)
    return api_response(error="Métricas de modelo no encontradas. Ejecute el script de entrenamiento.", status_code=404)

@app.route("/api/v1/simular-escenario", methods=["GET"])
def simular_escenario():
    lluvia_param = request.args.get("lluvia_24h", default=120.0, type=float)
    nivel_rio_param = request.args.get("nivel_rio", default=None, type=float)
    resultado = scenario_sim_svc.simular_escenario_precipitacion(lluvia_param, nivel_rio_param)
    return api_response(resultado)

@app.route("/api/v1/escenario-oficial-jueves-06am", methods=["GET"])
def obtener_escenario_oficial():
    resultado = scenario_sim_svc.ejecutar_simulacion_oficial_jueves_06am()
    return api_response(resultado)

@app.route("/api/v1/clasificar-incidente", methods=["POST"])
def clasificar_incidente_endpoint():
    datos = request.get_json(silent=True)
    if not datos:
        return api_response(error="Cuerpo JSON no proporcionado o inválido.", status_code=400)
    resultado = ml_classifier_svc.clasificar_incidente(datos)
    return api_response(resultado)

@app.route("/api/v1/priorizar-lote", methods=["POST"])
def priorizar_lote_endpoint():
    datos = request.get_json(silent=True)
    if not datos or not isinstance(datos, list):
        return api_response(error="Se esperaba una lista JSON de incidentes.", status_code=400)
    resultado = ml_classifier_svc.clasificar_lote(datos)
    return api_response({
        "total_incidentes_priorizados": len(resultado),
        "incidentes_ordenados": resultado
    })

@app.route("/data/<path:filename>")
def servir_datos(filename):
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
    return send_from_directory(data_dir, filename)

if __name__ == "__main__":
    puerto = int(os.environ.get("PORT", 5050))
    print(f"Iniciando Servidor Web Módulo 6 en http://localhost:5000")
    app.run(host="0.0.0.0", port=puerto, debug=False)
