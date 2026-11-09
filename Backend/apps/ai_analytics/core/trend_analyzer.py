"""
Módulo 6: Funcionalidad 4 - Análisis de Tendencias a partir de Datos Disponibles
Hackathon Esmeraldas Resiliente 2026
"""

import os
import csv
from collections import defaultdict
from .paths import get_data_path

class TrendAnalyzer:
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
                    "anio": int(row.get("anio", 2023)),
                    "mes": int(row.get("mes", 1)),
                    "lluvia_acumulada_24h_mm": float(row.get("lluvia_acumulada_24h_mm", 0.0)),
                    "familias_afectadas": int(row.get("familias_afectadas", 0)),
                    "fase_el_nino": row.get("fase_el_nino", "NEUTRO")
                })

    def tendencias_mensuales(self):
        nombres_meses = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ]
        por_mes = defaultdict(list)
        for r in self.records:
            por_mes[r["mes"]].append(r)

        resultados = []
        for m in range(1, 13):
            items = por_mes.get(m, [])
            total_eventos = len(items)
            total_familias = sum(x["familias_afectadas"] for x in items)
            lluvias = [x["lluvia_acumulada_24h_mm"] for x in items]
            prom_lluvia = round(sum(lluvias) / max(len(lluvias), 1), 1)
            estacion = "Estación Lluviosa (Alta Peligrosidad)" if m in [1, 2, 3, 4, 5] else "Estación Seca / Transición"

            resultados.append({
                "numero_mes": m,
                "nombre_mes": nombres_meses[m - 1],
                "total_eventos": total_eventos,
                "familias_afectadas": total_familias,
                "lluvia_promedio_mm": prom_lluvia,
                "clasificacion_estacional": estacion
            })
        return resultados

    def tendencia_interanual_y_pendiente(self):
        por_anio = defaultdict(list)
        for r in self.records:
            por_anio[r["anio"]].append(r)

        anios = sorted(por_anio.keys())
        totales = [len(por_anio[a]) for a in anios]

        # Regresión lineal simple: y = m*x + b
        n = len(anios)
        if n > 1:
            mean_x = sum(anios) / n
            mean_y = sum(totales) / n
            numerador = sum((anios[i] - mean_x) * (totales[i] - mean_y) for i in range(n))
            denominador = sum((anios[i] - mean_x) ** 2 for i in range(n))
            pendiente = round(numerador / denominador, 2) if denominador != 0 else 0.0
        else:
            pendiente = 0.0

        nino_count = sum(1 for r in self.records if r["fase_el_nino"] in ["EL_NINO", "EL NINO"])
        neutro_count = sum(1 for r in self.records if r["fase_el_nino"] == "NEUTRO")
        factor_nino = round(max(nino_count, 1) / max(neutro_count, 1), 2)

        return {
            "periodo_analizado": f"{min(anios)} - {max(anios)}" if anios else "2019-2026",
            "pendiente_tendencia_anual": pendiente,
            "interpretacion_tendencia": "Creciente" if pendiente > 0 else "Estable",
            "factor_multiplicador_el_nino": factor_nino,
            "resumen_anual": [{"anio": a, "total_eventos": len(por_anio[a])} for a in anios]
        }
