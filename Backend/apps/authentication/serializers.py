from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from .models import Usuario, RolUsuario

class CustomTokenObtainPairSerializer(serializers.Serializer):
    """
    Permite autenticarse usando 'username' (ej. admin), 'telefono' o 'email'.
    """
    username = serializers.CharField(required=False)
    telefono = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        login_input = attrs.get('username') or attrs.get('telefono')
        password = attrs.get('password')
        if not login_input:
            raise serializers.ValidationError({'detail': 'Ingrese su nombre de usuario, teléfono o correo electrónico.'})

        user = Usuario.objects.filter(
            Q(username__iexact=login_input) |
            Q(telefono=login_input) |
            Q(email__iexact=login_input)
        ).first()

        if user and user.check_password(password):
            if not user.is_active:
                raise serializers.ValidationError({'detail': 'Este usuario ha sido desactivado por administración.'})
            refresh = RefreshToken.for_user(user)
            return {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'usuario': {
                    'id': str(user.id),
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'nombre_completo': user.get_full_name() or user.username,
                    'username': user.username,
                    'telefono': user.telefono,
                    'email': user.email,
                    'rol': user.rol,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                }
            }
        raise serializers.ValidationError({'detail': 'Credenciales no válidas. Verifique su usuario/teléfono y contraseña.'})

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

