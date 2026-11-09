from django.urls import path
from .views import (
    FamiliasCensoListCreateAPIView,
    VerificarCensoCiudadanoAPIView,
    BodegasAcopioListCreateAPIView,
    BodegaAcopioDetailAPIView,
    CatalogoSuministrosListCreateAPIView,
    CatalogoSuministroDetailAPIView,
    InventarioBodegasStockAPIView
)

urlpatterns = [
    # Censo de familias
    path('censo-familias/', FamiliasCensoListCreateAPIView.as_view(), name='humanitaria-censo'),
    # Verificación de censo ciudadano por cédula (Caso A / Caso B)
    path('censo-familias/verificar/<str:cedula>/', VerificarCensoCiudadanoAPIView.as_view(), name='humanitaria-censo-verificar'),
    path('censo-familias/verificar/', VerificarCensoCiudadanoAPIView.as_view(), name='humanitaria-censo-verificar-param'),
    
    # Bodegas de Acopio CRUD
    path('bodegas/', BodegasAcopioListCreateAPIView.as_view(), name='bodegas-list-create'),
    path('bodegas/<int:pk>/', BodegaAcopioDetailAPIView.as_view(), name='bodega-detail'),

    # Catálogo de Kits / Suministros CRUD
    path('suministros/', CatalogoSuministrosListCreateAPIView.as_view(), name='humanitaria-suministros'),
    path('suministros/<int:pk>/', CatalogoSuministroDetailAPIView.as_view(), name='suministro-detail'),

    # Inventarios por bodega
    path('inventario/', InventarioBodegasStockAPIView.as_view(), name='humanitaria-inventario'),
]

