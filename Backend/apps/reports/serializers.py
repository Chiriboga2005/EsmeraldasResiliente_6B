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

class ReporteIncidenteListSerializer(serializers.ModelSerializer):
    fotos = FotoIncidenteSerializer(many=True, read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    latitud = serializers.SerializerMethodField()
    longitud = serializers.SerializerMethodField()

    class Meta:
        model = ReporteIncidente
        fields = [
            'id', 'tipo_evento', 'nivel_gravedad', 'descripcion',
            'personas_atrapadas', 'familias_afectadas', 'estimacion_danos_vivienda',
            'estado', 'es_simulacion', 'sincronizado_offline',
            'fecha_incidente', 'fecha_recepcion_servidor', 'fecha_actualizacion',
            'fotos', 'usuario_nombre', 'latitud', 'longitud'
        ]

    def get_usuario_nombre(self, obj):
        return obj.usuario.get_full_name() if obj.usuario else 'Ciudadano Anónimo / Móvil'

    def get_latitud(self, obj):
        return obj.ubicacion.y if obj.ubicacion else None

    def get_longitud(self, obj):
        return obj.ubicacion.x if obj.ubicacion else None

class ActualizarEstadoIncidenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteIncidente
        fields = ['estado', 'nivel_gravedad', 'descripcion', 'personas_atrapadas', 'familias_afectadas']


