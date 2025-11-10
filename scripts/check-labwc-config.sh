#!/bin/bash
# Check labwc configuration

echo "Checking labwc configuration..."
echo ""

if [ -f ~/.config/labwc/rc.xml ]; then
    echo "✅ labwc config exists at ~/.config/labwc/rc.xml"
    echo ""
    echo "Contents:"
    cat ~/.config/labwc/rc.xml
else
    echo "❌ labwc config NOT FOUND at ~/.config/labwc/rc.xml"
fi

echo ""
echo "Current display state:"
wlr-randr | grep -A 3 "HDMI-A-1"
