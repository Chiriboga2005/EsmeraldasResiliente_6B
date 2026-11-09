# 🌊 ESMERALDAS RESILIENTE 6B
### Sistema Integral de Gestión del Riesgo de Desastres, Monitoreo Climático y Ayuda Humanitaria
**Cantón Esmeraldas • Fenómeno de El Niño • Hackathon Académico**

[![Django](https://img.shields.io/badge/Django-5.1-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.6-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgis.net/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)

---

## 📌 1. Visión General del Proyecto
**"Esmeraldas Resiliente"** es una plataforma tecnológica geoespacial y comunitaria diseñada para la prevención, monitoreo hidrometeorológico en tiempo real, respuesta ante emergencias (inundaciones urbanas y deslizamientos de tierra) y canalización transparente de asistencia humanitaria para los 7 cantones de la provincia de Esmeraldas, Ecuador.

---

## 🏛️ 2. Arquitectura Multicapa
El sistema implementa una arquitectura desacoplada de 4 capas:
1. **Capa 1 (Clientes y Cartografía Interactiva):**
   - Single Page Application (SPA) en **React 18 + Vite** con diseño militar/gubernamental en **Tailwind CSS**.
   - Visor cartográfico en **Leaflet** con capas vectoriales GeoJSON, semáforos de riesgo y selector de mapa base (Carto Voyager CDN, Esri Calles, OSM, Satelital HD).
   - Soporte **Offline-First** para censadores y ciudadanía mediante almacenamiento local en IndexedDB (**Dexie.js**).
2. **Capa 2 (Seguridad y Gateway):**
   - Autenticación robusta con **Django REST Framework + SimpleJWT**.
   - Control de acceso basado en roles: Operador COE, Censador de Campo, Ciudadano y Administrador.
3. **Capa 3 (Servicios Backend, Reglas de Negocio e IA):**
   - APIs RESTful desarrolladas en **Django 5.1** y **GeoDjango**.
   - Telemetría climática en vivo conectada con **Open-Meteo** y **OpenWeatherMap**.
   - Motor predictivo y analítico con **Scikit-learn** (Módulo 6).
4. **Capa 4 (Persistencia Espacial y Fuentes Oficiales):**
   - Base de datos relacional y espacial **PostgreSQL 18 + PostGIS 3.6.4** alojada en la nube con **Aiven Cloud**.
   - Cumplimiento transaccional ACID y cálculos espaciales (`ST_Distance`, `ST_Contains`).

---

## 🚀 3. Despliegue en Render (Paso a Paso)

El proyecto incluye configuración nativa para desplegarse en **Render** mediante **Docker** (recomendado para GeoDjango con soporte GDAL nativo):

### Pasos en el Dashboard de Render:
1. Entra a [dashboard.render.com](https://dashboard.render.com/) e inicia sesión.
2. Haz clic en **"New +"** ➔ **"Web Service"**.
3. Conecta tu repositorio de GitHub: `https://github.com/EdwinG2001/EsmeraldasResiliente_6B`.
4. En **Language / Environment**, selecciona: **Docker**.
5. Render detectará automáticamente el archivo [`Dockerfile`](Dockerfile) en la raíz.
6. En la sección **Environment Variables (Variables de Entorno)**, añade:

| Variable | Valor Recomendado |
| :--- | :--- |
| `DEBUG` | `False` |
| `SECRET_KEY` | *(Generar o asignar una clave secreta segura)* |
| `ALLOWED_HOSTS` | `*` |
| `CORS_ALLOW_ALL_ORIGINS` | `True` |
| `CSRF_TRUSTED_ORIGINS` | `https://*.onrender.com` |
| `DATABASE_URL` | `postgres://avnadmin:<TU_PASSWORD_AIVEN>@dbesmeralda-resilieve-sistema-basededatos.f.aivencloud.com:24201/defaultdb?sslmode=require` |
| `OPENWEATHERMAP_API_KEY` | *(Opcional: Tu API key de OpenWeatherMap)* |
| `ESMERALDAS_LAT` | `0.9681` |
| `ESMERALDAS_LON` | `-79.6582` |

7. Haz clic en **"Create Web Service"**. Render compilará el frontend con Node 20, configurará las librerías GDAL/GEOS en Linux y levantará la aplicación con Gunicorn en pocos minutos.

---

## 💻 4. Ejecución en Local (Windows)

El sistema cuenta con un lanzador unificado de doble puerto (8080 y 8000) que compila el frontend e inicia el backend con un solo clic:

```bash
# Opción 1: Archivo Batch (doble clic)
iniciar_sistema.bat

# Opción 2: Script PowerShell
.\iniciar_sistema.ps1
```

- **Acceso Principal:** [http://localhost:8080/](http://localhost:8080/)
- **Acceso Alternativo:** [http://localhost:8000/](http://localhost:8000/)

---

## 👥 Equipo y Créditos
- **Proyecto:** Esmeraldas Resiliente 6B
- **Institución:** Hackathon de Ingeniería de Software y TI
- **Territorio:** Provincia de Esmeraldas, Ecuador
