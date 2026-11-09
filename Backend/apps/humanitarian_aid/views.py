from rest_framework import generics, permissions
from .models import FamiliaCenso, SuministroCatalogo, InventarioBodega
from .serializers import (
    FamiliaCensoGeoSerializer,
    SuministroCatalogoSerializer,
    InventarioBodegaSerializer
)

class FamiliasCensoListCreateAPIView(generics.ListCreateAPIView):
    """
    Censo digital de familias damnificadas (Módulo 5).
    """
    queryset = FamiliaCenso.objects.all().order_by('-fecha_censo')
    serializer_class = FamiliaCensoGeoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(censador=user)

class CatalogoSuministrosListAPIView(generics.ListAPIView):
    """
    Catálogo oficial de kits y provisiones humanitarias.
    """
    queryset = SuministroCatalogo.objects.all()
    serializer_class = SuministroCatalogoSerializer
    permission_classes = [permissions.AllowAny]

class InventarioBodegasStockAPIView(generics.ListAPIView):
    """
    Control de inventarios y alertas de desabastecimiento.
    """
    queryset = InventarioBodega.objects.select_related('bodega', 'suministro').all()
    serializer_class = InventarioBodegaSerializer
    permission_classes = [permissions.AllowAny]

