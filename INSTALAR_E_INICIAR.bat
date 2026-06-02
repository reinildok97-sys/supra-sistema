@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     SUPRA — Instalação e Inicialização              ║
echo ║     Sistema de Planejamento e Reposição Automática  ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo Por favor, instale o Node.js em: https://nodejs.org
    echo Baixe a versão LTS e instale normalmente.
    echo Depois execute este arquivo novamente.
    pause
    exit /b
)
echo ✅ Node.js encontrado.

:: Instalar dependências do servidor
echo.
echo 📦 Instalando dependências do servidor...
cd /d "%~dp0server"
call npm install --silent
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do servidor.
    pause
    exit /b
)
echo ✅ Servidor configurado.

:: Instalar dependências do cliente
echo.
echo 📦 Instalando dependências do cliente...
cd /d "%~dp0client"
call npm install --silent
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do cliente.
    pause
    exit /b
)
echo ✅ Cliente configurado.

:: Build do cliente
echo.
echo 🔨 Compilando interface...
call npm run build --silent
if %errorlevel% neq 0 (
    echo ❌ Erro ao compilar interface.
    pause
    exit /b
)
echo ✅ Interface compilada.

:: Iniciar servidor
echo.
echo 🚀 Iniciando SUPRA...
echo.
echo ════════════════════════════════════════════════════════
echo   Acesse no navegador: http://localhost:3001
echo   Para a equipe na rede: http://[IP-DESTE-PC]:3001
echo ════════════════════════════════════════════════════════
echo.
cd /d "%~dp0server"
node index.js
pause
