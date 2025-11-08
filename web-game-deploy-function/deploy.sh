#!/bin/bash

# Web Game Deploy Function - Quick Deploy Script
# This script packages and deploys the function to Appwrite

echo "📦 Packaging function..."

# Create a clean directory for deployment
rm -rf .deploy
mkdir .deploy

# Copy necessary files
cp -r src .deploy/
cp package.json .deploy/
cp package-lock.json .deploy/ 2>/dev/null || true

cd .deploy

echo "📥 Installing production dependencies..."
npm install --production

echo "✅ Function packaged successfully!"
echo ""
echo "📤 Next steps:"
echo "1. Zip the .deploy folder or upload via Appwrite Console"
echo "2. Or use Appwrite CLI: appwrite deploy function"
echo ""
echo "Files ready in .deploy/ directory"

cd ..
