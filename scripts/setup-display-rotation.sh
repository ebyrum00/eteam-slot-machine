#!/bin/bash
# Configure display rotation using config.txt (proper method for Pi 5)

set -e

echo "🔄 Configuring display rotation in config.txt..."

# Backup config.txt
sudo cp /boot/firmware/config.txt /boot/firmware/config.txt.backup

# Remove any existing display rotation settings
sudo sed -i '/^display_lcd_rotate=/d' /boot/firmware/config.txt
sudo sed -i '/^display_hdmi_rotate=/d' /boot/firmware/config.txt
sudo sed -i '/^dtoverlay=vc4-kms-v3d/d' /boot/firmware/config.txt

# Add display configuration
# display_hdmi_rotate=1 means 90° clockwise (portrait, rotated left from viewer)
# display_hdmi_rotate=3 means 270° clockwise (90° counter-clockwise)
cat <<'EOF' | sudo tee -a /boot/firmware/config.txt

# Display configuration for portrait mode
dtoverlay=vc4-kms-v3d
display_hdmi_rotate=1
hdmi_group=2
hdmi_mode=82
EOF

echo "✅ Display rotation configured in config.txt!"
echo ""
echo "Settings applied:"
echo "  - display_hdmi_rotate=1 (90° clockwise / portrait left)"
echo "  - hdmi_group=2 hdmi_mode=82 (1920x1080 60Hz)"
echo ""
echo "Reboot to apply: sudo reboot"
