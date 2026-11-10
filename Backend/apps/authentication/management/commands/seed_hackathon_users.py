import uuid
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from apps.authentication.models import Usuario, RolUsuario
from apps.humanitarian_aid.models import FamiliaCenso

class Command(BaseCommand):
    help = 'Puebla los usuarios oficiales del Hackathon (Antonella, Axel, Jomira) y familias censadas en zonas de riesgo'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Iniciando sembrado de usuarios oficiales y censo territorial..."))

        # 1. USUARIOS OFICIALES
        usuarios_data = [
            {
                'email': 'Antonella123@gmail.com',
                'username': 'antonella',
                'password': '123antonella',
                'first_name': 'Antonella',
                'last_name': 'Garcia Mendoza',
                'telefono': '0984561234',
                'cedula': '0804123891',
                'rol': RolUsuario.GESTOR,
                'is_staff': True,
                'is_superuser': False,
                'canton': 'Esmeraldas',
                'parroquia': 'Bartolomé Ruiz',
                'barrio_sector': 'Las Palmas',
                'direccion_domicilio': 'Av. Kennedy y Malecón Las Palmas',
                'ubicacion_domicilio': Point(-79.6465, 0.9930, srid=4326),
            },
            {
                'email': 'Axelrosero123@gmail.com',
                'username': 'axel',
                'password': '123Axel',
                'first_name': 'Axel',
                'last_name': 'Rosero Pulup',
                'telefono': '0991234876',
                'cedula': '0803567829',
                'rol': RolUsuario.OPERADOR,
                'is_staff': True,
                'is_superuser': False,
                'canton': 'Esmeraldas',
                'parroquia': '5 de Agosto',
                'barrio_sector': 'Barrio Caliente',
                'direccion_domicilio': 'Calle Salinas y Sucre',
                'ubicacion_domicilio': Point(-79.6531, 0.9669, srid=4326),
            },
            {
                'email': 'Jomira123@gmail.com',
                'username': 'jomira',
                'password': 'Jomira123',
                'first_name': 'Jomira',
                'last_name': 'Figueroa Chiriboga',
                'telefono': '0979876541',
                'cedula': '0850234190',
                'rol': RolUsuario.DIGITALIZADOR,
                'is_staff': False,
                'is_superuser': False,
                'canton': 'Esmeraldas',
                'parroquia': 'Luis Tello',
                'barrio_sector': 'Isla Piedad',
                'direccion_domicilio': 'Ribera del Río Esmeraldas, Sector Isla Piedad',
                'ubicacion_domicilio': Point(-79.6582, 0.9681, srid=4326),
            }
        ]

        digitalizador_user = None

        for u in usuarios_data:
            user = Usuario.objects.filter(email__iexact=u['email']).first() or \
                   Usuario.objects.filter(username__iexact=u['username']).first() or \
                   Usuario.objects.filter(telefono=u['telefono']).first() or \
                   Usuario.objects.filter(cedula=u['cedula']).first()

            if user:
                user.email = u['email']
                user.username = u['username']
                user.first_name = u['first_name']
                user.last_name = u['last_name']
                user.telefono = u['telefono']
                user.cedula = u['cedula']
                user.rol = u['rol']
                user.is_staff = u['is_staff']
                user.is_active = True
                user.canton = u['canton']
                user.parroquia = u['parroquia']
                user.barrio_sector = u['barrio_sector']
                user.direccion_domicilio = u['direccion_domicilio']
                user.ubicacion_domicilio = u['ubicacion_domicilio']
                user.set_password(u['password'])
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Usuario actualizado: {user.username} ({user.rol})"))
            else:
                user = Usuario.objects.create(
                    email=u['email'],
                    username=u['username'],
                    first_name=u['first_name'],
                    last_name=u['last_name'],
                    telefono=u['telefono'],
                    cedula=u['cedula'],
                    rol=u['rol'],
                    is_staff=u['is_staff'],
                    is_active=True,
                    canton=u['canton'],
                    parroquia=u['parroquia'],
                    barrio_sector=u['barrio_sector'],
                    direccion_domicilio=u['direccion_domicilio'],
                    ubicacion_domicilio=u['ubicacion_domicilio']
                )
                user.set_password(u['password'])
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Usuario creado: {user.username} ({user.rol})"))

            if user.rol == RolUsuario.DIGITALIZADOR:
                digitalizador_user = user

        # 2. FAMILIAS CENSADAS EN ZONAS DE RIESGO DE ESMERALDAS (CON GPS REAL)
        # Permiten probar el cruce espacial de 25m cuando se reporta un incidente en El Cabezón o Las Palmas
        familias_data = [
            {
                'codigo_censo': 'CENSO-ESM-01',
                'jefe_familia_nombre': 'Carlos Minda Quiñónez',
                'jefe_familia_cedula': '0802134567',
                'telefono_contacto': '0981122334',
                'barrio_sector': 'El Cabezón / Acceso Principal',
                'direccion_referencia': 'Junto a la ladera de entrada a Esmeraldas',
                # Coordenadas exactas cerca de donde se reportan deslizamientos en El Cabezón: [0.9300, -79.6750]
                'ubicacion_vivienda': Point(-79.67570, 0.92992, srid=4326),
                'numero_integrantes': 5,
                'ninos_menores_5': 2,
                'adultos_mayores': 1,
                'personas_discapacidad': 0,
                'danos_vivienda': 'TOTAL',
                'requiere_evacuacion_inmediata': True,
            },
            {
                'codigo_censo': 'CENSO-ESM-02',
                'jefe_familia_nombre': 'Lider Gomez Perlaza',
                'jefe_familia_cedula': '0802436912',
                'telefono_contacto': '0915143485',
                'barrio_sector': 'El Cabezón / Sector Curva',
                'direccion_referencia': 'Calle principal acceso El Cabezón casa #12',
                # Coordenadas a menos de 20 metros de la anterior para verificar suma agregada
                'ubicacion_vivienda': Point(-79.67575, 0.92990, srid=4326),
                'numero_integrantes': 4,
                'ninos_menores_5': 1,
                'adultos_mayores': 1,
                'personas_discapacidad': 1,
                'danos_vivienda': 'PARCIAL',
                'requiere_evacuacion_inmediata': True,
            },
            {
                'codigo_censo': 'CENSO-ESM-03',
                'jefe_familia_nombre': 'Mariana Estupiñán Caicedo',
                'jefe_familia_cedula': '0801894562',
                'telefono_contacto': '0993456781',
                'barrio_sector': 'Las 50 Casas / Ribera Río Teaone',
                'direccion_referencia': 'Manzana D Villa 14 Ribera Teaone',
                'ubicacion_vivienda': Point(-79.66750, 0.92850, srid=4326),
                'numero_integrantes': 6,
                'ninos_menores_5': 3,
                'adultos_mayores': 1,
                'personas_discapacidad': 0,
                'danos_vivienda': 'PARCIAL',
                'requiere_evacuacion_inmediata': True,
            },
            {
                'codigo_censo': 'CENSO-ESM-04',
                'jefe_familia_nombre': 'Rosaura Valencia Bone',
                'jefe_familia_cedula': '0803456128',
                'telefono_contacto': '0987654129',
                'barrio_sector': 'Isla Piedad',
                'direccion_referencia': 'Sector Muelle Pesquero Ribera Baja',
                'ubicacion_vivienda': Point(-79.65820, 0.96810, srid=4326),
                'numero_integrantes': 3,
                'ninos_menores_5': 0,
                'adultos_mayores': 2,
                'personas_discapacidad': 1,
                'danos_vivienda': 'LEVE',
                'requiere_evacuacion_inmediata': False,
            }
        ]

        for f in familias_data:
            fam = FamiliaCenso.objects.filter(codigo_censo=f['codigo_censo']).first()
            if not fam:
                fam = FamiliaCenso.objects.create(
                    codigo_censo=f['codigo_censo'],
                    jefe_familia_nombre=f['jefe_familia_nombre'],
                    jefe_familia_cedula=f['jefe_familia_cedula'],
                    telefono_contacto=f['telefono_contacto'],
                    barrio_sector=f['barrio_sector'],
                    direccion_referencia=f['direccion_referencia'],
                    ubicacion_vivienda=f['ubicacion_vivienda'],
                    numero_integrantes=f['numero_integrantes'],
                    ninos_menores_5=f['ninos_menores_5'],
                    adultos_mayores=f['adultos_mayores'],
                    personas_discapacidad=f['personas_discapacidad'],
                    danos_vivienda=f['danos_vivienda'],
                    requiere_evacuacion_inmediata=f['requiere_evacuacion_inmediata'],
                    censador=digitalizador_user
                )
                self.stdout.write(self.style.SUCCESS(f"Familia censada creada: {fam.codigo_censo} - {fam.jefe_familia_nombre}"))
            else:
                fam.ubicacion_vivienda = f['ubicacion_vivienda']
                fam.numero_integrantes = f['numero_integrantes']
                fam.ninos_menores_5 = f['ninos_menores_5']
                fam.adultos_mayores = f['adultos_mayores']
                fam.personas_discapacidad = f['personas_discapacidad']
                if digitalizador_user:
                    fam.censador = digitalizador_user
                fam.save()
                self.stdout.write(self.style.SUCCESS(f"Familia censada actualizada: {fam.codigo_censo}"))

        self.stdout.write(self.style.SUCCESS("Poblado de datos Hackathon completado con éxito."))
