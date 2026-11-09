from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import ReporteIncidente, FotoIncidente

class FotoIncidenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoIncidente
        fields = ['id', 'url_archivo', 'fecha_subida']

class ReporteIncidenteGeoSerializer(GeoFeatureModelSerializer):
    fotos = FotoIncidenteSerializer(many=True, read_only=True)
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = ReporteIncidente
        geo_field = 'ubicacion'
        fields = [
            'id', 'tipo_evento', 'nivel_gravedad', 'descripcion',
            'personas_atrapadas', 'familias_afectadas', 'estimacion_danos_vivienda',
            'estado', 'es_simulacion', 'sincronizado_offline',
            'fecha_incidente', 'fecha_recepcion_servidor', 'fotos', 'usuario_nombre'
        ]

    def get_usuario_nombre(self, obj):
        return obj.usuario.get_full_name() if obj.usuario else 'Ciudadano Anónimo / Offline'

class CrearReporteSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True)
    lon = serializers.FloatField(write_only=True)

    class Meta:
        model = ReporteIncidente
        fields = [
            'id', 'tipo_evento', 'nivel_gravedad', 'descripcion',
            'lat', 'lon', 'precision_gps_metros', 'personas_atrapadas',
            'familias_afectadas', 'estimacion_danos_vivienda', 'es_simulacion',
            'sincronizado_offline', 'fecha_incidente'
        ]

    def create(self, validated_data):
        from django.contrib.gis.geos import Point
        lat = validated_data.pop('lat')
        lon = validated_data.pop('lon')
        validated_data['ubicacion'] = Point(lon, lat, srid=4326)
        return super().create(validated_data)

