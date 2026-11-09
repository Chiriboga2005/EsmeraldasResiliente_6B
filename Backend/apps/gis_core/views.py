from rest_framework import generics, permissions
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

class InfraestructurasGeoJSONAPIView(generics.ListAPIView):
    """
    Retorna GeoJSON con hospitales, bomberos y centros de ayuda.
    Soporta filtro: ?tipo=HOSPITAL
    """
    serializer_class = InfraestructuraEsencialGeoSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = InfraestructuraEsencial.objects.filter(activo=True)
        tipo = self.request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo=tipo.upper())
        return qs

