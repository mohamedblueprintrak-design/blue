#!/bin/bash
echo "============================================"
echo "  BluePrint - Engineering Consultancy ERP"
echo "  Setup Script"
echo "============================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not available!"
    exit 1
fi

echo "[1/4] Creating .env file..."
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null
    if [ ! -f .env ]; then
        echo 'DATABASE_URL="file:./db/custom.db"' > .env
        echo 'NEXTAUTH_SECRET="blueprint-dev-secret-key-2025-do-not-use-in-production"' >> .env
        echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
    fi
    echo "  [OK] .env file created"
else
    echo "  [OK] .env file already exists"
fi

echo ""
echo "[2/4] Installing dependencies..."
npm install
echo "  [OK] Dependencies installed"

echo ""
echo "[3/4] Setting up database..."
npx prisma db push --skip-generate
echo "  [OK] Database tables created"

echo ""
echo "[4/4] Seeding demo data..."
npx tsx prisma/seed.ts
echo "  [OK] Demo data seeded"

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "  Login: admin@blueprint.ae / admin123"
echo "  URL:   http://localhost:3000"
echo ""
echo "  Starting dev server..."
echo "  Press Ctrl+C to stop"
echo "============================================"
echo ""
npm run dev
