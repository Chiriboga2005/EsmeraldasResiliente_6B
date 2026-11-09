@echo off
chcp 65001 >nul
title Esmeraldas Resiliente 6B - Lanzador Unificado COE
color 0B

echo ===============================================================================
echo            ESMERALDAS RESILIENTE 6B - CENTRO DE MANDO Y SALA DE CRISIS COE
echo ===============================================================================
echo.

:: Detectar ruta de Python
set "PYTHON_EXE=python"
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
)

:: Asegurar Node.js en PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

echo [1/3] Encendiendo Backend Django (PostGIS Aiven Cloud) en http://localhost:8000/ ...
start "Backend COE - Django REST" cmd /k "title Backend COE && cd /d "%~dp0Backend" && "%PYTHON_EXE%" manage.py runserver 0.0.0.0:8000"

echo [2/3] Encendiendo Frontend Vite (React + Leaflet + Dexie) en http://localhost:5173/ ...
start "Frontend COE - Vite React" cmd /k "title Frontend COE && cd /d "%~dp0Frontend" && npm run dev"

echo [3/3] Abriendo la Sala de Crisis en tu navegador...
timeout /t 3 /nobreak >nul
start http://localhost:5173/

echo.
echo ===============================================================================
echo   ¡TODO PRENDIDO CORRECTAMENTE!
echo.
echo   - Sala de Crisis Frontend : http://localhost:5173/
echo   - Backend APIs REST        : http://localhost:8000/api/v1/
echo   - Base de Datos Espacial  : Aiven Cloud PostGIS (defaultdb)
echo ===============================================================================
echo Puedes minimizar esta ventana. Para apagar el sistema cierra las ventanas emergentes.
pause
