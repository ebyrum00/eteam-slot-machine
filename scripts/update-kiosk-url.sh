#!/bin/bash
# Update kiosk URL to point to development machine

set -e

if [ -z "$1" ]; then
    echo "Usage: ./update-kiosk-url.sh <backend-ip>"
    echo ""
    echo "Example: ./update-kiosk-url.sh 192.168.100.123"
    echo ""
    echo "This will configure Chromium to connect to:"
    echo "  http://<backend-ip>:5173?display=tv"
    exit 1
fi

BACKEND_IP="$1"
KIOSK_URL="http://${BACKEND_IP}:5173?display=tv"

echo "🔄 Updating kiosk URL to: $KIOSK_URL"

# Update labwc rc.xml
if [ -f ~/.config/labwc/rc.xml ]; then
    echo "Updating labwc configuration..."
    sed -i "s|http://localhost:5173?display=tv|${KIOSK_URL}|g" ~/.config/labwc/rc.xml
    echo "✅ labwc updated"
else
    echo "⚠️  labwc config not found"
fi

# Update LXDE autostart if it exists
if [ -f ~/.config/lxsession/LXDE-pi/autostart ]; then
    echo "Updating LXDE autostart..."
    sed -i "s|http://localhost:5173?display=tv|${KIOSK_URL}|g" ~/.config/lxsession/LXDE-pi/autostart
    echo "✅ LXDE autostart updated"
fi

echo ""
echo "✅ Configuration updated!"
echo ""
echo "New URL: $KIOSK_URL"
echo ""
echo "Make sure your development machine firewall allows connections on port 5173"
echo "Test the URL first: curl http://${BACKEND_IP}:5173"
echo ""
echo "Restart labwc or reboot: sudo reboot"
