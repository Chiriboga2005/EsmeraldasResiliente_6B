from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import FamiliaCenso, BodegaAcopio, SuministroCatalogo, InventarioBodega

class FamiliaCensoGeoSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = FamiliaCenso
        geo_field = 'ubicacion_vivienda'
        fields = [
            'id', 'codigo_censo', 'jefe_familia_nombre', 'jefe_familia_cedula',
            'telefono_contacto', 'canton', 'parroquia', 'barrio_sector',
            'direccion_referencia', 'numero_integrantes', 'ninos_menores_5',
            'adultos_mayores', 'personas_discapacidad', 'danos_vivienda',
            'requiere_evacuacion_inmediata', 'albergue_asignado', 'fecha_censo'
        ]

class SuministroCatalogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuministroCatalogo
        fields = '__all__'

class InventarioBodegaSerializer(serializers.ModelSerializer):
    suministro_detalle = SuministroCatalogoSerializer(source='suministro', read_only=True)

    class Meta:
        model = InventarioBodega
        fields = ['id', 'bodega', 'suministro', 'suministro_detalle', 'cantidad_disponible', 'stock_minimo_alerta', 'fecha_actualizacion']

