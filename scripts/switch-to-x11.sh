#!/bin/bash
# Force Raspberry Pi to use X11 instead of Wayland

set -e

echo "🔧 Configuring Pi to use X11..."

# Force X11 by setting environment variable
sudo tee /etc/environment.d/10-x11.conf > /dev/null << 'EOF'
# Force X11 instead of Wayland
QT_QPA_PLATFORM=xcb
GDK_BACKEND=x11
EOF

# Also set in profile
if ! grep -q "export GDK_BACKEND=x11" ~/.profile; then
    cat >> ~/.profile << 'EOF'

# Force X11
export GDK_BACKEND=x11
export QT_QPA_PLATFORM=xcb
EOF
fi

# Configure raspi-config to boot to desktop with autologin
echo "🖥️  Configuring auto-login to desktop..."

# This is the raspi-config command to enable desktop autologin
sudo raspi-config nonint do_boot_behaviour B4

echo "✅ X11 configured!"
echo ""
echo "Now run: cd ~/winston-slots/scripts && ./pi-kiosk-config.sh"
echo "Then reboot: sudo reboot"
