from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from .models import ZonaRiesgo, CapaHidricaVial, InfraestructuraEsencial
from .serializers import (
    ZonaRiesgoGeoSerializer,
    CapaHidricaVialGeoSerializer,
    InfraestructuraEsencialGeoSerializer
)

class ZonasRiesgoGeoJSONAPIView(generics.ListAPIView):
    """
    Retorna GeoJSON con los polígonos de zonas susceptibles a inundaciones o deslaves.
    Soporta filtro por query param: ?nivel_riesgo=ALTO
    """
    serializer_class = ZonaRiesgoGeoSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = ZonaRiesgo.objects.filter(activo=True)
        nivel = self.request.query_params.get('nivel_riesgo')
        if nivel:
            qs = qs.filter(nivel_riesgo=nivel.upper())
        return qs

class CapasHidricasVialesGeoJSONAPIView(generics.ListAPIView):
    """
    Retorna GeoJSON con ríos, esteros y carreteras para el visor del mapa.
    Soporta filtro por query param: ?tipo=RIO
    """
    serializer_class = CapaHidricaVialGeoSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = CapaHidricaVial.objects.all()
        tipo = self.request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo=tipo.upper())
        return qs

class InfraestructurasGeoJSONAPIView(generics.ListCreateAPIView):
    """
    Retorna GeoJSON con hospitales, bomberos y centros de ayuda, o permite registrarlos.
    Soporta filtro: ?tipo=HOSPITAL
    """
    serializer_class = InfraestructuraEsencialGeoSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = InfraestructuraEsencial.objects.filter(activo=True).order_by('id')
        tipo = self.request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo=tipo.upper())
        return qs

    def create(self, request, *args, **kwargs):
        data = request.data
        lat = data.get('lat')
        lon = data.get('lon') or data.get('lng')

        nombre = data.get('nombre', 'Nueva Infraestructura')
        tipo = data.get('tipo', 'HOSPITAL').upper()
        direccion = data.get('direccion', 'Esmeraldas')
        telefono = data.get('telefono_contacto', '')
        contacto = data.get('contacto_responsable', '')
        capacidad = data.get('capacidad_atencion', 100)

        ubicacion = Point(float(lon), float(lat), srid=4326) if (lat and lon) else Point(-79.6582, 0.9681, srid=4326)

        infra = InfraestructuraEsencial.objects.create(
            nombre=nombre,
            tipo=tipo,
            direccion=direccion,
            telefono_contacto=telefono,
            contacto_responsable=contacto,
            capacidad_atencion=int(capacidad) if capacidad else None,
            ubicacion=ubicacion,
            activo=True
        )
        serializer = self.get_serializer(infra)
        return Response({
            'mensaje': f'Infraestructura "{infra.nombre}" registrada exitosamente.',
            'infraestructura': serializer.data
        }, status=status.HTTP_201_CREATED)

class InfraestructuraDetailUpdateDeleteAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Permite consultar, editar y reubicar (drag-and-drop de coordenadas) o eliminar hospitales/bomberos.
    """
    queryset = InfraestructuraEsencial.objects.all()
    serializer_class = InfraestructuraEsencialGeoSerializer
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
        if 'tipo' in data:
            instance.tipo = data['tipo'].upper()
        if 'direccion' in data:
            instance.direccion = data['direccion']
        if 'telefono_contacto' in data:
            instance.telefono_contacto = data['telefono_contacto']
        if 'contacto_responsable' in data:
            instance.contacto_responsable = data['contacto_responsable']
        if 'capacidad_atencion' in data and data['capacidad_atencion']:
            instance.capacidad_atencion = int(data['capacidad_atencion'])
        if 'activo' in data:
            instance.activo = bool(data['activo'])

        instance.save()
        serializer = self.get_serializer(instance)
        return Response({
            'mensaje': f'Infraestructura "{instance.nombre}" actualizada exitosamente en base de datos.',
            'infraestructura': serializer.data
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        nombre = instance.nombre
        instance.delete()
        return Response({
            'mensaje': f'Infraestructura "{nombre}" eliminada correctamente.'
        }, status=status.HTTP_200_OK)

