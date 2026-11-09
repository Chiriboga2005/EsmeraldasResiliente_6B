from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .services import OpenWeatherService, CANTONES_ESMERALDAS

class ClimaActualAPIView(APIView):
    """
    Endpoint para obtener las condiciones meteorológicas actuales de Esmeraldas o cantón.
    Parámetros opcionales (Query Params):
    - canton: 'esmeraldas', 'atacames', 'quininde', etc.
    - lat: coordenada de latitud
    - lon: coordenada de longitud
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        canton = request.query_params.get('canton')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')

        try:
            lat = float(lat) if lat else None
            lon = float(lon) if lon else None
        except ValueError:
            return Response(
                {'error': 'Las coordenadas lat y lon deben ser números decimales válidos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = OpenWeatherService.obtener_clima_actual(lat=lat, lon=lon, canton_slug=canton)
        return Response(data, status=status.HTTP_200_OK)

class CapasMeteorologicasConfigAPIView(APIView):
    """
    Endpoint que provee al frontend (Leaflet) la configuración de capas
    OpenStreetMap y OpenWeatherMap con sus teselas y sliders de opacidad.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        config = OpenWeatherService.obtener_configuracion_capas_tiles()
        return Response(config, status=status.HTTP_200_OK)

class CantonesDisponiblesAPIView(APIView):
    """
    Lista de los cantones de Esmeraldas soportados con sus coordenadas de monitoreo.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response(CANTONES_ESMERALDAS, status=status.HTTP_200_OK)

