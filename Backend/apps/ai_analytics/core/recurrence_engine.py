"""
Módulo 6: Funcionalidad 2 - Identificación de Sectores con Recurrencia de Inundaciones
Hackathon Esmeraldas Resiliente 2026
"""

import os
import csv
from collections import defaultdict
from .paths import get_data_path

class RecurrenceEngine:
    def __init__(self, data_path=None):
        if data_path is None:
            data_path = get_data_path("historico_inundaciones_esmeraldas.csv")
        self.data_path = os.path.abspath(data_path)
        self.records = []
        self._cargar_datos()

    def _cargar_datos(self):
        with open(self.data_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.records.append({
                    "id_evento": row.get("id_evento"),
                    "anio": int(row.get("anio", 2023)),
                    "sector": row.get("sector"),
                    "canton": row.get("canton"),
                    "latitud": float(row.get("latitud", 0.0)),
                    "longitud": float(row.get("longitud", 0.0)),
                    "cauce_relacionado": row.get("cauce_relacionado", "Río Teaone"),
                    "vulnerabilidad_base": float(row.get("vulnerabilidad_base", 0.7)),
                    "distancia_cauce_m": float(row.get("distancia_cauce_m", 100.0)),
                    "familias_afectadas": int(row.get("familias_afectadas", 0)),
                    "personas_atrapadas": int(row.get("personas_atrapadas", 0)),
                    "lluvia_acumulada_24h_mm": float(row.get("lluvia_acumulada_24h_mm", 0.0)),
                    "nivel_rio_m": float(row.get("nivel_rio_m", 0.0))
                })

    def calcular_sectores_recurrentes(self):
        anios_totales = max(len(set(r["anio"] for r in self.records)), 1)
        por_sector = defaultdict(list)
        for r in self.records:
            por_sector[r["sector"]].append(r)

        max_eventos = max(len(v) for v in por_sector.values()) if por_sector else 1
        max_familias = max(sum(x["familias_afectadas"] for x in v) for v in por_sector.values()) if por_sector else 1

        sectores = []
        for sec, items in por_sector.items():
            first = items[0]
            total_eventos = len(items)
            anios_afectados = len(set(x["anio"] for x in items))
            total_familias = sum(x["familias_afectadas"] for x in items)
            total_atrapados = sum(x["personas_atrapadas"] for x in items)
            lluvias = [x["lluvia_acumulada_24h_mm"] for x in items]
            rios = [x["nivel_rio_m"] for x in items]

            frecuencia_anual = total_eventos / float(anios_totales)
            periodo_retorno = round(1.0 / max(frecuencia_anual, 0.05), 1)

            norm_eventos = (total_eventos / max_eventos) * 35.0
            norm_impacto = (total_familias / max_familias) * 25.0
            norm_vuln = first["vulnerabilidad_base"] * 25.0
            norm_prox = max(0.0, (1.0 - (first["distancia_cauce_m"] / 600.0))) * 15.0

            indice = round(norm_eventos + norm_impacto + norm_vuln + norm_prox, 1)

            if indice >= 75.0:
                nivel = "CRÍTICO"
                color = "#dc2626"
                alerta = "Evacuación inmediata y defensas fluviales"
            elif indice >= 55.0:
                nivel = "ALTO"
                color = "#ea580c"
                alerta = "Alerta naranja recurrente, dragado y monitoreo de riberas"
            elif indice >= 35.0:
                nivel = "MEDIO"
                color = "#d97706"
                alerta = "Limpieza de alcantarillado pluvial y canales"
            else:
                nivel = "BAJO"
                color = "#16a34a"
                alerta = "Monitoreo preventivo estándar"

            sectores.append({
                "sector": sec,
                "canton": first["canton"],
                "latitud": round(sum(x["latitud"] for x in items) / total_eventos, 5),
                "longitud": round(sum(x["longitud"] for x in items) / total_eventos, 5),
                "cauce_relacionado": first["cauce_relacionado"],
                "distancia_cauce_m": first["distancia_cauce_m"],
                "total_eventos": total_eventos,
                "anios_afectados": anios_afectados,
                "total_familias_afectadas": total_familias,
                "promedio_familias_por_evento": round(total_familias / total_eventos, 1),
                "total_personas_atrapadas": total_atrapados,
                "lluvia_promedio_mm": round(sum(lluvias) / total_eventos, 1),
                "nivel_rio_promedio_m": round(sum(rios) / total_eventos, 2),
                "periodo_retorno_estimado_anios": periodo_retorno,
                "indice_recurrencia": indice,
                "nivel_riesgo": nivel,
                "color_badge": color,
                "accion_recomendada": alerta
            })

        return sorted(sectores, key=lambda s: s["indice_recurrencia"], reverse=True)
