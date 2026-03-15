#!/bin/bash
set -e

echo "=== Pulling latest code ==="
cd ~/stellar-wallet
git pull

echo "=== Installing backend dependencies ==="
cd packages/backend
npm install
npm run db:push

echo "=== Building web app ==="
cd ../web-app
npm install
npm run build

echo "=== Restarting backend ==="
pm2 restart stellar-backend

echo "=== Done! ==="
