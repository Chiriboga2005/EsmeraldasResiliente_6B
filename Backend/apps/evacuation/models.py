from django.contrib.gis.db import models

class AlbergueTemporal(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=180)
    direccion = models.TextField(null=True, blank=True)
    contacto_responsable = models.CharField(max_length=150, null=True, blank=True)
    telefono_contacto = models.CharField(max_length=30, null=True, blank=True)
    capacidad_maxima = models.IntegerField()
    ocupacion_actual = models.IntegerField(default=0)
    ubicacion = models.PointField(srid=4326)
    area_poligono = models.PolygonField(srid=4326, null=True, blank=True)
    activo = models.BooleanField(default=True)
    servicios_disponibles = models.JSONField(default=dict)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'albergues_temporales'
        verbose_name = 'Albergue Temporal'
        verbose_name_plural = 'Albergues Temporales'

    @property
    def cupo_disponible(self):
        return max(0, self.capacidad_maxima - self.ocupacion_actual)

    @property
    def porcentaje_ocupacion(self):
        if self.capacidad_maxima > 0:
            return round((self.ocupacion_actual / self.capacidad_maxima) * 100, 1)
        return 100.0

    def __str__(self):
        return f"{self.nombre} ({self.cupo_disponible} cupos libres)"

class TramoVial(models.Model):
    id = models.AutoField(primary_key=True)
    nombre_via = models.CharField(max_length=150)
    tipo_via = models.CharField(max_length=50, default='SECUNDARIA')
    estado = models.CharField(
        max_length=40,
        choices=[
            ('TRANSITABLE', 'Transitable'),
            ('BLOQUEADO_INUNDACION', 'Bloqueado por Inundación'),
            ('BLOQUEADO_DERRUMBE', 'Bloqueado por Derrumbe'),
            ('EN_MANTENIMIENTO', 'En Mantenimiento'),
        ],
        default='TRANSITABLE'
    )
    geometria = models.LineStringField(srid=4326)
    descripcion_bloqueo = models.TextField(null=True, blank=True)
    fecha_reporte_estado = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tramos_viales'
        verbose_name = 'Tramo Vial'
        verbose_name_plural = 'Tramos Viales'

    def __str__(self):
        return f"{self.nombre_via} [{self.estado}]"

