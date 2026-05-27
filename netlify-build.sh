#!/bin/bash
# Netlify build: compiles all 3 apps + landing page into dist/

set -e

echo "=== Building Lottery Demo for Netlify ==="

# Install deps for all apps
echo "--- Installing frontend deps ---"
cd frontend && npm install && cd ..

echo "--- Installing backoffice deps ---"
cd backoffice && npm install && cd ..

echo "--- Installing POS deps ---"
cd pos && npm install && cd ..

# Build each app with /api proxy (Netlify handles the redirect)
echo "--- Building Player Frontend ---"
cd frontend
VITE_API_URL=/api npx vite build --outDir ../dist/app --base /app/
cd ..

echo "--- Building Admin Backoffice ---"
cd backoffice
VITE_API_URL=/api npx vite build --outDir ../dist/admin --base /admin/
cd ..

echo "--- Building POS Terminal ---"
cd pos
VITE_API_URL=/api npx vite build --outDir ../dist/pos --base /pos/
cd ..

# Copy landing page and widget.js to root
cp landing/index.html dist/
cp frontend/public/widget.js dist/

echo "=== Build complete ==="
