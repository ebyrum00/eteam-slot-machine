#!/bin/bash
# Configure display rotation at boot level (kernel parameter)
# This is more reliable than xrandr on Pi 5

set -e

echo "🔄 Configuring display rotation at boot level..."

# Backup cmdline.txt
sudo cp /boot/firmware/cmdline.txt /boot/firmware/cmdline.txt.backup

# Read current cmdline
CMDLINE=$(cat /boot/firmware/cmdline.txt)

# Remove any existing video= parameter for HDMI-A-1
CMDLINE=$(echo "$CMDLINE" | sed 's/video=HDMI-A-1:[^ ]*//g')

# Add rotation parameter: rotate=1 is 90° clockwise (left from viewer perspective for portrait)
# rotate=1 = 90° clockwise
# rotate=3 = 270° clockwise (90° counter-clockwise)
NEW_PARAM="video=HDMI-A-1:1920x1080@30,rotate=1"

# Add the new parameter
echo "$CMDLINE $NEW_PARAM" | sudo tee /boot/firmware/cmdline.txt > /dev/null

echo "✅ Display rotation configured!"
echo ""
echo "The display will be rotated 90° left (portrait mode) on next boot."
echo "Reboot to apply: sudo reboot"
