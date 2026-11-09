from django.urls import path
from .views import (
    ReportesListGeoJSONAPIView,
    CrearReporteAPIView,
    SincronizarLoteOfflineAPIView
)

urlpatterns = [
    # GeoJSON de reportes para el mapa
    path('', ReportesListGeoJSONAPIView.as_view(), name='reportes-list'),
    # Crear reporte online
    path('crear/', CrearReporteAPIView.as_view(), name='reporte-crear'),
    # Sincronización offline en lote
    path('sincronizar-offline/', SincronizarLoteOfflineAPIView.as_view(), name='reportes-sync-offline'),
]

