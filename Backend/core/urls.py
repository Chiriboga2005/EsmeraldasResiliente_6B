import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve

FRONTEND_DIST_DIR = os.path.abspath(os.path.join(settings.BASE_DIR, '..', 'Frontend', 'dist'))
ASSETS_DIR = os.path.join(FRONTEND_DIST_DIR, 'assets')

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

    # Archivos estáticos de Vite (JS, CSS, imágenes compiladas)
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': ASSETS_DIR}),
    re_path(r'^(?P<path>favicon\.svg|icons\.svg|manifest\.json)$', serve, {'document_root': FRONTEND_DIST_DIR}),

    # Catch-all para que cualquier ruta del Frontend (React SPA) cargue index.html en el mismo puerto
    re_path(r'^(?!api/|admin/|media/|assets/).*$', TemplateView.as_view(template_name='index.html')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
