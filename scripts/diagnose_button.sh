#!/bin/bash
# Diagnostic script for button press issues

echo "=== Winston Slots Button Diagnostic ==="
echo ""

# Check if GPIO daemon is running
echo "1. Checking GPIO daemon status..."
if systemctl is-active --quiet gpio-daemon.service; then
    echo "✓ GPIO daemon is running"
    systemctl status gpio-daemon.service --no-pager -l | head -20
else
    echo "✗ GPIO daemon is NOT running"
    echo "   Start it with: sudo systemctl start gpio-daemon.service"
fi
echo ""

# Check GPIO daemon logs
echo "2. Recent GPIO daemon logs (last 50 lines)..."
sudo journalctl -u gpio-daemon.service -n 50 --no-pager
echo ""

# Check game state
echo "3. Current game state..."
curl -s http://localhost:3000/api/game_state | python3 -m json.tool || echo "Failed to fetch game state"
echo ""

# Check if button GPIO is configured correctly
echo "4. GPIO configuration..."
if [ -d "/sys/class/gpio/gpio17" ]; then
    echo "✓ Button GPIO 17 is exported"
    echo "   Direction: $(cat /sys/class/gpio/gpio17/direction 2>/dev/null || echo 'error reading')"
    echo "   Value: $(cat /sys/class/gpio/gpio17/value 2>/dev/null || echo 'error reading')"
else
    echo "✗ Button GPIO 17 is NOT exported"
fi

if [ -d "/sys/class/gpio/gpio27" ]; then
    echo "✓ LED GPIO 27 is exported"
    echo "   Direction: $(cat /sys/class/gpio/gpio27/direction 2>/dev/null || echo 'error reading')"
    echo "   Value: $(cat /sys/class/gpio/gpio27/value 2>/dev/null || echo 'error reading')"
else
    echo "✗ LED GPIO 27 is NOT exported"
fi
echo ""

# Monitor button presses in real-time
echo "5. Monitoring for button presses (press Ctrl+C to stop)..."
echo "   Press the button now to test..."
sudo journalctl -u gpio-daemon.service -f --no-pager | grep -i "button"
