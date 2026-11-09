import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.gis.db import models
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _

telefono_validator = RegexValidator(
    regex=r'^(\+593|0)9[0-9]{8}$',
    message=_("Ingrese un número celular ecuatoriano válido (ej. 0991234567 o +593991234567).")
)

cedula_validator = RegexValidator(
    regex=r'^[0-9]{10}$',
    message=_("La cédula de identidad debe contener exactamente 10 dígitos numéricos.")
)

class RolUsuario(models.TextChoices):
    CIUDADANO = 'CIUDADANO', _('Ciudadano')
    OPERADOR_COE = 'OPERADOR_COE', _('Operador COE')
    ANALISTA = 'ANALISTA', _('Analista de Riesgos')
    ASISTENCIA = 'ASISTENCIA', _('Personal de Asistencia')
    ADMINISTRADOR = 'ADMINISTRADOR', _('Administrador')

class UsuarioManager(BaseUserManager):
    """
    Manager personalizado para autenticar principalmente por número celular.
    """
    def create_user(self, telefono, password=None, **extra_fields):
        if not telefono:
            raise ValueError(_("El número telefónico es obligatorio."))
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('username', telefono)
        user = self.model(telefono=telefono, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, telefono, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', RolUsuario.ADMINISTRADOR)
        extra_fields.setdefault('first_name', 'Super')
        extra_fields.setdefault('last_name', 'Admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_("El superusuario debe tener is_staff=True."))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_("El superusuario debe tener is_superuser=True."))

        return self.create_user(telefono, password, **extra_fields)

class Usuario(AbstractUser):
    """
    Modelo de Usuario vinculado a la tabla 'usuarios' de esmeraldas_db.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    
    email = models.EmailField(_('Correo electrónico'), unique=True, null=True, blank=True)
    telefono = models.CharField(
        _('Teléfono Celular'),
        max_length=15,
        unique=True,
        validators=[telefono_validator]
    )
    telefono_emergencia = models.CharField(
        _('Teléfono de Emergencia'),
        max_length=15,
        null=True,
        blank=True,
        validators=[telefono_validator]
    )
    cedula = models.CharField(
        _('Cédula de Identidad'),
        max_length=10,
        unique=True,
        null=True,
        blank=True,
        validators=[cedula_validator]
    )
    rol = models.CharField(
        _('Rol'),
        max_length=20,
        choices=RolUsuario.choices,
        default=RolUsuario.CIUDADANO,
        db_index=True
    )
    esta_verificado = models.BooleanField(default=False)

    # Localización en Esmeraldas
    canton = models.CharField(max_length=50, default='Esmeraldas')
    parroquia = models.CharField(max_length=80, null=True, blank=True)
    barrio_sector = models.CharField(max_length=120, null=True, blank=True)
    direccion_domicilio = models.TextField(null=True, blank=True)
    ubicacion_domicilio = models.PointField(srid=4326, null=True, blank=True)

    # Indicadores de Vulnerabilidad en el Hogar
    tiene_personas_vulnerables = models.BooleanField(default=False)
    numero_personas_hogar = models.PositiveSmallIntegerField(default=1)

    acepta_terminos_privacidad = models.BooleanField(default=False)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'telefono'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'usuarios'
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.telefono
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.telefono}) - {self.rol}"

