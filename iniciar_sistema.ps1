# Iniciar Sistema Unificado Esmeraldas Resiliente 6B (Puertos 8080 y 8000)
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "         ESMERALDAS RESILIENTE 6B - SALA DE CRISIS COE & PLATAFORMA INTEGRAL   " -ForegroundColor Yellow
Write-Host "                (SERVIDOR UNIFICADO EN PUERTOS 8080 Y 8000)                    " -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$env:PATH = "C:\Program Files\nodejs;C:\Users\LAB2_PC19\AppData\Local\Programs\Python\Python312;" + $env:PATH
$rootDir = $PSScriptRoot

Write-Host "[1/2] Compilando Frontend React con Vite..." -ForegroundColor Magenta
Set-Location -Path "$rootDir\Frontend"
& "C:\Program Files\nodejs\npm.cmd" run build

Write-Host ""
Write-Host "[2/2] Encendiendo Servidor Unificado..." -ForegroundColor Magenta
Write-Host "👉 Acceso Principal:   http://localhost:8080/" -ForegroundColor Green
Write-Host "👉 Acceso Alternativo: http://localhost:8000/" -ForegroundColor Green
Write-Host "👉 APIs Geoespaciales: http://localhost:8080/api/v1/" -ForegroundColor Cyan
Write-Host ""

Start-Process "http://localhost:8080/"

Set-Location -Path "$rootDir\Backend"
& "C:\Users\LAB2_PC19\AppData\Local\Programs\Python\Python312\python.exe" server_dual_port.py
