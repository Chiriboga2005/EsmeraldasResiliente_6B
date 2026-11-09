"""
Módulo 6: Funcionalidad 3 - Clasificación y Priorización Automática de Incidentes con ML
Hackathon Esmeraldas Resiliente 2026
"""

import os
import joblib
import numpy as np

class IncidentMLClassifier:
    def __init__(self, models_dir=None):
        if models_dir is None:
            models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models")
        self.models_dir = os.path.abspath(models_dir)
        self.model = None
        self.scaler = None
        self.encoder = None
        self._cargar_modelos()

    def _cargar_modelos(self):
        try:
            model_path = os.path.join(self.models_dir, "modelo_priorizacion_incidentes.joblib")
            scaler_path = os.path.join(self.models_dir, "scaler_features.joblib")
            encoder_path = os.path.join(self.models_dir, "encoder_labels.joblib")

            if os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(encoder_path):
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                self.encoder = joblib.load(encoder_path)
            else:
                print("Modelos no encontrados en ml_models, ejecutando entrenamiento preventivo...")
                from ml_models.train_models import entrenar_modelo
                entrenar_modelo()
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                self.encoder = joblib.load(encoder_path)
        except Exception as e:
            print(f"Advertencia al cargar modelo ML: {e}")

    def clasificar_incidente(self, datos_incidente):
        """
        Clasifica un incidente individual reportado por ciudadanía o COE.
        Entrada: diccionario con datos climáticos y humanos.
        """
        # Extraer variables con valores por defecto inteligentes
        lluvia = float(datos_incidente.get("lluvia_acumulada_24h_mm", datos_incidente.get("lluvia_24h_mm", 80.0)))
        nivel_rio = float(datos_incidente.get("nivel_rio_m", 2.0))
        humedad = float(datos_incidente.get("humedad_suelo_pct", 75.0))
        pendiente = float(datos_incidente.get("pendiente_terreno_grados", 4.0))
        distancia_cauce = float(datos_incidente.get("distancia_cauce_m", 80.0))
        vuln = float(datos_incidente.get("vulnerabilidad_base", 0.85))
        atrapados = int(datos_incidente.get("personas_atrapadas", 0))
        afectados = int(datos_incidente.get("familias_afectadas", 1))
        colapsadas = int(datos_incidente.get("viviendas_colapsadas", 0))

        vector = np.array([[
            lluvia, nivel_rio, humedad, pendiente, distancia_cauce,
            vuln, atrapados, afectados, colapsadas
        ]])

        if self.model is not None and self.scaler is not None and self.encoder is not None:
            vector_scaled = self.scaler.transform(vector)
            pred_code = self.model.predict(vector_scaled)[0]
            prioridad = str(self.encoder.inverse_transform([pred_code])[0])
            probas = self.model.predict_proba(vector_scaled)[0]
            clases = list(self.encoder.classes_)
            distribucion_prob = {
                cls: round(float(prob) * 100, 1)
                for cls, prob in zip(clases, probas)
            }
        else:
            # Fallback heurístico multi-criterio si no está cargado el binario
            score_heuristico = (lluvia / 200.0) * 30 + (nivel_rio / 4.5) * 30 + (atrapados * 2) + vuln * 20
            if score_heuristico > 65 or atrapados > 2:
                prioridad = "CRITICA"
            elif score_heuristico > 45:
                prioridad = "ALTA"
            elif score_heuristico > 25:
                prioridad = "MEDIA"
            else:
                prioridad = "BAJA"
            distribucion_prob = {prioridad: 95.0}

        # Cálculo de Score de Triage Numérico (0 a 100)
        triage_score = min(100.0, round(
            (atrapados * 3.5) +
            (min(afectados, 150) * 0.25) +
            (colapsadas * 4.0) +
            (min(lluvia, 200.0) / 200.0 * 20) +
            (min(nivel_rio, 4.5) / 4.5 * 25) +
            (vuln * 15), 1
        ))

        # Recomendación operativa de respuesta táctica
        if prioridad == "CRITICA":
            recomendacion = (
                "DESPACHO INMEDIATO CÓDIGO ROJO: Movilizar botes fluviales de rescate (Bomberos/Armada), "
                "activar ambulancias y triage médico, habilitar evacuación helitransportada si hay aislamiento vial."
            )
            color = "#dc2626"
            orden_prioridad = 1
        elif prioridad == "ALTA":
            recomendacion = (
                "DESPACHO CÓDIGO NARANJA: Enviar brigadas de evaluación rápida, kits de raciones y agua segura, "
                "habilitar cupos prioritarios en el albergue temporal más cercano."
            )
            color = "#ea580c"
            orden_prioridad = 2
        elif prioridad == "MEDIA":
            recomendacion = (
                "ATENCIÓN CÓDIGO AMARILLO: Inspección técnica de drenajes y taludes, monitoreo hidrológico en tiempo real, "
                "entrega de kits de asistencia humanitaria dentro de 12 horas."
            )
            color = "#eab308"
            orden_prioridad = 3
        else:
            recomendacion = (
                "MONITOREO CÓDIGO VERDE: Mantener vigilancia comunitaria y registro en el padrón preventivo."
            )
            color = "#22c55e"
            orden_prioridad = 4

        return {
            "id": datos_incidente.get("id", "INC-NUEVO"),
            "sector": datos_incidente.get("sector", "Sector no especificado"),
            "canton": datos_incidente.get("canton", "Esmeraldas"),
            "tipo_evento": datos_incidente.get("tipo_evento", "Inundación"),
            "descripcion": datos_incidente.get("descripcion", ""),
            "prioridad_ml": prioridad,
            "orden_prioridad": orden_prioridad,
            "triage_score": triage_score,
            "color_prioridad": color,
            "probabilidades_por_clase_pct": distribucion_prob,
            "recomendacion_operativa": recomendacion,
            "personas_atrapadas": atrapados,
            "familias_afectadas": afectados,
            "nivel_rio_m": nivel_rio,
            "lluvia_24h_mm": lluvia
        }

    def clasificar_lote(self, lista_incidentes):
        """Clasifica y ordena una lista de incidentes según su prioridad y score de triage."""
        resultados = [self.clasificar_incidente(inc) for inc in lista_incidentes]
        # Ordenar por orden de prioridad (1 más urgente) y luego por triage_score descendente
        resultados.sort(key=lambda r: (r["orden_prioridad"], -r["triage_score"]))
        return resultados
