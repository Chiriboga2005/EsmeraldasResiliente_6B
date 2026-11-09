from django.urls import path
from .views import (
    ClimaActualAPIView,
    CapasMeteorologicasConfigAPIView,
    CantonesDisponiblesAPIView
)

urlpatterns = [
    path('actual/', ClimaActualAPIView.as_view(), name='clima-actual'),
    path('capas/', CapasMeteorologicasConfigAPIView.as_view(), name='clima-capas'),
    path('cantones/', CantonesDisponiblesAPIView.as_view(), name='clima-cantones'),
]

