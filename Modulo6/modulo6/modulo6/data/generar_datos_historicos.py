"""
Generador del Dataset Histórico de Eventos Adversos y Fenómeno El Niño
Provincia de Esmeraldas (1997 - 2026)
Reto: Hackathon Esmeraldas Resiliente 2026 - Módulo 6: IA & Analítica
"""

import csv
import random
from datetime import datetime, timedelta

random.seed(42)

SECTORES = [
    {"nombre": "50 Casas", "canton": "Esmeraldas", "lat": 0.9412, "lon": -79.6738, "dist_cauce": 45, "pend": 2.1, "vuln": 0.95, "cauce": "Río Teaone"},
    {"nombre": "La Propicia 1", "canton": "Esmeraldas", "lat": 0.9485, "lon": -79.6672, "dist_cauce": 85, "pend": 3.0, "vuln": 0.88, "cauce": "Río Teaone"},
    {"nombre": "La Propicia 2", "canton": "Esmeraldas", "lat": 0.9440, "lon": -79.6690, "dist_cauce": 60, "pend": 2.5, "vuln": 0.92, "cauce": "Río Teaone"},
    {"nombre": "Isla Luis Vargas Torres", "canton": "Esmeraldas", "lat": 0.9750, "lon": -79.6520, "dist_cauce": 20, "pend": 0.5, "vuln": 0.96, "cauce": "Río Esmeraldas"},
    {"nombre": "Isla Roberto Luis Cervantes", "canton": "Esmeraldas", "lat": 0.9705, "lon": -79.6548, "dist_cauce": 25, "pend": 0.8, "vuln": 0.94, "cauce": "Río Esmeraldas"},
    {"nombre": "San Rafael", "canton": "Esmeraldas", "lat": 0.9380, "lon": -79.6785, "dist_cauce": 120, "pend": 4.5, "vuln": 0.82, "cauce": "Río Teaone"},
    {"nombre": "Barrio Bellavista", "canton": "Esmeraldas", "lat": 0.9610, "lon": -79.6640, "dist_cauce": 350, "pend": 24.0, "vuln": 0.85, "cauce": "Quebrada La Gata"},
    {"nombre": "Mina de Piedra", "canton": "Esmeraldas", "lat": 0.9535, "lon": -79.6610, "dist_cauce": 420, "pend": 28.5, "vuln": 0.87, "cauce": "Talud Centro"},
    {"nombre": "Tabiazo", "canton": "Esmeraldas (Rural)", "lat": 0.8870, "lon": -79.7120, "dist_cauce": 70, "pend": 5.0, "vuln": 0.78, "cauce": "Río Teaone"},
    {"nombre": "Carlos Concha", "canton": "Esmeraldas (Rural)", "lat": 0.8120, "lon": -79.6890, "dist_cauce": 90, "pend": 6.2, "vuln": 0.74, "cauce": "Río Teaone Alto"},
    {"nombre": "Vuelta Larga", "canton": "Esmeraldas (Rural)", "lat": 0.9130, "lon": -79.6950, "dist_cauce": 110, "pend": 4.0, "vuln": 0.80, "cauce": "Río Teaone"},
    {"nombre": "Tachina", "canton": "Esmeraldas (Rural)", "lat": 0.9850, "lon": -79.6380, "dist_cauce": 180, "pend": 3.8, "vuln": 0.65, "cauce": "Río Esmeraldas"},
    {"nombre": "Vía E15 Sur (El Cabre)", "canton": "Atacames", "lat": 0.8650, "lon": -79.8210, "dist_cauce": 500, "pend": 32.0, "vuln": 0.89, "cauce": "Talud Costero"},
    {"nombre": "Tonchigüe", "canton": "Atacames", "lat": 0.8010, "lon": -79.9850, "dist_cauce": 150, "pend": 3.2, "vuln": 0.72, "cauce": "Río Tonchigüe"},
    {"nombre": "Viche", "canton": "Quinindé", "lat": 0.6540, "lon": -79.5420, "dist_cauce": 130, "pend": 4.1, "vuln": 0.70, "cauce": "Río Esmeraldas / Viche"}
]

ANIO_CONFIGS = [
    (1997, 1998, "El Niño Extraordinario", 1.8),
    (2002, 2003, "El Niño Moderado", 1.2),
    (2008, 2008, "Evento Invernal Fuerte", 1.3),
    (2015, 2016, "El Niño Fuerte + Sismo", 1.7),
    (2019, 2019, "Inviernos Atípicos", 1.1),
    (2023, 2023, "Gran Inundación Junio 2023", 2.2),
    (2024, 2024, "El Niño 2024", 1.4),
    (2025, 2025, "Lluvias Estacionales", 1.0),
    (2026, 2026, "El Niño 2026 (Simulación y Actual)", 1.9),
]

def generar_dataset(n_registros=1200, filename="data/historico_inundaciones_esmeraldas.csv"):
    registros = []
    
    for i in range(n_registros):
        config = random.choice(ANIO_CONFIGS)
        anio_inicio, anio_fin, fase_nino, factor_severidad = config
        anio = random.randint(anio_inicio, anio_fin)
        
        # En Esmeraldas, las lluvias e inundaciones se concentran fuertemente de enero a mayo (y eventos extremos en junio)
        mes_pesos = [0.12, 0.22, 0.25, 0.20, 0.12, 0.05, 0.01, 0.005, 0.005, 0.01, 0.01, 0.04]
        mes = random.choices(range(1, 13), weights=mes_pesos)[0]
        dia = random.randint(1, 28)
        
        # Horas pico de tormentas tropicales: madrugada (02:00 - 07:00) y tarde-noche (17:00 - 21:00)
        hora_pesos = [0.03, 0.06, 0.10, 0.14, 0.16, 0.12, 0.07, 0.04, 0.02, 0.02, 0.02, 0.02,
                      0.02, 0.02, 0.03, 0.04, 0.05, 0.06, 0.06, 0.05, 0.04, 0.03, 0.02, 0.02]
        hora = random.choices(range(24), weights=hora_pesos)[0]
        minuto = random.choice([0, 15, 30, 45])
        fecha_str = f"{anio:04d}-{mes:02d}-{dia:02d}"
        hora_str = f"{hora:02d}:{minuto:02d}"
        
        sector = random.choice(SECTORES)
        
        # Variables hidrometeorológicas
        lluvia_base = random.expovariate(1 / 40.0) + 5.0
        lluvia_24h = round(min(lluvia_base * factor_severidad, 245.0), 1)
        
        # Nivel de río Teaone (m) - normal 1.2m, alerta 2.5m, desbordamiento 3.2m+
        if "Teaone" in sector["cauce"]:
            nivel_rio = round(0.9 + (lluvia_24h / 190.0) * 2.8 + random.uniform(-0.25, 0.35), 2)
            nivel_rio = max(0.6, min(nivel_rio, 4.6))
        else:
            nivel_rio = round(1.6 + (lluvia_24h / 200.0) * 3.6 + random.uniform(-0.3, 0.4), 2)
            nivel_rio = max(1.2, min(nivel_rio, 6.2))
            
        humedad_suelo = round(min(45.0 + (lluvia_24h / 2.5) + random.uniform(0, 15), 99.5), 1)
        
        # Tipo de evento según topografía y distancia al cauce
        if sector["pend"] > 18.0:
            tipo_evento = "Deslizamiento de Tierra" if lluvia_24h > 65 else "Socavamiento de Talud"
        elif sector["dist_cauce"] <= 100 and nivel_rio >= (2.8 if "Teaone" in sector["cauce"] else 4.8):
            tipo_evento = "Desbordamiento de Río"
        elif "Vía" in sector["nombre"]:
            tipo_evento = "Vía Interrumpida"
        else:
            tipo_evento = "Inundación Urbana"
            
        # Impacto humano y afectación
        score_impacto = (
            (lluvia_24h / 220.0) * 35 +
            (nivel_rio / 4.5) * 30 +
            sector["vuln"] * 25 +
            (humedad_suelo / 100.0) * 10
        )
        
        if score_impacto > 68:
            prioridad = "CRITICA"
            atrapados = random.randint(3, 35)
            afectados = random.randint(40, 280)
            colapsadas = random.randint(1, 12)
            infra = random.choice(["Puente Afectado", "Escuela Inundada", "Centro de Salud Amenazado", "Vía Principal Cortada"])
        elif score_impacto > 50:
            prioridad = "ALTA"
            atrapados = random.randint(0, 5)
            afectados = random.randint(15, 65)
            colapsadas = random.randint(0, 3)
            infra = random.choice(["Vía Secundaria Bloqueada", "Red Eléctrica Dañada", "Alcantarillado Colapsado", "Ninguna"])
        elif score_impacto > 36:
            prioridad = "MEDIA"
            atrapados = 0
            afectados = random.randint(3, 20)
            colapsadas = 0
            infra = "Ninguna"
        else:
            prioridad = "BAJA"
            atrapados = 0
            afectados = random.randint(0, 4)
            colapsadas = 0
            infra = "Ninguna"
            
        registros.append({
            "id_evento": f"ESM-{anio}-{i+1:04d}",
            "fecha": fecha_str,
            "hora": hora_str,
            "mes": mes,
            "hora_entera": hora,
            "anio": anio,
            "canton": sector["canton"],
            "sector": sector["nombre"],
            "latitud": sector["lat"] + round(random.uniform(-0.003, 0.003), 5),
            "longitud": sector["lon"] + round(random.uniform(-0.003, 0.003), 5),
            "tipo_evento": tipo_evento,
            "cauce_relacionado": sector["cauce"],
            "lluvia_acumulada_24h_mm": lluvia_24h,
            "nivel_rio_m": nivel_rio,
            "humedad_suelo_pct": humedad_suelo,
            "pendiente_terreno_grados": sector["pend"],
            "distancia_cauce_m": sector["dist_cauce"],
            "vulnerabilidad_base": sector["vuln"],
            "personas_atrapadas": atrapados,
            "familias_afectadas": afectados,
            "viviendas_colapsadas": colapsadas,
            "infraestructura_afectada": infra,
            "fase_el_nino": fase_nino,
            "prioridad_triage": prioridad
        })
        
    # Ordenar por fecha cronológica
    registros.sort(key=lambda r: (r["fecha"], r["hora"]))
    
    with open(filename, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(registros[0].keys()))
        writer.writeheader()
        writer.writerows(registros)
        
    print(f"Dataset generado con éxito: {len(registros)} registros en {filename}")

if __name__ == "__main__":
    generar_dataset()
