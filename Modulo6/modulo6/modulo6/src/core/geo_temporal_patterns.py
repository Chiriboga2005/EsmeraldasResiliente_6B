"""
Módulo 6: Funcionalidad 5 - Identificación de Patrones Geográficos y Temporales
Hackathon Esmeraldas Resiliente 2026
"""

import os
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN

class GeoTemporalPatternAnalyzer:
    def __init__(self, data_path=None):
        if data_path is None:
            data_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "historico_inundaciones_esmeraldas.csv")
        self.data_path = os.path.abspath(data_path)
        self.df = pd.read_csv(self.data_path)

    def obtener_clusters_geograficos(self):
        """
        Ejecuta clustering espacial no supervisado (DBSCAN) sobre las coordenadas geográficas
        para identificar conglomerados de riesgo y zonas calientes (Hotspots).
        """
        coords = self.df[["latitud", "longitud"]].values
        
        # En coordenadas geográficas, 0.015 grados equivale aproximadamente a ~1.6 km
        db = DBSCAN(eps=0.022, min_samples=25, metric="euclidean")
        labels = db.fit_predict(coords)
        
        df_clusters = self.df.copy()
        df_clusters["cluster"] = labels

        clusters_resumen = []
        # Excluir ruido (-1) o incluirlo como anomalías
        for cluster_id in sorted(df_clusters["cluster"].unique()):
            if cluster_id == -1:
                continue
            
            sub = df_clusters[df_clusters["cluster"] == cluster_id]
            centroide_lat = round(float(sub["latitud"].mean()), 5)
            centroide_lon = round(float(sub["longitud"].mean()), 5)
            sector_mas_frecuente = sub["sector"].mode()[0]
            tipo_dominante = sub["tipo_evento"].mode()[0]
            hora_pico = int(sub["hora_entera"].mode()[0])
            total_incidentes = int(len(sub))
            total_afectados = int(sub["familias_afectadas"].sum())

            # Etiquetar nombres significativos para el COE
            if "Teaone" in str(sub["cauce_relacionado"].values) or "50 Casas" in sector_mas_frecuente:
                nombre_cluster = f"Hotspot {cluster_id + 1}: Cuenca Baja Río Teaone (Sector Urbano-Marginal)"
            elif "Isla" in sector_mas_frecuente:
                nombre_cluster = f"Hotspot {cluster_id + 1}: Zona Insular del Río Esmeraldas"
            elif "Bellavista" in sector_mas_frecuente or "Piedra" in sector_mas_frecuente:
                nombre_cluster = f"Hotspot {cluster_id + 1}: Laderas Inestables y Taludes de Bellavista"
            elif "Vía" in sector_mas_frecuente or "Atacames" in str(sub["canton"].values):
                nombre_cluster = f"Hotspot {cluster_id + 1}: Corredor Vial E15 Sur (Cortes y Deslizamientos)"
            else:
                nombre_cluster = f"Hotspot {cluster_id + 1}: {sector_mas_frecuente}"

            clusters_resumen.append({
                "cluster_id": int(cluster_id),
                "denominacion": nombre_cluster,
                "sector_representativo": sector_mas_frecuente,
                "latitud_centroide": centroide_lat,
                "longitud_centroide": centroide_lon,
                "total_incidentes_historicos": total_incidentes,
                "total_familias_afectadas": total_afectados,
                "tipo_amenaza_dominante": tipo_dominante,
                "hora_pico_ocurrencia": f"{hora_pico:02d}:00 hrs",
                "radio_aproximado_km": 1.8
            })

        # Ordenar por total de incidentes
        clusters_resumen.sort(key=lambda c: c["total_incidentes_historicos"], reverse=True)
        return clusters_resumen

    def distribucion_temporal_horaria(self):
        """
        Analiza las horas de mayor ocurrencia de eventos adversos durante el día.
        """
        agrupado = self.df.groupby("hora_entera").agg(
            total_eventos=("id_evento", "count"),
            personas_atrapadas=("personas_atrapadas", "sum"),
            lluvia_promedio=("lluvia_acumulada_24h_mm", "mean")
        ).reindex(range(24), fill_value=0).reset_index()

        horas = []
        for _, row in agrupado.iterrows():
            h = int(row["hora_entera"])
            es_madrugada = 1 <= h <= 6
            horas.append({
                "hora": h,
                "hora_formato": f"{h:02d}:00",
                "total_eventos": int(row["total_eventos"]),
                "personas_atrapadas": int(row["personas_atrapadas"]),
                "lluvia_promedio_mm": round(float(row["lluvia_promedio"]), 1),
                "es_franja_critica_nocturna": es_madrugada
            })

        # Porcentaje de eventos en madrugada (02:00 - 06:00)
        madrugada_events = sum(h["total_eventos"] for h in horas if 2 <= h["hora"] <= 6)
        total_events = sum(h["total_eventos"] for h in horas)
        pct_madrugada = round((madrugada_events / max(total_events, 1)) * 100, 1)

        return {
            "distribucion_24h": horas,
            "porcentaje_eventos_madrugada": pct_madrugada,
            "patron_temporal_detectado": (
                f"El {pct_madrugada}% de las emergencias críticas por desbordamiento e inundación súbita "
                "se registran entre las 02:00 y las 06:00 AM, momento en el que coincide la marea alta, "
                "el tiempo de concentración de la cuenca del Río Teaone y la población se encuentra durmiendo, "
                "lo cual incrementa exponencialmente el riesgo de personas atrapadas."
            )
        }
