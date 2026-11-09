from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import ReporteIncidente
from .serializers import (
    ReporteIncidenteGeoSerializer,
    CrearReporteSerializer
)

class ReportesListGeoJSONAPIView(generics.ListAPIView):
    """
    Retorna GeoJSON con los incidentes activos para el mapa del COE y el ciudadano.
    Soporta filtros: ?gravedad=CRITICO&estado=PENDIENTE&simulacion=false
    """
    serializer_class = ReporteIncidenteGeoSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = ReporteIncidente.objects.all().select_related('usuario').prefetch_related('fotos')
        gravedad = self.request.query_params.get('gravedad')
        estado = self.request.query_params.get('estado')
        simulacion = self.request.query_params.get('simulacion')

        if gravedad:
            qs = qs.filter(nivel_gravedad=gravedad.upper())
        if estado:
            qs = qs.filter(estado=estado.upper())
        if simulacion is not None:
            qs = qs.filter(es_simulacion=(simulacion.lower() == 'true'))

        return qs

class CrearReporteAPIView(generics.CreateAPIView):
    """
    Endpoint para registro directo de un reporte desde la app móvil o web.
    """
    serializer_class = CrearReporteSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        fecha = serializer.validated_data.get('fecha_incidente', timezone.now())
        serializer.save(usuario=user, fecha_incidente=fecha)

class SincronizarLoteOfflineAPIView(APIView):
    """
    RF-02.7: Recibe un lote de reportes acumulados offline en SQLite/IndexedDB
    cuando el móvil recupera conexión.
    Aplica idempotencia por UUID para no duplicar si se reintenta el envío.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        reportes_data = request.data.get('reportes', [])
        if not isinstance(reportes_data, list):
            return Response(
                {'error': 'El payload debe contener una lista en la clave "reportes".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        creados = 0
        actualizados = 0
        errores = []

        for item in reportes_data:
            reporte_id = item.get('id')
            serializer = CrearReporteSerializer(data=item)
            if serializer.is_valid():
                # Verificar si ya existía para garantizar idempotencia
                existente = ReporteIncidente.objects.filter(id=reporte_id).first()
                if existente:
                    actualizados += 1
                else:
                    user = request.user if request.user.is_authenticated else None
                    serializer.save(
                        usuario=user,
                        sincronizado_offline=True,
                        fecha_incidente=serializer.validated_data.get('fecha_incidente', timezone.now())
                    )
                    creados += 1
            else:
                errores.append({'id': reporte_id, 'errores': serializer.errors})

        return Response({
            'mensaje': 'Sincronización offline procesada.',
            'total_procesados': len(reportes_data),
            'creados': creados,
            'actualizados_idempotentes': actualizados,
            'errores': errores
        }, status=status.HTTP_200_OK if not errores else status.HTTP_207_MULTI_STATUS)

