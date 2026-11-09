# Lanzador Unificado en PowerShell para Esmeraldas Resiliente 6B (Mismo Puerto 8000)
$ErrorActionPreference = "SilentlyContinue"

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "         ESMERALDAS RESILIENTE 6B - CENTRO DE MANDO Y SALA DE CRISIS COE" -ForegroundColor Yellow
Write-Host "                    (SERVIDOR UNIFICADO EN PUERTO 8000)" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
$pyExe = "python"
if (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe") {
    $pyExe = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
}
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH

Write-Host "[1/2] Compilando e integrando Frontend React..." -ForegroundColor Green
Set-Location "$root\Frontend"
& "C:\Program Files\nodejs\npm.cmd" run build

Write-Host "[2/2] Encendiendo Servidor Django en http://localhost:8000/ ..." -ForegroundColor Green
Start-Process "http://localhost:8000/"
Set-Location "$root\Backend"
& $pyExe manage.py runserver 0.0.0.0:8000
