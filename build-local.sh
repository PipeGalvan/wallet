#!/bin/bash

echo "=== Build backend ==="
cd backend
npm ci
npm run build
cd ..

echo "=== Build frontend ==="
cd frontend
npm ci
npm run build
cd ..

echo "=== Comprimir para subir al servidor ==="
tar -czvf wallet-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='backend/src' \
  --exclude='frontend/src' \
  -C .. wallet

echo ""
echo "Listo! Subi wallet-deploy.tar.gz al servidor con WinSCP"
echo "Luego en el servidor ejecuta:"
echo "  cd /home/nuntius-docker"
echo "  tar -xzvf wallet-deploy.tar.gz"
echo "  cd wallet"
echo "  docker compose up -d --build"
