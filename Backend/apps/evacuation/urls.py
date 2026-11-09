from django.urls import path
from .views import (
    AlberguesListGeoJSONAPIView,
    AlbergueDetailUpdateDeleteAPIView,
    AlbergueCercanoConCupoAPIView,
    TramosVialesGeoJSONAPIView
)

urlpatterns = [
    # GeoJSON de todos los albergues y registro
    path('albergues/', AlberguesListGeoJSONAPIView.as_view(), name='evacuacion-albergues'),
    # Detalle, actualización (reubicación GPS drag-and-drop) y eliminación
    path('albergues/<int:pk>/', AlbergueDetailUpdateDeleteAPIView.as_view(), name='evacuacion-albergue-detail'),
    # Búsqueda espacial del albergue con cupo más cercano (ST_Distance)
    path('albergue-cercano/', AlbergueCercanoConCupoAPIView.as_view(), name='evacuacion-albergue-cercano'),
    # Estado de vías (transitables / bloqueadas)
    path('vias/', TramosVialesGeoJSONAPIView.as_view(), name='evacuacion-vias'),
]

