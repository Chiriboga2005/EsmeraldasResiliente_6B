from django.urls import path
from .views import (
    FamiliasCensoListCreateAPIView,
    CatalogoSuministrosListAPIView,
    InventarioBodegasStockAPIView
)

urlpatterns = [
    # Censo de familias
    path('censo-familias/', FamiliasCensoListCreateAPIView.as_view(), name='humanitaria-censo'),
    # Catálogo de kits
    path('suministros/', CatalogoSuministrosListAPIView.as_view(), name='humanitaria-suministros'),
    # Inventarios por bodega
    path('inventario/', InventarioBodegasStockAPIView.as_view(), name='humanitaria-inventario'),
]

