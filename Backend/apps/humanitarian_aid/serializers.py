import uuid
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from django.contrib.gis.geos import Point
from .models import FamiliaCenso, BodegaAcopio, SuministroCatalogo, InventarioBodega

class FamiliaCensoGeoSerializer(GeoFeatureModelSerializer):
    lat = serializers.FloatField(write_only=True, required=False, allow_null=True)
    lon = serializers.FloatField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = FamiliaCenso
        geo_field = 'ubicacion_vivienda'
        fields = [
            'id', 'codigo_censo', 'jefe_familia_nombre', 'jefe_familia_cedula',
            'telefono_contacto', 'canton', 'parroquia', 'barrio_sector',
            'direccion_referencia', 'numero_integrantes', 'ninos_menores_5',
            'adultos_mayores', 'personas_discapacidad', 'danos_vivienda',
            'requiere_evacuacion_inmediata', 'albergue_asignado', 'fecha_censo',
            'lat', 'lon'
        ]
        extra_kwargs = {
            'codigo_censo': {'required': False}
        }

    def create(self, validated_data):
        lat = validated_data.pop('lat', None)
        lon = validated_data.pop('lon', None)
        if lat is not None and lon is not None:
            validated_data['ubicacion_vivienda'] = Point(float(lon), float(lat), srid=4326)
        if not validated_data.get('codigo_censo'):
            validated_data['codigo_censo'] = f"CENSO-ESM-{uuid.uuid4().hex[:6].upper()}"
        return super().create(validated_data)

class FamiliaCensoSimpleSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True, required=False, allow_null=True)
    lon = serializers.FloatField(write_only=True, required=False, allow_null=True)
    latitud = serializers.SerializerMethodField(read_only=True)
    longitud = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = FamiliaCenso
        fields = [
            'id', 'codigo_censo', 'jefe_familia_nombre', 'jefe_familia_cedula',
            'telefono_contacto', 'canton', 'parroquia', 'barrio_sector',
            'direccion_referencia', 'numero_integrantes', 'ninos_menores_5',
            'adultos_mayores', 'personas_discapacidad', 'danos_vivienda',
            'requiere_evacuacion_inmediata', 'albergue_asignado', 'fecha_censo',
            'lat', 'lon', 'latitud', 'longitud'
        ]
        extra_kwargs = {
            'codigo_censo': {'required': False}
        }

    def get_latitud(self, obj):
        return obj.ubicacion_vivienda.y if obj.ubicacion_vivienda else None

    def get_longitud(self, obj):
        return obj.ubicacion_vivienda.x if obj.ubicacion_vivienda else None

    def create(self, validated_data):
        lat = validated_data.pop('lat', None)
        lon = validated_data.pop('lon', None)
        if lat is not None and lon is not None:
            validated_data['ubicacion_vivienda'] = Point(float(lon), float(lat), srid=4326)
        if not validated_data.get('codigo_censo'):
            validated_data['codigo_censo'] = f"CENSO-ESM-{uuid.uuid4().hex[:6].upper()}"
        return super().create(validated_data)

class BodegaAcopioSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True, required=False, allow_null=True)
    lon = serializers.FloatField(write_only=True, required=False, allow_null=True)
    latitud = serializers.SerializerMethodField(read_only=True)
    longitud = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BodegaAcopio
        fields = [
            'id', 'nombre', 'responsable', 'telefono', 'direccion', 
            'activo', 'lat', 'lon', 'latitud', 'longitud'
        ]

    def get_latitud(self, obj):
        return obj.ubicacion.y if obj.ubicacion else None

    def get_longitud(self, obj):
        return obj.ubicacion.x if obj.ubicacion else None

    def create(self, validated_data):
        lat = validated_data.pop('lat', None)
        lon = validated_data.pop('lon', None)
        if lat is not None and lon is not None:
            validated_data['ubicacion'] = Point(float(lon), float(lat), srid=4326)
        else:
            validated_data['ubicacion'] = Point(-79.654, 0.968, srid=4326)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        lat = validated_data.pop('lat', None)
        lon = validated_data.pop('lon', None)
        if lat is not None and lon is not None:
            instance.ubicacion = Point(float(lon), float(lat), srid=4326)
        return super().update(instance, validated_data)

class SuministroCatalogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuministroCatalogo
        fields = '__all__'

class InventarioBodegaSerializer(serializers.ModelSerializer):
    suministro_detalle = SuministroCatalogoSerializer(source='suministro', read_only=True)

    class Meta:
        model = InventarioBodega
        fields = ['id', 'bodega', 'suministro', 'suministro_detalle', 'cantidad_disponible', 'stock_minimo_alerta', 'fecha_actualizacion']

