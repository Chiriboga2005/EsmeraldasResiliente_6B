from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usuario',
            name='rol',
            field=models.CharField(
                choices=[
                    ('INVITADO', 'Invitado'),
                    ('CIUDADANO', 'Ciudadano'),
                    ('DIGITALIZADOR', 'Digitalizador Territorial'),
                    ('OPERADOR', 'Operador'),
                    ('OPERADOR_COE', 'Operador COE'),
                    ('GESTOR', 'Gestor / Director COE'),
                    ('ADMINISTRADOR', 'Administrador'),
                    ('ANALISTA', 'Analista de Riesgos'),
                    ('ASISTENCIA', 'Personal de Asistencia')
                ],
                db_index=True,
                default='CIUDADANO',
                max_length=20,
                verbose_name='Rol'
            ),
        ),
    ]

