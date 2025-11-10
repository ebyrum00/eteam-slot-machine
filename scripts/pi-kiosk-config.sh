#!/bin/bash
# Raspberry Pi Kiosk Mode Configuration - X11 ONLY
# Two goals:
# 1. Rotate 1920x1080 display left 90 degrees
# 2. Launch Chromium in kiosk mode

set -e

KIOSK_URL="${1:-http://localhost:5173?display=tv}"

echo "🖥️  Configuring X11 kiosk mode..."
echo "📍 URL: $KIOSK_URL"

# Create autostart directory
mkdir -p ~/.config/lxsession/LXDE-pi

# Create LXDE autostart file
cat > ~/.config/lxsession/LXDE-pi/autostart << EOF
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi

# Disable screen blanking
@xset s off
@xset -dpms
@xset s noblank

# Rotate display left (90 degrees counterclockwise)
@xrandr --output HDMI-A-1 --mode 1920x1080 --rotate left

# Hide cursor
@unclutter -idle 0.1 -root

# Launch Chromium in kiosk mode
@chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run $KIOSK_URL
EOF

echo "✅ Kiosk configuration created!"
echo ""
echo "Next steps:"
echo "1. Configure autologin (if not already done):"
echo "   sudo raspi-config"
echo "   Select: System Options -> Boot / Auto Login -> Desktop Autologin"
echo ""
echo "2. Reboot: sudo reboot"
echo ""
echo "The display will auto-rotate and launch Chromium on boot."
