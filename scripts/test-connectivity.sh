#!/bin/bash
# Test connectivity to backend servers

MAC_IP="192.168.100.247"

echo "Testing connectivity to development servers..."
echo ""

echo "1. Testing frontend (Vite) on port 5173:"
if curl -s -o /dev/null -w "%{http_code}" http://${MAC_IP}:5173 | grep -q "200"; then
    echo "   ✅ Frontend accessible"
else
    echo "   ❌ Frontend NOT accessible"
fi
echo ""

echo "2. Testing backend (Rails) on port 3000:"
if curl -s -o /dev/null -w "%{http_code}" http://${MAC_IP}:3000 | grep -q "200"; then
    echo "   ✅ Backend accessible"
else
    echo "   ❌ Backend NOT accessible"
fi
echo ""

echo "3. Testing API endpoint:"
response=$(curl -s -w "\n%{http_code}" http://${MAC_IP}:3000/api/game_state)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "   ✅ API accessible"
    echo "   Response: $body"
else
    echo "   ❌ API returned HTTP $http_code"
    echo "   Response: $body"
fi
echo ""

echo "4. Testing WebSocket connection:"
echo "   (This is harder to test from command line)"
echo ""

echo "5. Current labwc Chromium configuration:"
grep chromium ~/.config/labwc/rc.xml
echo ""

echo "6. Is Chromium running?"
if pgrep -f chromium > /dev/null; then
    echo "   ✅ Chromium is running"
    echo "   Processes:"
    pgrep -fa chromium | head -3
else
    echo "   ❌ Chromium is NOT running"
fi
