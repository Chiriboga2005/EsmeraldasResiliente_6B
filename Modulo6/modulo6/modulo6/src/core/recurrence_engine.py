"""
Módulo 6: Funcionalidad 2 - Identificación de Sectores con Recurrencia de Inundaciones
Hackathon Esmeraldas Resiliente 2026
"""

import os
import pandas as pd
import numpy as np

class RecurrenceEngine:
    def __init__(self, data_path=None):
        if data_path is None:
            data_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "historico_inundaciones_esmeraldas.csv")
        self.data_path = os.path.abspath(data_path)
        self.df = pd.read_csv(self.data_path)

    def calcular_sectores_recurrentes(self):
        """Calcula el índice de recurrencia multivariable para cada sector vulnerado."""
        anios_totales = self.df["anio"].nunique()
        
        agrupado = self.df.groupby("sector").agg(
            canton=("canton", "first"),
            latitud=("latitud", "mean"),
            longitud=("longitud", "mean"),
            cauce=("cauce_relacionado", "first"),
            vulnerabilidad_base=("vulnerabilidad_base", "first"),
            distancia_cauce_m=("distancia_cauce_m", "first"),
            total_eventos=("id_evento", "count"),
            anios_afectados=("anio", "nunique"),
            total_familias_afectadas=("familias_afectadas", "sum"),
            promedio_familias=("familias_afectadas", "mean"),
            total_atrapados=("personas_atrapadas", "sum"),
            lluvia_promedio=("lluvia_acumulada_24h_mm", "mean"),
            nivel_rio_promedio=("nivel_rio_m", "mean")
        ).reset_index()

        max_eventos = agrupado["total_eventos"].max()
        max_familias = agrupado["total_familias_afectadas"].max()

        sectores = []
        for _, row in agrupado.iterrows():
            frecuencia_anual = row["total_eventos"] / float(anios_totales)
            periodo_retorno_anios = round(1.0 / max(frecuencia_anual, 0.05), 1)

            # Normalizaciones para el índice compuesto (0 a 100)
            norm_eventos = (row["total_eventos"] / max_eventos) * 35.0
            norm_impacto = (row["total_familias_afectadas"] / max_familias) * 25.0
            norm_vuln = float(row["vulnerabilidad_base"]) * 25.0
            # Mayor riesgo cuanto más cerca del cauce
            norm_proximidad = max(0, (1.0 - (row["distancia_cauce_m"] / 600.0))) * 15.0

            indice_recurrencia = round(norm_eventos + norm_impacto + norm_vuln + norm_proximidad, 1)

            if indice_recurrencia >= 75.0:
                nivel_riesgo = "CRÍTICO"
                color_badge = "#dc2626"
                alerta_recomendada = "Evacuación inmediata y defensas fluviales"
            elif indice_recurrencia >= 55.0:
                nivel_riesgo = "ALTO"
                color_badge = "#ea580c"
                alerta_recomendada = "Monitoreo permanente y preparación de albergues"
            elif indice_recurrencia >= 35.0:
                nivel_riesgo = "MEDIO"
                color_badge = "#eab308"
                alerta_recomendada = "Alerta temprana comunitaria y limpieza de drenajes"
            else:
                nivel_riesgo = "BAJO"
                color_badge = "#22c55e"
                alerta_recomendada = "Monitoreo preventivo rutinario"

            sectores.append({
                "sector": row["sector"],
                "canton": row["canton"],
                "cauce_principal": row["cauce"],
                "latitud": round(float(row["latitud"]), 5),
                "longitud": round(float(row["longitud"]), 5),
                "distancia_cauce_m": int(row["distancia_cauce_m"]),
                "vulnerabilidad_base": round(float(row["vulnerabilidad_base"]), 2),
                "total_eventos_historicos": int(row["total_eventos"]),
                "anios_con_inundacion": int(row["anios_afectados"]),
                "frecuencia_eventos_por_anio": round(float(frecuencia_anual), 2),
                "periodo_retorno_estimado_anios": periodo_retorno_anios,
                "total_familias_afectadas": int(row["total_familias_afectadas"]),
                "total_personas_atrapadas": int(row["total_atrapados"]),
                "promedio_familias_por_evento": round(float(row["promedio_familias"]), 1),
                "indice_recurrencia": indice_recurrencia,
                "nivel_riesgo_recurrente": nivel_riesgo,
                "color_badge": color_badge,
                "accion_recomendada": alerta_recomendada
            })

        # Ordenar por índice de recurrencia de mayor a menor
        sectores.sort(key=lambda s: s["indice_recurrencia"], reverse=True)
        return sectores
