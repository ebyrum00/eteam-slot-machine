#!/bin/bash
# Configure display rotation for labwc using kanshi

set -e

echo "🔄 Configuring display rotation for labwc..."

# Install kanshi if not already installed
if ! command -v kanshi &> /dev/null; then
    echo "📦 Installing kanshi..."
    sudo apt install -y kanshi
fi

# Create kanshi config directory
mkdir -p ~/.config/kanshi

# Create kanshi configuration for display rotation
cat > ~/.config/kanshi/config << 'EOF'
profile {
  output HDMI-A-1 mode 1920x1080@60Hz position 0,0 transform 90
}
EOF

# Create or update labwc rc.xml to autostart kanshi and chromium
mkdir -p ~/.config/labwc

cat > ~/.config/labwc/rc.xml << 'EOF'
<?xml version="1.0"?>
<labwc_config>
  <!-- Core settings -->
  <core>
    <gap>0</gap>
  </core>

  <!-- Disable keyboard bindings for kiosk -->
  <keyboard>
    <default />
  </keyboard>

  <!-- Autostart applications -->
  <autostart>
    <!-- Start kanshi for display configuration -->
    <command>kanshi</command>

    <!-- Hide cursor -->
    <command>unclutter -idle 0.1</command>

    <!-- Launch Chromium in kiosk mode -->
    <command>chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --disable-restore-session-state --disable-session-crashed-bubble http://localhost:5173?display=tv</command>
  </autostart>
</labwc_config>
EOF

echo "✅ Display rotation configured!"
echo ""
echo "Configuration files created:"
echo "  - ~/.config/kanshi/config (display rotation)"
echo "  - ~/.config/labwc/rc.xml (autostart)"
echo ""
echo "Settings:"
echo "  - Output: HDMI-A-1"
echo "  - Mode: 1920x1080@60Hz"
echo "  - Transform: 90 (portrait, rotated left)"
echo ""
echo "Reboot to apply: sudo reboot"
