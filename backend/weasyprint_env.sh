#!/usr/bin/env bash
# Usage: source ./weasyprint_env.sh
# Sets common environment vars so WeasyPrint can find GTK/Pango/Harfbuzz libs
# installed via Homebrew on macOS.

# Homebrew install prefix (Apple Silicon default). Override if you use Intel:
#   HOMEBREW_PREFIX=/usr/local source ./weasyprint_env.sh
HOMEBREW_PREFIX="${HOMEBREW_PREFIX:-/opt/homebrew}"

export PATH="${HOMEBREW_PREFIX}/bin:${PATH}"
export DYLD_LIBRARY_PATH="${HOMEBREW_PREFIX}/lib:${DYLD_LIBRARY_PATH}"
export PKG_CONFIG_PATH="${HOMEBREW_PREFIX}/lib/pkgconfig:${HOMEBREW_PREFIX}/share/pkgconfig:${PKG_CONFIG_PATH}"
export XDG_DATA_DIRS="${HOMEBREW_PREFIX}/share:${XDG_DATA_DIRS}"

echo "WeasyPrint env configured for Homebrew at: ${HOMEBREW_PREFIX}"
