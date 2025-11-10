#!/bin/bash
# Watchdog script to restart Chromium if it crashes
# This ensures the kiosk display stays running

KIOSK_URL="${KIOSK_URL:-http://localhost:5173?display=tv}"

while true; do
  # Check if Chromium is running
  if ! pgrep -x "chromium-browser" > /dev/null; then
    echo "$(date): Chromium crashed, restarting..."

    # Kill any zombie processes
    killall -9 chromium-browser 2>/dev/null || true

    # Wait a moment
    sleep 2

    # Restart Chromium
    DISPLAY=:0 chromium-browser \
      --kiosk \
      --noerrdialogs \
      --disable-infobars \
      --disable-session-crashed-bubble \
      --disable-restore-session-state \
      --no-first-run \
      --enable-gpu-rasterization \
      --enable-accelerated-2d-canvas \
      --enable-accelerated-video-decode \
      --ignore-gpu-blocklist \
      --use-gl=egl \
      "$KIOSK_URL" &
  fi

  # Check every 10 seconds
  sleep 10
done
