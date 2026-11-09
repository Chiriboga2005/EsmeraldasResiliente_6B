"""
Módulo 6: Funcionalidad 1 - Análisis de Registros Históricos de Eventos Adversos
Hackathon Esmeraldas Resiliente 2026
"""

import os
import pandas as pd
import numpy as np

class HistoricalAnalyzer:
    def __init__(self, data_path=None):
        if data_path is None:
            data_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "historico_inundaciones_esmeraldas.csv")
        self.data_path = os.path.abspath(data_path)
        self.df = pd.read_csv(self.data_path)

    def resumen_global(self):
        """Retorna indicadores agregados y estadísticas descriptivas de los registros históricos."""
        total_eventos = int(len(self.df))
        total_afectados = int(self.df["familias_afectadas"].sum())
        total_atrapados = int(self.df["personas_atrapadas"].sum())
        total_colapsadas = int(self.df["viviendas_colapsadas"].sum())
        
        lluvia_max = float(round(self.df["lluvia_acumulada_24h_mm"].max(), 1))
        lluvia_media = float(round(self.df["lluvia_acumulada_24h_mm"].mean(), 1))
        nivel_rio_max = float(round(self.df["nivel_rio_m"].max(), 2))
        
        anios_registrados = sorted(int(a) for a in self.df["anio"].unique())
        
        # Eventos por tipo
        por_tipo = self.df["tipo_evento"].value_counts().to_dict()
        
        # Eventos por fase El Niño
        por_nino = self.df["fase_el_nino"].value_counts().to_dict()
        
        # Eventos por prioridad
        por_prioridad = self.df["prioridad_triage"].value_counts().to_dict()

        return {
            "total_eventos": total_eventos,
            "periodo_anios": f"{min(anios_registrados)} - {max(anios_registrados)}",
            "total_familias_afectadas": total_afectados,
            "total_personas_rescatadas_atrapadas": total_atrapados,
            "viviendas_con_danos_severos": total_colapsadas,
            "precipitacion_maxima_24h_mm": lluvia_max,
            "precipitacion_promedio_24h_mm": lluvia_media,
            "nivel_rio_maximo_m": nivel_rio_max,
            "distribucion_tipo_evento": por_tipo,
            "distribucion_fase_el_nino": por_nino,
            "distribucion_prioridad": por_prioridad
        }

    def serie_temporal_anual(self):
        """Agrupación anual de incidentes y precipitación media."""
        agrupado = self.df.groupby("anio").agg(
            total_eventos=("id_evento", "count"),
            familias_afectadas=("familias_afectadas", "sum"),
            personas_atrapadas=("personas_atrapadas", "sum"),
            lluvia_promedio=("lluvia_acumulada_24h_mm", "mean"),
            lluvia_maxima=("lluvia_acumulada_24h_mm", "max")
        ).reset_index()

        resultado = []
        for _, row in agrupado.iterrows():
            resultado.append({
                "anio": int(row["anio"]),
                "total_eventos": int(row["total_eventos"]),
                "familias_afectadas": int(row["familias_afectadas"]),
                "personas_atrapadas": int(row["personas_atrapadas"]),
                "lluvia_promedio": round(float(row["lluvia_promedio"]), 1),
                "lluvia_maxima": round(float(row["lluvia_maxima"]), 1)
            })
        return resultado

    def top_eventos_catastroficos(self, top_n=8):
        """Eventos individuales de mayor impacto histórico."""
        # Se calcula un índice de gravedad histórica
        df_sorted = self.df.sort_values(
            by=["personas_atrapadas", "familias_afectadas", "lluvia_acumulada_24h_mm"],
            ascending=False
        ).head(top_n)

        registros = []
        for _, r in df_sorted.iterrows():
            registros.append({
                "id_evento": r["id_evento"],
                "fecha": r["fecha"],
                "sector": r["sector"],
                "tipo_evento": r["tipo_evento"],
                "lluvia_24h_mm": float(r["lluvia_acumulada_24h_mm"]),
                "nivel_rio_m": float(r["nivel_rio_m"]),
                "personas_atrapadas": int(r["personas_atrapadas"]),
                "familias_afectadas": int(r["familias_afectadas"]),
                "infraestructura": r["infraestructura_afectada"],
                "fase_nino": r["fase_el_nino"],
                "prioridad": r["prioridad_triage"]
            })
        return registros
