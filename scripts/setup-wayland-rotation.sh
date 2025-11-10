#!/bin/bash
# Configure Wayland display rotation (definitive solution for Pi 5)

set -e

echo "🔄 Configuring Wayland display rotation..."

# Create Wayland config directory
mkdir -p ~/.config/wayfire

# Create wayfire.ini with rotation and output configuration
cat > ~/.config/wayfire/wayfire.ini << 'EOF'
[output:HDMI-A-1]
mode = 1920x1080@60
position = 0,0
transform = 90

[core]
plugins = autostart

[autostart]
screensaver_timeout = 0
dpms_timeout = 0

# Hide cursor
0_idle = unclutter -idle 0.1 &

# Launch Chromium in kiosk mode
chromium = chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --disable-restore-session-state --disable-session-crashed-bubble http://localhost:5173?display=tv
EOF

echo "✅ Wayland rotation configured!"
echo ""
echo "Wayfire configuration created at ~/.config/wayfire/wayfire.ini"
echo "Settings:"
echo "  - Output: HDMI-A-1"
echo "  - Mode: 1920x1080@60"
echo "  - Transform: 90 (portrait, rotated left)"
echo ""
echo "Reboot to apply: sudo reboot"
