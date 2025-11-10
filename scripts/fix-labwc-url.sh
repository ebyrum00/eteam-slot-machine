#!/bin/bash
# Fix the Chromium URL in labwc rc.xml

MAC_IP="192.168.100.247"

echo "🔧 Fixing Chromium URL in labwc config..."

if [ ! -f ~/.config/labwc/rc.xml ]; then
    echo "❌ labwc rc.xml not found!"
    exit 1
fi

# Replace localhost with the actual IP
sed -i "s|http://localhost:5173|http://${MAC_IP}:5173|g" ~/.config/labwc/rc.xml

echo "✅ Updated labwc rc.xml"
echo ""
echo "New Chromium command:"
grep chromium-browser ~/.config/labwc/rc.xml
echo ""
echo "Kill Chromium to restart with new URL:"
echo "  pkill -9 chromium"
