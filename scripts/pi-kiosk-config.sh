#!/bin/bash
# Raspberry Pi Kiosk Mode Configuration - X11 LXDE
# Two goals:
# 1. Rotate 1920x1080 display left 90 degrees
# 2. Launch Chromium in kiosk mode

set -e

KIOSK_URL="${1:-http://localhost:5173?display=tv}"

echo "🖥️  Configuring X11 kiosk mode..."
echo "📍 URL: $KIOSK_URL"

# Create autostart directory
mkdir -p ~/.config/lxsession/LXDE-pi

# Create LXDE autostart file (don't start lxpanel or pcmanfm for true kiosk)
cat > ~/.config/lxsession/LXDE-pi/autostart << EOF
# Disable screen blanking
@xset s off
@xset -dpms
@xset s noblank

# Set resolution first, then rotate (two separate commands to avoid BadMatch)
@sh -c "sleep 2 && xrandr --output HDMI-A-1 --mode 1920x1080"
@sh -c "sleep 3 && xrandr --output HDMI-A-1 --rotate left"

# Hide cursor
@unclutter -idle 0.1 -root

# Launch Chromium in kiosk mode
@chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --disable-restore-session-state --disable-session-crashed-bubble $KIOSK_URL
EOF

echo "✅ Kiosk configuration created!"
echo ""
echo "Test with: startx"
echo "Configure autologin: sudo raspi-config -> System Options -> Boot / Auto Login -> Desktop Autologin"
echo "Then reboot: sudo reboot"
