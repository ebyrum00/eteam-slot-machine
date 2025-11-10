#!/bin/bash
# Diagnose why display rotation isn't working

echo "=========================================="
echo "DISPLAY ROTATION DIAGNOSTIC"
echo "=========================================="
echo ""

echo "1. Session Type:"
echo "   XDG_SESSION_TYPE = $XDG_SESSION_TYPE"
echo ""

echo "2. Running Display Server/Compositor:"
ps aux | grep -E 'wayfire|Xorg|openbox|lxsession|labwc' | grep -v grep
echo ""

echo "3. Display Output Detection:"
if command -v wlr-randr &> /dev/null; then
    echo "   [Wayland] wlr-randr output:"
    wlr-randr
elif [ -n "$DISPLAY" ]; then
    echo "   [X11] xrandr output:"
    DISPLAY=:0 xrandr
else
    echo "   No display detected"
fi
echo ""

echo "4. Wayfire Config (~/.config/wayfire/wayfire.ini):"
if [ -f ~/.config/wayfire/wayfire.ini ]; then
    cat ~/.config/wayfire/wayfire.ini
else
    echo "   NOT FOUND"
fi
echo ""

echo "5. LXDE Autostart (~/.config/lxsession/LXDE-pi/autostart):"
if [ -f ~/.config/lxsession/LXDE-pi/autostart ]; then
    cat ~/.config/lxsession/LXDE-pi/autostart
else
    echo "   NOT FOUND"
fi
echo ""

echo "6. Boot Config Display Settings (/boot/firmware/config.txt):"
grep -E 'display_|hdmi_|dtoverlay=vc4' /boot/firmware/config.txt | tail -10
echo ""

echo "7. Desktop Environment:"
echo "   DESKTOP_SESSION = $DESKTOP_SESSION"
echo "   XDG_CURRENT_DESKTOP = $XDG_CURRENT_DESKTOP"
echo ""

echo "8. Systemd Session:"
loginctl show-session $(loginctl | grep pi | awk '{print $1}') -p Type 2>/dev/null || echo "   Could not get session info"
echo ""

echo "=========================================="
echo "DIAGNOSIS COMPLETE"
echo "=========================================="
