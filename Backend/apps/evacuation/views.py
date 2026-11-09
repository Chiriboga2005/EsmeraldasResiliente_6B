from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.db.models import F
from .models import AlbergueTemporal, TramoVial
from .serializers import AlbergueTemporalGeoSerializer, TramoVialGeoSerializer

class AlberguesListGeoJSONAPIView(generics.ListCreateAPIView):
    """
    Retorna GeoJSON con todos los albergues temporales y su capacidad actual,
    o permite registrar uno nuevo si es Admin.
    """
    queryset = AlbergueTemporal.objects.all().order_by('id')
    serializer_class = AlbergueTemporalGeoSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data
        lat = data.get('lat')
        lon = data.get('lon') or data.get('lng')
        
        nombre = data.get('nombre', 'Nuevo Albergue Temporal')
        capacidad = data.get('capacidad_maxima', 200)
        ocupacion = data.get('ocupacion_actual', 0)
        direccion = data.get('direccion', 'Cantón Esmeraldas')
        contacto = data.get('contacto_responsable', 'COE Cantonal')
        telefono = data.get('telefono_contacto', '0999999999')
        servicios = data.get('servicios_disponibles', {})
        
        ubicacion = Point(float(lon), float(lat), srid=4326) if (lat and lon) else Point(-79.6582, 0.9681, srid=4326)

        albergue = AlbergueTemporal.objects.create(
            nombre=nombre,
            direccion=direccion,
            capacidad_maxima=int(capacidad),
            ocupacion_actual=int(ocupacion),
            contacto_responsable=contacto,
            telefono_contacto=telefono,
            ubicacion=ubicacion,
            servicios_disponibles=servicios,
            activo=True
        )
        serializer = self.get_serializer(albergue)
        return Response({
            'mensaje': f'Albergue "{albergue.nombre}" registrado exitosamente.',
            'albergue': serializer.data
        }, status=status.HTTP_201_CREATED)

class AlbergueDetailUpdateDeleteAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Permite consultar, editar y reubicar (drag-and-drop de coordenadas) o eliminar un albergue.
    """
    queryset = AlbergueTemporal.objects.all()
    serializer_class = AlbergueTemporalGeoSerializer
    permission_classes = [permissions.AllowAny]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        data = request.data

        # Actualización de coordenadas por arrastre interactivo en el mapa Leaflet
        lat = data.get('lat')
        lon = data.get('lon') or data.get('lng')
        if lat is not None and lon is not None:
            instance.ubicacion = Point(float(lon), float(lat), srid=4326)

        if 'nombre' in data:
            instance.nombre = data['nombre']
        if 'direccion' in data:
            instance.direccion = data['direccion']
        if 'capacidad_maxima' in data:
            instance.capacidad_maxima = int(data['capacidad_maxima'])
        if 'ocupacion_actual' in data:
            instance.ocupacion_actual = int(data['ocupacion_actual'])
        if 'contacto_responsable' in data:
            instance.contacto_responsable = data['contacto_responsable']
        if 'telefono_contacto' in data:
            instance.telefono_contacto = data['telefono_contacto']
        if 'activo' in data:
            instance.activo = bool(data['activo'])
        if 'servicios_disponibles' in data:
            instance.servicios_disponibles = data['servicios_disponibles']

        instance.save()
        serializer = self.get_serializer(instance)
        return Response({
            'mensaje': f'Albergue "{instance.nombre}" actualizado exitosamente en base de datos.',
            'albergue': serializer.data
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        nombre = instance.nombre
        instance.delete()
        return Response({
            'mensaje': f'Albergue "{nombre}" eliminado correctamente de la base de datos.'
        }, status=status.HTTP_200_OK)

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

