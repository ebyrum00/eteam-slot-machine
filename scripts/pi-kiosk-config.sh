#!/bin/bash
# Raspberry Pi Kiosk Mode Configuration
# Configures Chromium to launch in kiosk mode on boot

set -e

# Default URL (can be overridden)
KIOSK_URL="${1:-http://localhost:5173?display=tv}"

echo "🖥️  Configuring kiosk mode for URL: $KIOSK_URL"

# Create autostart directory
mkdir -p ~/.config/openbox
mkdir -p ~/.config/lxsession/LXDE-pi

# Create Openbox autostart script
echo "📝 Creating Openbox autostart configuration..."
cat > ~/.config/openbox/autostart << EOF
# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Hide cursor after inactivity
unclutter -idle 0.1 -root &

# Start compositor for smooth animations
compton --backend glx --vsync opengl-swc &

# Launch Chromium in kiosk mode
chromium-browser \\
  --kiosk \\
  --noerrdialogs \\
  --disable-infobars \\
  --disable-session-crashed-bubble \\
  --disable-restore-session-state \\
  --no-first-run \\
  --disable-features=TranslateUI \\
  --disable-component-update \\
  --disable-background-networking \\
  --disable-sync \\
  --disable-background-timer-throttling \\
  --disable-backgrounding-occluded-windows \\
  --disable-breakpad \\
  --disable-component-extensions-with-background-pages \\
  --disable-dev-shm-usage \\
  --disable-extensions \\
  --disable-features=IsolateOrigins,site-per-process \\
  --disable-hang-monitor \\
  --disable-ipc-flooding-protection \\
  --disable-popup-blocking \\
  --disable-prompt-on-repost \\
  --disable-renderer-backgrounding \\
  --enable-features=VaapiVideoDecoder \\
  --enable-gpu-rasterization \\
  --enable-oop-rasterization \\
  --ignore-gpu-blocklist \\
  --use-gl=egl \\
  --enable-accelerated-2d-canvas \\
  --enable-accelerated-video-decode \\
  --num-raster-threads=4 \\
  --force-device-scale-factor=1 \\
  --check-for-update-interval=31536000 \\
  '$KIOSK_URL'
EOF

# Create LXDE autostart
cat > ~/.config/lxsession/LXDE-pi/autostart << EOF
@xset s off
@xset -dpms
@xset s noblank
@openbox-session
EOF

# Make scripts executable
chmod +x ~/.config/openbox/autostart

# Configure autologin
echo "🔐 Configuring autologin..."
sudo mkdir -p /etc/systemd/system/getty@tty1.service.d
sudo tee /etc/systemd/system/getty@tty1.service.d/autologin.conf > /dev/null << EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin pi --noclear %I \$TERM
EOF

# Configure to start X on login
if ! grep -q "startx" ~/.bash_profile 2>/dev/null; then
  echo "🚀 Configuring X to start on login..."
  cat >> ~/.bash_profile << 'EOF'

# Start X on login (tty1 only)
if [ -z "$DISPLAY" ] && [ "$XDG_VTNR" = "1" ]; then
  exec startx
fi
EOF
fi

# Create .xinitrc to launch openbox
cat > ~/.xinitrc << EOF
#!/bin/sh
exec openbox-session
EOF

chmod +x ~/.xinitrc

echo "✅ Kiosk mode configured!"
echo "📍 URL: $KIOSK_URL"
echo ""
echo "To change the URL later, edit: ~/.config/openbox/autostart"
echo "Reboot to start kiosk mode: sudo reboot"
