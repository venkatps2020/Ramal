#!/bin/bash
# Rebuilds the static export, repackages the unpacked (non-DMG) Electron app,
# and copies it into /Applications, replacing any previous copy. This is the
# "keep /Applications/Ramal.app in sync after a code change" step -- run via
# `npm run electron:install`. See CLAUDE.md "Electron packaging" for why this
# is a manual-but-cheap re-sync step rather than a live dev-server pointer or
# a background file watcher (owner decision, 2026-08-26).
set -euo pipefail
cd "$(dirname "$0")/.."

ELECTRON_BUILD=true npx next build
npx electron-builder --mac --dir

APP_PATH=$(find dist-electron -maxdepth 2 -name "*.app" -print -quit)
if [ -z "$APP_PATH" ]; then
  echo "Could not find a built .app under dist-electron/ -- electron-builder may have failed or changed its output layout." >&2
  exit 1
fi

APP_NAME=$(basename "$APP_PATH")
rm -rf "/Applications/$APP_NAME"
cp -R "$APP_PATH" "/Applications/$APP_NAME"
echo "Installed $APP_NAME to /Applications"
