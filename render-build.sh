#!/usr/bin/env bash
# ==========================================
# DeSci Sentinel - Render Build Script
# ==========================================
# Render sometimes ignores rootDir for Node environments and defaults to "yarn start"
# at the root of the repository. This script violently forces it to use NPM and 
# explicitly changes directories to ensure the build succeeds.

echo ">>> Starting DeSci Sentinel Build Script <<<"

# Backend Build
if [ "$RENDER_SERVICE_NAME" == "desci-sentinel-backend" ]; then
  echo ">>> Building Backend <<<"
  cd bio-scholar-backend
  npm ci
  npm run build
  echo ">>> Backend Build Complete <<<"
fi

# Frontend Build
if [ "$RENDER_SERVICE_NAME" == "desci-sentinel-frontend" ]; then
  echo ">>> Building Frontend <<<"
  cd Frontend
  npm ci
  npm run build
  echo ">>> Frontend Build Complete <<<"
fi
