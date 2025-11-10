#!/bin/bash
# Install GPIO daemon and dependencies

set -e

echo "🎮 Installing GPIO daemon for arcade button..."

# Install Python dependencies
echo "📦 Installing Python packages..."
pip3 install RPi.GPIO websocket-client requests

# Make GPIO daemon executable
chmod +x ~/winston-slots/scripts/gpio_daemon.py

# Create systemd service
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/gpio-daemon.service > /dev/null << 'EOF'
[Unit]
Description=Winston Slots GPIO Daemon
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/pi/winston-slots
ExecStart=/usr/bin/python3 /home/pi/winston-slots/scripts/gpio_daemon.py
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=gpio-daemon

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable gpio-daemon.service
sudo systemctl start gpio-daemon.service

echo "✅ GPIO daemon installed and started!"
echo ""
echo "Check status with: sudo systemctl status gpio-daemon"
echo "View logs with: sudo journalctl -u gpio-daemon -f"
echo ""
echo "GPIO Pin Configuration:"
echo "  - Button Switch: GPIO17 → GND"
echo "  - Button LED: GPIO23 → GND (through resistor)"
