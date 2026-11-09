# Lanzador Unificado en PowerShell para Esmeraldas Resiliente 6B
$ErrorActionPreference = "SilentlyContinue"

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "         ESMERALDAS RESILIENTE 6B - CENTRO DE MANDO Y SALA DE CRISIS COE" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
$pyExe = "python"
if (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe") {
    $pyExe = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
}
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH

Write-Host "[1/3] Iniciando Servidor Backend Django en http://localhost:8000/ ..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Backend COE && cd /d `"$root\Backend`" && `"$pyExe`" manage.py runserver 0.0.0.0:8000"

Write-Host "[2/3] Iniciando Servidor Frontend Vite en http://localhost:5173/ ..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Frontend COE && cd /d `"$root\Frontend`" && `"$env:ProgramFiles\nodejs\npm.cmd`" run dev"

Write-Host "[3/3] Abriendo navegador en http://localhost:5173/ ..." -ForegroundColor Green
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173/"

Write-Host "`nSistema prendido exitosamente." -ForegroundColor Cyan
