# scripts/install-deps.ps1
# Script para instalar dependencias ignorando scripts propensos a fallos por el caracter '&' en la ruta,
# y luego descargar el binario precompilado de better-sqlite3 manualmente de forma segura.

$nodePath = "C:\Program Files\nodejs"
if ($env:Path -notlike "*$nodePath*") {
    $env:Path = $env:Path + ";" + $nodePath
}

Write-Host "PATH configurado con Node.js" -ForegroundColor Green

# 1. Instalar todas las dependencias ignorando los scripts de ciclo de vida
Write-Host "Instalando paquetes npm con --ignore-scripts..." -ForegroundColor Yellow
& "$nodePath\npm.cmd" install --ignore-scripts

# 2. Descargar el binario precompilado de better-sqlite3 manualmente
Write-Host "Instalando binario de better-sqlite3 manualmente..." -ForegroundColor Yellow
cd "node_modules/better-sqlite3"

# Ejecutar prebuild-install directamente con node usando rutas protegidas por comillas
& "$nodePath\node.exe" "../../node_modules/prebuild-install/bin.js"

Write-Host "Proceso completado." -ForegroundColor Green
