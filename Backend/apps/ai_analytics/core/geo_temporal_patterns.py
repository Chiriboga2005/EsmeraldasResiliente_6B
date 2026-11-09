"""
Módulo 6: Funcionalidad 5 - Identificación de Patrones Geográficos y Temporales
Hackathon Esmeraldas Resiliente 2026
"""

import os
import csv
from collections import Counter, defaultdict
from .paths import get_data_path

class GeoTemporalPatternAnalyzer:
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
                    "sector": row.get("sector"),
                    "hora": hora_val,
                    "latitud": float(row.get("latitud", 0.0)),
                    "longitud": float(row.get("longitud", 0.0)),
                    "familias_afectadas": int(row.get("familias_afectadas", 0))
                })

    def obtener_clusters_geograficos(self):
        # Agrupar puntos por sector como centroides naturales de cluster
        por_sector = defaultdict(list)
        for r in self.records:
            por_sector[r["sector"]].append(r)

        clusters = []
        c_id = 1
        for sec, items in sorted(por_sector.items(), key=lambda x: len(x[1]), reverse=True):
            lat_prom = round(sum(it["latitud"] for it in items) / len(items), 5)
            lon_prom = round(sum(it["longitud"] for it in items) / len(items), 5)
            total_afect = sum(it["familias_afectadas"] for it in items)

            clusters.append({
                "cluster_id": c_id,
                "sector_principal": sec,
                "total_incidentes": len(items),
                "centroide": {"lat": lat_prom, "lon": lon_prom},
                "total_familias_afectadas": total_afect,
                "nivel_peligro": "ZONA ROJA (Hotspot Crítico)" if len(items) > 70 else "ZONA AMARILLA (Vulnerabilidad Media)"
            })
            c_id += 1

        return clusters

    def distribucion_temporal_horaria(self):
        por_hora = Counter(r["hora"] for r in self.records)
        return [
            {"hora": f"{h:02d}:00", "incidentes": por_hora.get(h, 0)}
            for h in range(24)
        ]
