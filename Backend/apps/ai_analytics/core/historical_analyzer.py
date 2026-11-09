"""
Módulo 6: Funcionalidad 1 - Análisis de Registros Históricos de Eventos Adversos
Hackathon Esmeraldas Resiliente 2026
"""

import os
import csv
from collections import Counter, defaultdict
from .paths import get_data_path

class HistoricalAnalyzer:
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
                hora_raw = str(row.get("hora_entera") or row.get("hora", "12")).split(":")[0]
                try:
                    hora_val = int(hora_raw)
                except ValueError:
                    hora_val = 12

                self.records.append({
                    "id_evento": row.get("id_evento"),
                    "fecha": row.get("fecha"),
                    "anio": int(row.get("anio", 2023)),
                    "mes": int(row.get("mes", 1)),
                    "hora": hora_val,
                    "sector": row.get("sector"),
                    "canton": row.get("canton"),
                    "latitud": float(row.get("latitud", 0.0)),
                    "longitud": float(row.get("longitud", 0.0)),
                    "tipo_evento": row.get("tipo_evento"),
                    "lluvia_acumulada_24h_mm": float(row.get("lluvia_acumulada_24h_mm", 0.0)),
                    "nivel_rio_m": float(row.get("nivel_rio_m", 0.0)),
                    "humedad_suelo_pct": float(row.get("humedad_suelo_pct", 0.0)),
                    "familias_afectadas": int(row.get("familias_afectadas", 0)),
                    "personas_atrapadas": int(row.get("personas_atrapadas", 0)),
                    "viviendas_colapsadas": int(row.get("viviendas_colapsadas", 0)),
                    "vulnerabilidad_base": float(row.get("vulnerabilidad_base", 0.5)),
                    "distancia_cauce_m": float(row.get("distancia_cauce_m", 100.0)),
                    "fase_el_nino": row.get("fase_el_nino", "NEUTRO"),
                    "prioridad_triage": row.get("prioridad_triage", "MEDIA")
                })

    def resumen_global(self):
        total_eventos = len(self.records)
        total_afectados = sum(r["familias_afectadas"] for r in self.records)
        total_atrapados = sum(r["personas_atrapadas"] for r in self.records)
        total_colapsadas = sum(r["viviendas_colapsadas"] for r in self.records)

        lluvias = [r["lluvia_acumulada_24h_mm"] for r in self.records]
        rios = [r["nivel_rio_m"] for r in self.records]
        anios = sorted(list(set(r["anio"] for r in self.records)))

        por_tipo = dict(Counter(r["tipo_evento"] for r in self.records))
        por_nino = dict(Counter(r["fase_el_nino"] for r in self.records))
        por_prioridad = dict(Counter(r["prioridad_triage"] for r in self.records))

        return {
            "total_eventos": total_eventos,
            "periodo_anios": f"{min(anios)} - {max(anios)}" if anios else "2019 - 2026",
            "total_familias_afectadas": total_afectados,
            "total_personas_rescatadas_atrapadas": total_atrapados,
            "viviendas_con_danos_severos": total_colapsadas,
            "precipitacion_maxima_24h_mm": round(max(lluvias), 1) if lluvias else 0.0,
            "precipitacion_promedio_24h_mm": round(sum(lluvias) / max(len(lluvias), 1), 1),
            "nivel_rio_maximo_m": round(max(rios), 2) if rios else 0.0,
            "distribucion_tipo_evento": por_tipo,
            "distribucion_fase_el_nino": por_nino,
            "distribucion_prioridad": por_prioridad
        }

    def serie_temporal_anual(self):
        por_anio = defaultdict(list)
        for r in self.records:
            por_anio[r["anio"]].append(r)

        series = []
        for anio in sorted(por_anio.keys()):
            items = por_anio[anio]
            lluvias = [it["lluvia_acumulada_24h_mm"] for it in items]
            series.append({
                "anio": anio,
                "total_eventos": len(items),
                "familias_afectadas": sum(it["familias_afectadas"] for it in items),
                "personas_atrapadas": sum(it["personas_atrapadas"] for it in items),
                "lluvia_promedio_mm": round(sum(lluvias) / max(len(lluvias), 1), 1),
                "lluvia_maxima_mm": round(max(lluvias), 1)
            })
        return series

    def top_eventos_catastroficos(self, n=5):
        ordenados = sorted(
            self.records,
            key=lambda x: (x["personas_atrapadas"] * 3 + x["familias_afectadas"] * 2 + x["lluvia_acumulada_24h_mm"]),
            reverse=True
        )
        return ordenados[:n]
