@echo off
chcp 65001 > nul
title Detener Keycloak - Esmeraldas Resiliente

echo ==============================================================================
echo       DETENIENDO SERVIDOR KEYCLOAK
echo ==============================================================================
echo.
cd /d "%~dp0"
docker compose down

echo.
echo Keycloak se ha detenido. Los datos permanecen guardados de forma segura en Aiven Cloud.
echo.
pause
