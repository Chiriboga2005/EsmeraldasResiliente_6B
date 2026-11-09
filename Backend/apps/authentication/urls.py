from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegistroCiudadanoAPIView, 
    PerfilUsuarioAPIView,
    CustomTokenObtainPairView
)

urlpatterns = [
    # Registro rápido desde móvil
    path('registro/', RegistroCiudadanoAPIView.as_view(), name='auth-registro'),
    # Login JWT (recibe 'username'/'admin'/'telefono' y 'password')
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Perfil del usuario autenticado
    path('perfil/', PerfilUsuarioAPIView.as_view(), name='auth-perfil'),
]

