#!/usr/bin/env bash
# Script de compilación para Render en entorno nativo Linux (si no se usa Docker)
set -o errexit

echo "==> [1/4] Compilando Frontend React con Vite..."
cd ../Frontend
npm install
npm run build
cd ../Backend

echo "==> [2/4] Instalando dependencias de Python..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> [3/4] Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "==> [4/4] Aplicando migraciones de base de datos..."
python manage.py migrate --fake-initial

echo "==> Compilación completada con éxito."

