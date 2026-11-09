from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.db.models import F
from .models import AlbergueTemporal, TramoVial
from .serializers import AlbergueTemporalGeoSerializer, TramoVialGeoSerializer

class AlberguesListGeoJSONAPIView(generics.ListAPIView):
    """
    Retorna GeoJSON con todos los albergues temporales y su capacidad actual.
    """
    queryset = AlbergueTemporal.objects.filter(activo=True)
    serializer_class = AlbergueTemporalGeoSerializer
    permission_classes = [permissions.AllowAny]

class AlbergueCercanoConCupoAPIView(generics.GenericAPIView):
    """
    RF-04.7: Calcula el albergue con cupo libre más cercano a una coordenada dada
    utilizando funciones espaciales de GeoDjango (ST_Distance).
    Query Params: ?lat=0.9681&lon=-79.6582
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = AlbergueTemporalGeoSerializer

    def get(self, request, *args, **kwargs):
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')

        if not lat or not lon:
            return Response(
                {'error': 'Debe proporcionar los parámetros de latitud (lat) y longitud (lon).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            punto_usuario = Point(float(lon), float(lat), srid=4326)
        except ValueError:
            return Response(
                {'error': 'Coordenadas inválidas.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filtrar albergues activos con cupo libre (ocupacion < capacidad)
        albergues = AlbergueTemporal.objects.filter(
            activo=True,
            ocupacion_actual__lt=F('capacidad_maxima')
        ).annotate(
            distancia=Distance('ubicacion', punto_usuario)
        ).order_by('distancia')

        if not albergues.exists():
            return Response({
                'mensaje': 'No hay albergues con cupo disponible en este momento.',
                'albergue': None
            }, status=status.HTTP_404_NOT_FOUND)

        albergue_mas_cercano = albergues.first()
        serializer = self.get_serializer(albergue_mas_cercano)
        
        return Response({
            'mensaje': 'Albergue con cupo libre más cercano encontrado exitosamente.',
            'albergue': serializer.data
        }, status=status.HTTP_200_OK)

class TramosVialesGeoJSONAPIView(generics.ListAPIView):
    """
    Retorna GeoJSON con los tramos viales y su estado (transitable o bloqueado).
    """
    queryset = TramoVial.objects.all()
    serializer_class = TramoVialGeoSerializer
    permission_classes = [permissions.AllowAny]

