from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Usuario, RolUsuario

class RegistroCiudadanoSerializer(serializers.ModelSerializer):
    """
    Paso 1: Registro Rápido en Emergencia desde la App Móvil.
    """
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = [
            'id', 'first_name', 'last_name', 'telefono', 
            'email', 'password', 'acepta_terminos_privacidad'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario.objects.create_user(
            telefono=validated_data['telefono'],
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email'),
            acepta_terminos_privacidad=validated_data.get('acepta_terminos_privacidad', True),
            rol=RolUsuario.CIUDADANO
        )
        return user

class PerfilUsuarioSerializer(GeoFeatureModelSerializer):
    """
    Paso 2: Perfil Completo del Ciudadano con Georreferenciación de Residencia.
    """
    class Meta:
        model = Usuario
        geo_field = 'ubicacion_domicilio'
        fields = [
            'id', 'first_name', 'last_name', 'telefono', 'telefono_emergencia',
            'email', 'cedula', 'rol', 'esta_verificado', 'canton', 'parroquia',
            'barrio_sector', 'direccion_domicilio', 'tiene_personas_vulnerables',
            'numero_personas_hogar', 'fecha_registro'
        ]
        read_only_fields = ['id', 'rol', 'esta_verificado', 'fecha_registro']

