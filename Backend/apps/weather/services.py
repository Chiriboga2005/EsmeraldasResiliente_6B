import requests
from django.conf import settings

# Cantones de la Provincia de Esmeraldas con sus coordenadas representativas
CANTONES_ESMERALDAS = {
    'esmeraldas': {'nombre': 'Esmeraldas (Capital)', 'lat': 0.9681, 'lon': -79.6582},
    'atacames': {'nombre': 'Atacames', 'lat': 0.8667, 'lon': -79.8444},
    'quininde': {'nombre': 'Quinindé (Rosa Zárate)', 'lat': 0.3283, 'lon': -79.4678},
    'san_lorenzo': {'nombre': 'San Lorenzo', 'lat': 1.2869, 'lon': -78.8358},
    'eloy_alfaro': {'nombre': 'Eloy Alfaro (Valdez)', 'lat': 1.2464, 'lon': -78.9839},
    'muisne': {'nombre': 'Muisne', 'lat': 0.6106, 'lon': -80.0197},
    'rioverde': {'nombre': 'Rioverde', 'lat': 1.0744, 'lon': -79.4000},
}

class OpenWeatherService:
    """
    Servicio de integración con la API de OpenWeatherMap.
    Permite obtener métricas en tiempo real de lluvia, viento y temperatura
    para la provincia de Esmeraldas, así como configurar capas para Leaflet.
    """

    @staticmethod
    def get_api_key():
        return getattr(settings, 'OPENWEATHERMAP_API_KEY', '')

    @classmethod
    def obtener_clima_actual(cls, lat=None, lon=None, canton_slug=None):
        """
        Consulta las condiciones meteorológicas actuales para Esmeraldas o cantón específico.
        """
        api_key = cls.get_api_key()
        
        # Determinar coordenadas
        if canton_slug and canton_slug.lower() in CANTONES_ESMERALDAS:
            info = CANTONES_ESMERALDAS[canton_slug.lower()]
            lat, lon = info['lat'], info['lon']
            lugar_nombre = info['nombre']
        else:
            lat = lat or getattr(settings, 'ESMERALDAS_LAT', 0.9681)
            lon = lon or getattr(settings, 'ESMERALDAS_LON', -79.6582)
            lugar_nombre = 'Esmeraldas'

        # Si no hay API key configurada todavía, consultar el servicio libre en vivo Open-Meteo
        if not api_key:
            return cls._obtener_open_meteo_live(lugar_nombre, lat, lon)

        url = f"{settings.OPENWEATHERMAP_BASE_URL}/weather"
        params = {
            'lat': lat,
            'lon': lon,
            'appid': api_key,
            'units': 'metric',
            'lang': 'es'
        }

        try:
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            return cls._procesar_payload_clima(data, lugar_nombre, lat, lon)
        except requests.RequestException as exc:
            # En caso de fallo de red o cuota excedida, retornar fallback seguro
            mock = cls._obtener_mock_clima(lugar_nombre, lat, lon)
            mock['error_red'] = str(exc)
            return mock

    @classmethod
    def _procesar_payload_clima(cls, data, lugar_nombre, lat, lon):
        rain_info = data.get('rain', {})
        lluvia_1h_mm = rain_info.get('1h', 0.0)
        lluvia_3h_mm = rain_info.get('3h', 0.0)
        
        alerta = cls.evaluar_umbral_alerta(lluvia_1h_mm)

        clima = data.get('weather', [{}])[0]
        main = data.get('main', {})
        wind = data.get('wind', {})

        return {
            'lugar': lugar_nombre,
            'coordenadas': {'lat': lat, 'lon': lon},
            'condicion': clima.get('description', 'Despejado').capitalize(),
            'icono': f"https://openweathermap.org/img/wn/{clima.get('icon', '01d')}@2x.png",
            'temperatura_c': round(main.get('temp', 27.0), 1),
            'sensacion_termica_c': round(main.get('feels_like', 28.0), 1),
            'humedad_porcentaje': main.get('humidity', 80),
            'presion_hpa': main.get('pressure', 1010),
            'velocidad_viento_kmh': round(wind.get('speed', 0.0) * 3.6, 1),
            'direccion_viento_grados': wind.get('deg', 0),
            'precipitacion_1h_mm': lluvia_1h_mm,
            'precipitacion_3h_mm': lluvia_3h_mm,
            'nivel_riesgo_hidrologico': alerta['nivel'],
            'mensaje_alerta': alerta['mensaje'],
            'es_simulacion': False
        }

    @staticmethod
    def evaluar_umbral_alerta(lluvia_1h_mm):
        """
        Categoriza el riesgo hidrológico en Esmeraldas según la intensidad de lluvia.
        """
        if lluvia_1h_mm >= 50.0:
            return {
                'nivel': 'CRITICO',
                'mensaje': 'PELIGRO EXTREMO: Desbordamiento inminente de los ríos Teaone y Esmeraldas. Evacuar zonas bajas.'
            }
        elif lluvia_1h_mm >= 30.0:
            return {
                'nivel': 'ALTO',
                'mensaje': 'ALERTA ROJA: Lluvias torrenciales continuas. Monitoreo intensivo de riberas y sectores vulnerables.'
            }
        elif lluvia_1h_mm >= 15.0:
            return {
                'nivel': 'MEDIO',
                'mensaje': 'ALERTA AMARILLA: Precipitaciones moderadas. Posibles anegaciones en calzadas y drenajes pluviales.'
            }
        else:
            return {
                'nivel': 'BAJO',
                'mensaje': 'Condiciones meteorológicas estables o lluvias débiles normales en la región.'
            }

    @classmethod
    def _obtener_open_meteo_live(cls, lugar_nombre, lat, lon):
        """
        Consulta en tiempo real el pronóstico abierto oficial de Open-Meteo
        (sin requerimiento de API Key, rápido y con previsión horaria).
        """
        try:
            url = (
                f"https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}&longitude={lon}"
                f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure"
                f"&hourly=temperature_2m,precipitation,weather_code,wind_speed_10m"
                f"&forecast_days=1&timezone=America%2FGuayaquil"
            )
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                curr = data.get('current', {})
                hourly = data.get('hourly', {})
                wcode = curr.get('weather_code', 0)
                
                desc, icon = cls._mapear_wmo_code(wcode)
                lluvia_mm = curr.get('precipitation', 0.0)
                alerta = cls.evaluar_umbral_alerta(lluvia_mm)

                return {
                    'lugar': lugar_nombre,
                    'coordenadas': {'lat': lat, 'lon': lon},
                    'condicion': desc,
                    'icono': f"https://openweathermap.org/img/wn/{icon}@2x.png",
                    'temperatura_c': round(curr.get('temperature_2m', 29.0), 1),
                    'sensacion_termica_c': round(curr.get('apparent_temperature', 33.0), 1),
                    'humedad_porcentaje': curr.get('relative_humidity_2m', 75),
                    'presion_hpa': round(curr.get('surface_pressure', 1012), 0),
                    'nubosidad_porcentaje': curr.get('cloud_cover', 50),
                    'velocidad_viento_kmh': round(curr.get('wind_speed_10m', 12.0), 1),
                    'direccion_viento_grados': curr.get('wind_direction_10m', 240),
                    'precipitacion_1h_mm': lluvia_mm,
                    'precipitacion_3h_mm': lluvia_mm,
                    'nivel_riesgo_hidrologico': alerta['nivel'],
                    'mensaje_alerta': alerta['mensaje'],
                    'es_simulacion': False,
                    'fuente': 'Open-Meteo & OpenWeatherMap Live',
                    'prevision_horaria': [
                        {
                            'hora': hourly['time'][i][-5:],
                            'temp': hourly['temperature_2m'][i],
                            'lluvia': hourly['precipitation'][i],
                            'codigo': hourly['weather_code'][i]
                        }
                        for i in range(min(24, len(hourly.get('time', []))))
                    ]
                }
        except Exception:
            pass
        return cls._obtener_mock_clima(lugar_nombre, lat, lon)

    @staticmethod
    def _mapear_wmo_code(code):
        if code == 0:
            return "Cielo despejado", "01d"
        elif code in (1, 2):
            return "Parcialmente nublado", "02d"
        elif code == 3:
            return "Nublado", "03d"
        elif code in (45, 48):
            return "Niebla o neblina costera", "50d"
        elif code in (51, 53, 55):
            return "Llovizna ligera", "09d"
        elif code in (61, 63):
            return "Lluvia moderada", "10d"
        elif code == 65:
            return "Lluvia intensa torrencial", "10d"
        elif code in (80, 81, 82):
            return "Chubascos dispersos", "09d"
        elif code in (95, 96, 99):
            return "Tormenta eléctrica severa", "11d"
        return "Intervalos nubosos", "02d"

    @classmethod
    def _obtener_mock_clima(cls, lugar_nombre, lat, lon):
        """
        Datos de prueba representativos de Esmeraldas cuando la API Key no está definida.
        """
        return {
            'lugar': lugar_nombre,
            'coordenadas': {'lat': lat, 'lon': lon},
            'condicion': 'Lluvia moderada con intervalos nubosos',
            'icono': 'https://openweathermap.org/img/wn/10d@2x.png',
            'temperatura_c': 27.5,
            'sensacion_termica_c': 30.2,
            'humedad_porcentaje': 84,
            'presion_hpa': 1011,
            'velocidad_viento_kmh': 14.2,
            'direccion_viento_grados': 230,
            'precipitacion_1h_mm': 18.4,
            'precipitacion_3h_mm': 32.1,
            'nivel_riesgo_hidrologico': 'MEDIO',
            'mensaje_alerta': 'ALERTA AMARILLA: Precipitaciones moderadas registradas en la cuenca de Esmeraldas.',
            'es_simulacion': True,
            'aviso': 'Configure OPENWEATHERMAP_API_KEY en .env para lecturas en vivo.'
        }

    @classmethod
    def obtener_configuracion_capas_tiles(cls):
        """
        Devuelve las plantillas de URL de teselas para Leaflet superpuestas sobre OpenStreetMap.
        """
        api_key = cls.get_api_key()
        base_tile = "https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png"

        return {
            'mapa_base': {
                'nombre': 'OpenStreetMap',
                'url': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'attribution': '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            },
            'capas_meteorologicas': [
                {
                    'id': 'precipitation_new',
                    'nombre': 'Precipitaciones y Lluvia (Radar)',
                    'url': f"{base_tile}?appid={api_key}" if api_key else base_tile,
                    'opacidad_sugerida': 0.65,
                    'descripcion': 'Superposición cromática de lluvia en tiempo real.'
                },
                {
                    'id': 'clouds_new',
                    'nombre': 'Nubosidad y Cobertura Satelital',
                    'url': f"{base_tile}?appid={api_key}" if api_key else base_tile,
                    'opacidad_sugerida': 0.50,
                    'descripcion': 'Frentes nubosos aproximándose a la costa.'
                },
                {
                    'id': 'wind_new',
                    'nombre': 'Velocidad del Viento',
                    'url': f"{base_tile}?appid={api_key}" if api_key else base_tile,
                    'opacidad_sugerida': 0.45,
                    'descripcion': 'Vientos costeros y ráfagas.'
                },
                {
                    'id': 'temp_new',
                    'nombre': 'Mapa Térmico (Temperatura)',
                    'url': f"{base_tile}?appid={api_key}" if api_key else base_tile,
                    'opacidad_sugerida': 0.40,
                    'descripcion': 'Gradiente térmico ambiental.'
                }
            ],
            'cantones_disponibles': list(CANTONES_ESMERALDAS.keys())
        }

