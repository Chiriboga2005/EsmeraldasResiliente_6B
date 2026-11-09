@echo off
chcp 65001 >nul
title Esmeraldas Resiliente 6B - Servidor Unificado (Frontend + Backend en Puerto 8000)
color 0A

echo ===============================================================================
echo            ESMERALDAS RESILIENTE 6B - CENTRO DE MANDO Y SALA DE CRISIS COE
echo                    (SERVIDOR UNIFICADO EN EL PUERTO 8000)
echo ===============================================================================
echo.

:: Detectar ruta de Python
set "PYTHON_EXE=python"
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
)

:: Asegurar Node.js en PATH para compilar assets si hubo cambios
set "PATH=C:\Program Files\nodejs;%PATH%"

echo [1/2] Compilando e integrando Frontend React en Django...
cd /d "%~dp0Frontend"
call "C:\Program Files\nodejs\npm.cmd" run build

echo.
echo [2/2] Encendiendo Servidor Unificado (Frontend + Backend + Aiven PostGIS)...
echo.
echo ===============================================================================
echo   ¡TODO PRENDIDO EN EL MISMO PUERTO (8000)!
echo.
echo   👉 Accede a la Sala de Crisis en: http://localhost:8000/
echo   👉 APIs REST Geoespaciales en:     http://localhost:8000/api/v1/
echo   👉 Base de Datos:                 Aiven Cloud PostGIS (defaultdb)
echo ===============================================================================
echo.

start http://localhost:8000/

cd /d "%~dp0Backend"
"%PYTHON_EXE%" manage.py runserver 0.0.0.0:8000
