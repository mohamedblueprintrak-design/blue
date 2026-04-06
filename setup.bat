@echo off
title BluePrint Setup
color 0A
echo ============================================
echo   BluePrint - Engineering Consultancy ERP
echo   Windows Setup Script
echo ============================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] npm is not available!
    pause
    exit /b 1
)

echo [1/4] Creating .env file...
if not exist .env (
    copy .env.example .env >nul 2>nul
    if not exist .env (
        echo DATABASE_URL="file:./db/custom.db" > .env
        echo NEXTAUTH_SECRET="blueprint-dev-secret-key-2025-do-not-use-in-production" >> .env
        echo NEXTAUTH_URL="http://localhost:3000" >> .env
    )
    echo   [OK] .env file created
) else (
    echo   [OK] .env file already exists
)

echo.
echo [2/4] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)
echo   [OK] Dependencies installed

echo.
echo [3/4] Setting up database...
call npx prisma db push --skip-generate
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Database setup failed!
    pause
    exit /b 1
)
echo   [OK] Database tables created

echo.
echo [4/4] Seeding demo data...
call npx tsx prisma/seed.ts
if %ERRORLEVEL% NEQ 0 (
    echo   [WARN] Seed had issues, but database is ready
) else (
    echo   [OK] Demo data seeded
)

echo.
color 0A
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo   Login: admin@blueprint.ae / admin123
echo   URL:   http://localhost:3000
echo.
echo   Starting dev server...
echo   Press Ctrl+C to stop
echo ============================================
echo.
call npm run dev
