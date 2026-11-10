@echo off
chcp 65001 > nul
title Iniciar Servidor de Identidad Keycloak - Esmeraldas Resiliente

echo ==============================================================================
echo       ESMERALDAS RESILIENTE 6B - SERVIDOR DE AUTENTICACIÓN KEYCLOAK
echo ==============================================================================
echo.
echo Verificando que Docker Desktop esté en ejecución...
docker info > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker no está respondiendo.
    echo Asegúrate de abrir la aplicación "Docker Desktop" primero y vuelve a intentarlo.
    echo.
    pause
    exit /b 1
)

echo.
echo [1/2] Levantando contenedor Keycloak conectado a Aiven Cloud...
cd /d "%~dp0"
if not exist "%~dp0.env" (
    if exist "%~dp0.env.example" (
        copy "%~dp0.env.example" "%~dp0.env" > nul
    )
)
docker compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [2/2] ¡Keycloak iniciado correctamente!
    echo ==============================================================================
    echo  URL Consola de Administración : http://localhost:8080
    echo  Usuario Administrador        : admin
    echo  Contraseña                   : Esmeraldas2026*
    echo  Base de Datos Remota         : Aiven PostgreSQL (Persistencia en la Nube)
    echo ==============================================================================
    echo.
    echo Esperando unos segundos para inicialización de servicios...
    timeout /t 5 > nul
    start http://localhost:8080
) else (
    echo.
    echo [ERROR] Ocurrió un problema al levantar el contenedor con docker compose.
    echo Si el puerto 8080 está ocupado por otro contenedor, puedes cambiar el puerto
    echo en el archivo docker-compose.yml (ejemplo: "8081:8080").
)

echo.
pause
