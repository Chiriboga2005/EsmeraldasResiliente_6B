from django.urls import path
from .views import (
    AlberguesListGeoJSONAPIView,
    AlbergueCercanoConCupoAPIView,
    TramosVialesGeoJSONAPIView
)

urlpatterns = [
    # GeoJSON de todos los albergues
    path('albergues/', AlberguesListGeoJSONAPIView.as_view(), name='evacuacion-albergues'),
    # Búsqueda espacial del albergue con cupo más cercano (ST_Distance)
    path('albergue-cercano/', AlbergueCercanoConCupoAPIView.as_view(), name='evacuacion-albergue-cercano'),
    # Estado de vías (transitables / bloqueadas)
    path('vias/', TramosVialesGeoJSONAPIView.as_view(), name='evacuacion-vias'),
]

