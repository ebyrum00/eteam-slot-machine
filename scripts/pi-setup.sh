#!/bin/bash
# Raspberry Pi 5 Setup Script for Graphics-Intensive Kiosk Display
# This script optimizes the Pi for displaying the slot machine interface

set -e

echo "🍓 Setting up Raspberry Pi 5 for Kiosk Mode..."

# Update system
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install required packages for graphics performance
echo "🎨 Installing graphics and display packages..."
sudo apt install -y \
  chromium-browser \
  unclutter \
  xdotool \
  x11-xserver-utils \
  xinit \
  openbox \
  lightdm \
  mesa-utils \
  libgl1-mesa-dri \
  libgles2-mesa

# Install compositor for better performance
sudo apt install -y compton

# Disable unnecessary services to free up resources
echo "⚡ Optimizing system resources..."
sudo systemctl disable bluetooth.service
sudo systemctl disable avahi-daemon.service
sudo systemctl disable triggerhappy.service

# Configure GPU memory split (increase for better graphics)
echo "🎮 Configuring GPU memory allocation..."
if ! grep -q "gpu_mem=256" /boot/firmware/config.txt; then
  echo "gpu_mem=256" | sudo tee -a /boot/firmware/config.txt
fi

# Enable hardware acceleration
if ! grep -q "dtoverlay=vc4-kms-v3d" /boot/firmware/config.txt; then
  echo "dtoverlay=vc4-kms-v3d" | sudo tee -a /boot/firmware/config.txt
fi

# Disable screen blanking
echo "🖥️  Disabling screen blanking..."
sudo sed -i 's/#xserver-command=X/xserver-command=X -s 0 -dpms/' /etc/lightdm/lightdm.conf

echo "✅ Setup complete! Please reboot for changes to take effect."
echo "Run ./pi-kiosk-config.sh after reboot to configure kiosk mode."
