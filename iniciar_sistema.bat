@echo off
chcp 65001 >nul
title Esmeraldas Resiliente 6B - Servidor Unificado (Puertos 8080 y 8000)
color 0A

echo ===============================================================================
echo            ESMERALDAS RESILIENTE 6B - SALA DE CRISIS COE & PLATAFORMA INTEGRAL
echo                    (SERVIDOR UNIFICADO EN PUERTOS 8080 Y 8000)
echo ===============================================================================
echo.

:: Detectar ruta de Python
set "PYTHON_EXE=python"
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
)

:: Asegurar Node.js en PATH para compilar assets si hubo cambios
set "PATH=C:\Program Files\nodejs;%PATH%"

echo [1/2] Compilando e integrando Frontend React (Vite)...
cd /d "%~dp0Frontend"
call "C:\Program Files\nodejs\npm.cmd" run build

echo.
echo [2/2] Encendiendo Servidor Unificado (Frontend + Backend + Aiven PostGIS)...
echo.
echo ===============================================================================
echo   ¡ACCESO INMEDIATO Y FLUIDO EN EL MISMO SERVIDOR!
echo.
echo   👉 Sala de Crisis COE (Principal): http://localhost:8080/
echo   👉 Acceso alternativo:            http://localhost:8000/
echo   👉 APIs REST Geoespaciales:       http://localhost:8080/api/v1/
echo   👉 Base Espacial PostGIS:         Aiven Cloud (defaultdb - Conectado)
echo ===============================================================================
echo.

start http://localhost:8080/

cd /d "%~dp0Backend"
"%PYTHON_EXE%" server_dual_port.py
