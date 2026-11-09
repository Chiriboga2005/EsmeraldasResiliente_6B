from django.urls import path
from .views import (
    ConsultaIAView,
    HistorialConsultasIAView,
    ResumenHistoricoAPIView,
    SectoresRecurrentesAPIView,
    TendenciasAPIView,
    PatronesGeoTemporalesAPIView,
    SimularEscenarioAPIView,
    ClasificarIncidenteAPIView
)

urlpatterns = [
    # Consulta y chat interactivo con persistencia en BD
    path('consultar/', ConsultaIAView.as_view(), name='ia-consultar'),
    path('historial/', HistorialConsultasIAView.as_view(), name='ia-historial'),
    
    # Endpoints de IA y Analítica (Módulo 6)
    path('resumen-historico/', ResumenHistoricoAPIView.as_view(), name='ia-resumen-historico'),
    path('sectores-recurrentes/', SectoresRecurrentesAPIView.as_view(), name='ia-sectores-recurrentes'),
    path('tendencias/', TendenciasAPIView.as_view(), name='ia-tendencias'),
    path('patrones-geotemporales/', PatronesGeoTemporalesAPIView.as_view(), name='ia-patrones-geotemporales'),
    path('simular-escenario/', SimularEscenarioAPIView.as_view(), name='ia-simular-escenario'),
    path('clasificar-incidente/', ClasificarIncidenteAPIView.as_view(), name='ia-clasificar-incidente'),
]
