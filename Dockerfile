# ==============================================================================
# DOCKERFILE MULTI-ETAPA: ESMERALDAS RESILIENTE 6B (DEPLOY RENDER / PRODUCCIÓN)
# ==============================================================================

# ETAPA 1: Compilación de Frontend React (Vite + Tailwind + Leaflet)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/Frontend
COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ ./
RUN npm run build

# ETAPA 2: Backend GeoDjango 5.1 con PostGIS (GDAL + GEOS + PROJ) en Debian Bookworm
FROM python:3.12-slim-bookworm

# Evitar prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8080

# Instalar librerías nativas del sistema requeridas por GeoDjango y PostGIS
RUN apt-get update && apt-get install -y --no-install-recommends \
    binutils \
    libproj-dev \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Variables de compilación y enlaces C/C++ para GDAL
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

WORKDIR /app

# Instalar dependencias Python
COPY Backend/requirements.txt ./Backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./Backend/requirements.txt

# Copiar código fuente del Backend
COPY Backend/ ./Backend/

# Copiar el Frontend compilado desde la Etapa 1
COPY --from=frontend-builder /app/Frontend/dist ./Frontend/dist

WORKDIR /app/Backend

# Recolectar archivos estáticos
RUN python manage.py collectstatic --noinput || true

# Exponer puerto para Render
EXPOSE 8080

# Comando de arranque en producción: migraciones iniciales, sembrado de usuarios hackathon y servidor WSGI con Gunicorn
CMD ["sh", "-c", "python manage.py migrate --fake-initial && python manage.py seed_hackathon_users || true && gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 2 --threads 4 --timeout 120"]

