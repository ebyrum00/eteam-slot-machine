#!/bin/bash
# Debug labwc configuration

echo "=== labwc rc.xml contents ==="
cat ~/.config/labwc/rc.xml
echo ""
echo ""

echo "=== Running Chromium processes ==="
ps aux | grep chromium | grep -v grep
echo ""
echo ""

echo "=== Kill all Chromium and check config ==="
pkill -9 chromium
sleep 2

echo "Config file autostart section:"
grep -A 5 "<autostart>" ~/.config/labwc/rc.xml
