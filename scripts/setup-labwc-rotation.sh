#!/bin/bash
# Configure labwc (the actual Wayland compositor running on your Pi)

set -e

echo "🔄 Configuring labwc display rotation..."

# Create labwc config directory
mkdir -p ~/.config/labwc

# Create labwc output configuration
cat > ~/.config/labwc/rc.xml << 'EOF'
<?xml version="1.0"?>
<labwc_config>
  <!-- Output configuration -->
  <output name="HDMI-A-1">
    <mode>1920x1080@60</mode>
    <transform>90</transform>
  </output>

  <!-- Disable screen blanking -->
  <dpms>off</dpms>

  <!-- Autostart applications -->
  <autostart>
    <command>unclutter -idle 0.1</command>
    <command>chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --disable-restore-session-state --disable-session-crashed-bubble http://localhost:5173?display=tv</command>
  </autostart>
</labwc_config>
EOF

# Also remove conflicting configs
echo "🧹 Cleaning up conflicting configurations..."

# Remove LXDE autostart xrandr commands that don't work on Wayland
if [ -f ~/.config/lxsession/LXDE-pi/autostart ]; then
    echo "Removing LXDE autostart (not needed with labwc)"
    rm -f ~/.config/lxsession/LXDE-pi/autostart
fi

# Remove wayfire config since we're using labwc
if [ -f ~/.config/wayfire/wayfire.ini ]; then
    echo "Removing Wayfire config (using labwc instead)"
    rm -f ~/.config/wayfire/wayfire.ini
fi

# Remove boot config rotation (let Wayland handle it)
echo "Removing boot config display rotation..."
sudo sed -i '/^display_hdmi_rotate=/d' /boot/firmware/config.txt
sudo sed -i '/^hdmi_group=/d' /boot/firmware/config.txt
sudo sed -i '/^hdmi_mode=/d' /boot/firmware/config.txt

echo "✅ labwc rotation configured!"
echo ""
echo "Configuration created at ~/.config/labwc/rc.xml"
echo "Settings:"
echo "  - Compositor: labwc (Wayland)"
echo "  - Output: HDMI-A-1"
echo "  - Mode: 1920x1080@60"
echo "  - Transform: 90 (portrait, rotated left)"
echo ""
echo "Reboot to apply: sudo reboot"
