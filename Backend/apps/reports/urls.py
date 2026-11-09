from django.urls import path
from .views import (
    ReportesListGeoJSONAPIView,
    CrearReporteAPIView,
    SincronizarLoteOfflineAPIView,
    ReportesTablaListAPIView,
    ReporteIncidenteDetailAPIView,
    ReportesKPIsAPIView
)

urlpatterns = [
    # GeoJSON de reportes para el mapa
    path('', ReportesListGeoJSONAPIView.as_view(), name='reportes-list'),
    # Listado tabular para seguimiento COE (Módulo 3)
    path('tabla/', ReportesTablaListAPIView.as_view(), name='reportes-tabla'),
    # KPIs e indicadores de gestión
    path('kpis/', ReportesKPIsAPIView.as_view(), name='reportes-kpis'),
    # Crear reporte online
    path('crear/', CrearReporteAPIView.as_view(), name='reporte-crear'),
    # Detalle, actualización de estado (atendido, en proceso, pendiente) y eliminación
    path('<uuid:pk>/', ReporteIncidenteDetailAPIView.as_view(), name='reporte-detail'),
    # Sincronización offline en lote
    path('sincronizar-offline/', SincronizarLoteOfflineAPIView.as_view(), name='reportes-sync-offline'),
]

