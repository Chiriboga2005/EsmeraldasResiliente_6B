from django.urls import path
from .views import (
    FamiliasCensoListCreateAPIView,
    VerificarCensoCiudadanoAPIView,
    CatalogoSuministrosListAPIView,
    InventarioBodegasStockAPIView
)

urlpatterns = [
    # Censo de familias
    path('censo-familias/', FamiliasCensoListCreateAPIView.as_view(), name='humanitaria-censo'),
    # Verificación de censo ciudadano por cédula (Caso A / Caso B)
    path('censo-familias/verificar/<str:cedula>/', VerificarCensoCiudadanoAPIView.as_view(), name='humanitaria-censo-verificar'),
    path('censo-familias/verificar/', VerificarCensoCiudadanoAPIView.as_view(), name='humanitaria-censo-verificar-param'),
    # Catálogo de kits
    path('suministros/', CatalogoSuministrosListAPIView.as_view(), name='humanitaria-suministros'),
    # Inventarios por bodega
    path('inventario/', InventarioBodegasStockAPIView.as_view(), name='humanitaria-inventario'),
]

