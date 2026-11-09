from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario
from .serializers import RegistroCiudadanoSerializer, PerfilUsuarioSerializer

class RegistroCiudadanoAPIView(generics.CreateAPIView):
    """
    Registro rápido para la App Móvil Ciudadana.
    Retorna el usuario creado junto con los tokens JWT (access y refresh).
    """
    queryset = Usuario.objects.all()
    serializer_class = RegistroCiudadanoSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generar tokens JWT de forma inmediata
        refresh = RefreshToken.for_user(user)

        return Response({
            'mensaje': 'Usuario registrado exitosamente en el Sistema de Esmeraldas.',
            'usuario': {
                'id': str(user.id),
                'nombre_completo': user.get_full_name(),
                'telefono': user.telefono,
                'rol': user.rol
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

class PerfilUsuarioAPIView(generics.RetrieveUpdateAPIView):
    """
    Consulta y actualización del perfil (Paso 2: Domicilio, Cédula y Vulnerabilidad).
    """
    serializer_class = PerfilUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

