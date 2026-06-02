@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     SUPRA — Iniciando Sistema                       ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo 🚀 Iniciando servidor...
echo.
echo ════════════════════════════════════════════════════════
echo   Acesse no navegador: http://localhost:3001
echo   Para a equipe na rede: http://[IP-DESTE-PC]:3001
echo ════════════════════════════════════════════════════════
echo.
cd /d "%~dp0server"
node index.js
pause
