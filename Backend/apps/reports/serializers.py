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
    latitud = serializers.SerializerMethodField()
    longitud = serializers.SerializerMethodField()

    class Meta:
        model = ReporteIncidente
        geo_field = 'ubicacion'
        fields = [
            'id', 'tipo_evento', 'nivel_gravedad', 'descripcion',
            'personas_atrapadas', 'familias_afectadas', 'estimacion_danos_vivienda',
            'estado', 'es_simulacion', 'sincronizado_offline',
            'fecha_incidente', 'fecha_recepcion_servidor', 'fotos', 'usuario_nombre',
            'latitud', 'longitud'
        ]

    def get_latitud(self, obj):
        return obj.ubicacion.y if obj.ubicacion else None

    def get_longitud(self, obj):
        return obj.ubicacion.x if obj.ubicacion else None

    def get_usuario_nombre(self, obj):
        if obj.usuario:
            name = obj.usuario.get_full_name()
            if name and name.strip():
                return name
            return obj.usuario.username
        if obj.estimacion_danos_vivienda and 'Informante:' in obj.estimacion_danos_vivienda:
            parts = obj.estimacion_danos_vivienda.split('Informante:')
            if len(parts) > 1:
                return parts[1].strip()
        return 'Ciudadano / Móvil'

class CrearReporteSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True, required=False)
    lon = serializers.FloatField(write_only=True, required=False)
    lng = serializers.FloatField(write_only=True, required=False)
    nombre_informante = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = ReporteIncidente
        fields = [
            'id', 'tipo_evento', 'nivel_gravedad', 'descripcion',
            'lat', 'lon', 'lng', 'nombre_informante', 'precision_gps_metros', 'personas_atrapadas',
            'familias_afectadas', 'estimacion_danos_vivienda', 'es_simulacion',
            'sincronizado_offline', 'fecha_incidente'
        ]

    def validate(self, attrs):
        lat = attrs.get('lat')
        lon = attrs.get('lon') if attrs.get('lon') is not None else attrs.get('lng')
        if lat is None or lon is None:
            raise serializers.ValidationError({"error": "Debe proporcionar lat y lon (o lng) para la ubicación geográfica."})
        attrs['lat'] = lat
        attrs['lon'] = lon
        return attrs

    def create(self, validated_data):
        from django.contrib.gis.geos import Point
        lat = validated_data.pop('lat')
        lon = validated_data.pop('lon')
        validated_data.pop('lng', None)
        nombre_informante = validated_data.pop('nombre_informante', None)

        if nombre_informante and not validated_data.get('usuario'):
            curr_danos = validated_data.get('estimacion_danos_vivienda') or ''
            if 'Informante:' not in curr_danos:
                sep = ' • ' if curr_danos else ''
                validated_data['estimacion_danos_vivienda'] = f"{curr_danos}{sep}Informante: {nombre_informante.strip()}"

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
        if obj.usuario:
            name = obj.usuario.get_full_name()
            if name and name.strip():
                return name
            return obj.usuario.username
        if obj.estimacion_danos_vivienda and 'Informante:' in obj.estimacion_danos_vivienda:
            parts = obj.estimacion_danos_vivienda.split('Informante:')
            if len(parts) > 1:
                return parts[1].strip()
        return 'Ciudadano / Móvil'

    def get_latitud(self, obj):
        return obj.ubicacion.y if obj.ubicacion else None

    def get_longitud(self, obj):
        return obj.ubicacion.x if obj.ubicacion else None

class ActualizarEstadoIncidenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteIncidente
        fields = ['estado', 'nivel_gravedad', 'descripcion', 'personas_atrapadas', 'familias_afectadas']


