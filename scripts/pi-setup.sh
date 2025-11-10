#!/bin/bash
# Raspberry Pi Setup - Simple X11 kiosk essentials

set -e

echo "🍓 Setting up Raspberry Pi for X11 kiosk mode..."

# Update system
echo "📦 Updating packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "🎨 Installing required packages..."
sudo apt install -y \
  chromium-browser \
  unclutter \
  x11-xserver-utils

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: cd ~/winston-slots/scripts && ./pi-kiosk-config.sh"
echo "2. Configure autologin via: sudo raspi-config"
echo "3. Reboot: sudo reboot"
