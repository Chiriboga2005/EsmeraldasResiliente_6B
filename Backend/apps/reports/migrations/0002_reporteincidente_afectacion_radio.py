from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='reporteincidente',
            name='personas_afectadas_estimadas',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='reporteincidente',
            name='familias_en_perimetro',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='reporteincidente',
            name='ninos_en_riesgo',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='reporteincidente',
            name='adultos_mayores_riesgo',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='reporteincidente',
            name='discapacitados_riesgo',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='reporteincidente',
            name='radio_analisis_metros',
            field=models.DecimalField(decimal_places=2, default=25.0, max_digits=6),
        ),
    ]
