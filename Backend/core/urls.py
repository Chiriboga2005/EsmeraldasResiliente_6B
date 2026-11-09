from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Endpoints de Autenticación y Usuarios
    path('api/v1/auth/', include('apps.authentication.urls')),
    
    # Módulo 1: GIS, Zonas de Riesgo y Capas Geoespaciales
    path('api/v1/gis/', include('apps.gis_core.urls')),
    
    # Módulo Meteorológico: OpenWeatherMap (Precipitaciones y Clima)
    path('api/v1/clima/', include('apps.weather.urls')),
    
    # Módulo 2: Reporte Ciudadano (Online / Offline Sync)
    path('api/v1/reportes/', include('apps.reports.urls')),
    
    # Módulo 4: Evacuación y Albergues Temporales
    path('api/v1/evacuacion/', include('apps.evacuation.urls')),
    
    # Módulo 5: Asistencia Humanitaria y Censo
    path('api/v1/humanitaria/', include('apps.humanitarian_aid.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

