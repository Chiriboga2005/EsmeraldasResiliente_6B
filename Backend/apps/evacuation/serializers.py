from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import AlbergueTemporal, TramoVial

class AlbergueTemporalGeoSerializer(GeoFeatureModelSerializer):
    cupo_disponible = serializers.ReadOnlyField()
    porcentaje_ocupacion = serializers.ReadOnlyField()
    distancia_km = serializers.SerializerMethodField()

    class Meta:
        model = AlbergueTemporal
        geo_field = 'ubicacion'
        fields = [
            'id', 'nombre', 'direccion', 'contacto_responsable',
            'telefono_contacto', 'capacidad_maxima', 'ocupacion_actual',
            'cupo_disponible', 'porcentaje_ocupacion', 'distancia_km',
            'servicios_disponibles', 'activo'
        ]

    def get_distancia_km(self, obj):
        if hasattr(obj, 'distancia'):
            return round(obj.distancia.km, 2)
        return None

class TramoVialGeoSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = TramoVial
        geo_field = 'geometria'
        fields = ['id', 'nombre_via', 'tipo_via', 'estado', 'descripcion_bloqueo', 'fecha_reporte_estado']

