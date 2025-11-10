#!/bin/bash
# Create systemd service for kiosk watchdog (optional)

KIOSK_URL="${1:-http://localhost:5173?display=tv}"

echo "Creating kiosk watchdog service..."

sudo tee /etc/systemd/system/kiosk-watchdog.service > /dev/null << EOF
[Unit]
Description=Kiosk Mode Watchdog
After=graphical.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
Environment=KIOSK_URL=$KIOSK_URL
ExecStart=/home/pi/winston-slots/scripts/pi-watchdog.sh
Restart=always
RestartSec=10

[Install]
WantedBy=graphical.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable kiosk-watchdog.service

echo "✅ Watchdog service created and enabled"
echo "Start with: sudo systemctl start kiosk-watchdog"
