from django.urls import path
from .views import (
    ZonasRiesgoGeoJSONAPIView,
    CapasHidricasVialesGeoJSONAPIView,
    InfraestructurasGeoJSONAPIView
)

urlpatterns = [
    # GeoJSON de Polígonos de Riesgo (Semaforización)
    path('zonas-riesgo/', ZonasRiesgoGeoJSONAPIView.as_view(), name='gis-zonas-riesgo'),
    # GeoJSON de Ríos, Esteros y Vías
    path('red-hidrica-vial/', CapasHidricasVialesGeoJSONAPIView.as_view(), name='gis-red-hidrica-vial'),
    # GeoJSON de Hospitales, Bomberos y Policía
    path('infraestructuras/', InfraestructurasGeoJSONAPIView.as_view(), name='gis-infraestructuras'),
]

