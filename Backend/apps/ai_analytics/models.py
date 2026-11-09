import uuid
from django.db import models
from django.conf import settings

class ConsultaIA(models.Model):
    """
    Historial de preguntas y respuestas del Asistente de Inteligencia Artificial del COE.
    Persistido en PostgreSQL / PostGIS.
    """
    CATEGORIAS = [
        ('GENERAL', 'Consulta General COE'),
        ('RECURRENCIA', 'Recurrencia de Inundaciones'),
        ('SIMULACION', 'Simulación de Escenarios Fluviales'),
        ('CLASIFICACION_ML', 'Clasificación de Incidentes ML'),
        ('TENDENCIAS', 'Tendencias Fenómeno El Niño'),
        ('PATRONES_DBSCAN', 'Clustering Espacial DBSCAN'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='consultas_ia'
    )
    pregunta = models.TextField(help_text="Texto o pregunta formulada por el operador COE o ciudadano")
    respuesta = models.TextField(help_text="Respuesta técnica generada por el Asistente IA")
    categoria = models.CharField(max_length=50, choices=CATEGORIAS, default='GENERAL')
    datos_contexto = models.JSONField(
        default=dict,
        blank=True,
        help_text="Metadatos, métricas Scikit-Learn y estadísticas devueltas por los modelos"
    )
    es_experimental = models.BooleanField(
        default=True,
        help_text="Indica rigor científico: modelo experimental que apoya pero no reemplaza alertas oficiales"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'ia_consultas_historial'
        ordering = ['-fecha_creacion']
        verbose_name = 'Consulta de IA'
        verbose_name_plural = 'Historial de Consultas de IA'

    def __str__(self):
        return f"[{self.fecha_creacion.strftime('%Y-%m-%d %H:%M')}] {self.pregunta[:50]}..."

