#!/bin/bash
# Enable autologin to LXDE desktop for user pi

set -e

echo "🔐 Enabling autologin to desktop..."

# Method 1: Configure LightDM autologin
sudo mkdir -p /etc/lightdm/lightdm.conf.d
sudo tee /etc/lightdm/lightdm.conf.d/50-autologin.conf > /dev/null << 'EOF'
[Seat:*]
autologin-user=pi
autologin-user-timeout=0
EOF

# Method 2: Set default boot target to graphical
sudo systemctl set-default graphical.target

# Enable and start lightdm
sudo systemctl enable lightdm
sudo systemctl start lightdm || true

echo "✅ Autologin configured!"
echo ""
echo "Reboot now: sudo reboot"
echo ""
echo "After reboot, the system should:"
echo "  1. Auto-login to desktop"
echo "  2. Rotate display to portrait"
echo "  3. Launch Chrome in kiosk mode"
